'use server';

/**
 * Server Action for importing products from Amazon with AI extraction.
 * Orchestrates: ASIN -> Amazon API -> AI Extraction -> Create Draft Product
 */

import { prisma } from '@/lib/db';
import { amazonService } from '@/lib/services/amazon';
import { scrapeAmazonProduct } from '@/lib/services/amazon/scraper';
import { extractProductData } from '@/lib/services/ai/product-extractor';
import { revalidatePath } from 'next/cache';

interface ImportResult {
    success: boolean;
    productId?: string;
    error?: string;
    extractedData?: {
        name: string;
        brandName: string | null;
        suggestedBrandName: string | null; // Brand name when no match found - for UI suggestion
        voltageV: number | null;
        currentA: number | null;
    };
}

/**
 * Downloads an image from a URL and uploads it to Vercel Blob storage.
 * Returns the Blob URL or null if failed.
 */
async function downloadAndUploadImage(url: string, asin: string): Promise<string | null> {
    try {
        console.log(`[ImportAction] Downloading image from: ${url}`);

        // Use headers to mimic browser request (Amazon blocks server-side requests without proper headers)
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
                'Referer': 'https://www.amazon.de/',
            }
        });

        if (!response.ok) {
            console.error(`[ImportAction] Failed to fetch image: ${response.status} ${response.statusText}`);
            return null;
        }

        // Get ArrayBuffer and convert to Buffer for Node.js compatibility
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(`[ImportAction] Image downloaded, size: ${buffer.byteLength} bytes`);

        // Upload to Vercel Blob
        const { put } = await import('@vercel/blob');
        const result = await put(`product-images/${asin}.jpg`, buffer, {
            access: 'public',
            addRandomSuffix: true,
            contentType: 'image/jpeg'
        });

        console.log(`[ImportAction] Image uploaded to Blob: ${result.url}`);
        return result.url;
    } catch (error) {
        console.error('[ImportAction] Failed to download/upload image:', error);
        return null;
    }
}

/**
 * Extracts ASIN from an Amazon URL or returns the input if it's already an ASIN.
 */
function extractAsin(input: string): string | null {
    const trimmed = input.trim();

    // If it looks like a raw ASIN (10 alphanumeric chars, starting with B usually)
    if (/^[A-Z0-9]{10}$/i.test(trimmed)) {
        return trimmed.toUpperCase();
    }

    // Try to extract from URL
    const match = trimmed.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i);
    if (match) {
        return match[1].toUpperCase();
    }

    return null;
}

/**
 * Main import action.
 * Creates a draft product (isActive: false) with extracted data.
 */
export async function importProductFromAmazon(
    asinOrUrl: string,
    categoryId: string,
    mode: 'api' | 'scrape' = 'api'
): Promise<ImportResult> {
    try {
        // 1. Extract/validate ASIN
        const asin = extractAsin(asinOrUrl);
        if (!asin) {
            return { success: false, error: 'Ungültige ASIN oder Amazon-URL.' };
        }

        // 2. Validate category exists
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
        });
        if (!category) {
            return { success: false, error: 'Kategorie nicht gefunden.' };
        }

        console.log(`[ImportAction] Starting import for ASIN: ${asin}, Category: ${category.slug}`);

        // 3. Fetch from Amazon API or Scraper
        let amazonItem;

        if (mode === 'scrape') {
            console.log(`[ImportAction] Mode: SCRAPE - Fetching via Cheerio...`);
            amazonItem = await scrapeAmazonProduct(asin);
        } else {
            console.log(`[ImportAction] Mode: API - Fetching via Creators API...`);
            amazonItem = await amazonService.getItem(asin);
        }

        if (!amazonItem) {
            return { success: false, error: `Produkt mit ASIN "${asin}" nicht auf Amazon ${mode === 'scrape' ? '(via Scraper)' : ''} gefunden.` };
        }

        // 4. AI Extraction
        const extractedData = await extractProductData(amazonItem, category.slug);

        // 5. Try to match brand by name (improved matching)
        let brandId: string | null = null;
        if (extractedData.brandName) {
            // Try exact match first, then partial match
            const brandNameLower = extractedData.brandName.toLowerCase().trim();
            const matchedBrand = await prisma.brand.findFirst({
                where: {
                    OR: [
                        // Exact match (case insensitive)
                        { name: { equals: extractedData.brandName, mode: 'insensitive' } },
                        // Partial match - brand name contains search or vice versa
                        { name: { contains: extractedData.brandName, mode: 'insensitive' } },
                    ],
                    isActive: true,
                },
            });
            if (matchedBrand) {
                brandId = matchedBrand.id;
                console.log(`[ImportAction] Matched brand: ${matchedBrand.name}`);
            } else {
                console.log(`[ImportAction] No brand match for: "${extractedData.brandName}"`);
            }
        }

        // 6. Download image to Blob storage (if Amazon URL)
        let imageUrl = extractedData.imageUrl;
        if (imageUrl && (imageUrl.includes('amazon.com') || imageUrl.includes('media-amazon.com'))) {
            console.log('[ImportAction] Downloading image to Blob storage...');
            try {
                const blobUrl = await downloadAndUploadImage(imageUrl, asin);
                if (blobUrl) {
                    imageUrl = blobUrl;
                    console.log('[ImportAction] Image URL updated to Blob:', imageUrl);
                } else {
                    console.warn('[ImportAction] Blob upload returned null, using Amazon URL as fallback');
                }
            } catch (uploadError) {
                console.error('[ImportAction] Blob upload failed, using Amazon URL as fallback:', uploadError);
            }
        }

        // Map extracted data to dynamic filterValues
        const filterValues: Record<string, any> = {};

        // Brand
        if (brandId) filterValues['brand'] = brandId;

        // Common mappings
        if (extractedData.voltageV) filterValues['voltageV'] = extractedData.voltageV;
        if (extractedData.capacityAh) filterValues['capacityAh'] = extractedData.capacityAh;
        if (extractedData.batteryType) filterValues['batteryType'] = extractedData.batteryType;
        if (extractedData.powerW) {
            // Check category slug for power mapping ambiguity
            if (category.slug.includes('solar')) filterValues['maxPowerWp'] = extractedData.powerW; // Usually solarWp, but fallback
            else filterValues['maxPowerWp'] = extractedData.powerW; // Inverters
        }
        if (extractedData.solarWp) filterValues['maxPowerWp'] = extractedData.solarWp;

        // Ladebooster & Chargers
        if (extractedData.currentA) filterValues['maxChargeCurrent'] = extractedData.currentA; // "Ladestrom"

        // Specific Ladebooster/DC-DC fields (extracted by product-extractor but not in PRODUCT schema cols)
        // We need to cast extractedData to any or extend the interface to access these if they exist in the extractor return
        const extendedData = extractedData as any;
        if (extendedData.inputVolts) filterValues['inputVoltage'] = extendedData.inputVolts; // Array or value
        if (extendedData.outputVolts) filterValues['outputVoltage'] = extendedData.outputVolts; // Array or value

        // Dimensions/Weight if available
        if (extendedData.dimensions?.length) filterValues['length'] = extendedData.dimensions.length;
        if (extendedData.dimensions?.width) filterValues['width'] = extendedData.dimensions.width;
        if (extendedData.dimensions?.height) filterValues['height'] = extendedData.dimensions.height;
        if (extendedData.weight) filterValues['weight'] = extendedData.weight;

        // 7. Create product (active by default)
        const newProduct = await prisma.product.create({
            data: {
                name: extractedData.name,
                description: extractedData.description,
                price: extractedData.price,
                imageUrl: imageUrl,
                affiliateUrl: extractedData.affiliateUrl,
                asin: extractedData.asin,
                categoryId: categoryId,
                isActive: true, // Active by default
                specs: extractedData.specs,
                // Technical filter fields
                powerW: extractedData.powerW,
                capacityAh: extractedData.capacityAh,
                voltageV: extractedData.voltageV,
                batteryType: extractedData.batteryType,
                currentA: extractedData.currentA,
                crossSectionMm2: extractedData.crossSectionMm2,
                solarWp: extractedData.solarWp,
                supportedVoltages: extractedData.supportedVoltages || undefined,
                maxDischargeA: extractedData.maxDischargeA,
                waveform: extractedData.waveform,
                fuseType: extractedData.fuseType,
                brandId: brandId,
                // NEW: Save dynamic filters
                filterValues: filterValues,
            },
        });

        console.log(`[ImportAction] Created draft product: ${newProduct.id}`);

        // Revalidate product list
        revalidatePath('/admin/products');

        return {
            success: true,
            productId: newProduct.id,
            extractedData: {
                name: extractedData.name,
                brandName: extractedData.brandName,
                suggestedBrandName: !brandId ? extractedData.brandName : null, // Only suggest if not matched
                voltageV: extractedData.voltageV,
                currentA: extractedData.currentA,
            },
        };

    } catch (error) {
        console.error('[ImportAction] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Import.',
        };
    }
}

/**
 * Get all categories for the import dialog dropdown.
 */
export async function getCategoriesForImport() {
    return prisma.category.findMany({
        orderBy: { sortOrder: 'asc' },
        select: {
            id: true,
            name: true,
            slug: true,
        },
    });
}
