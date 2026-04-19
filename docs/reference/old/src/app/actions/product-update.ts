'use server';

import { prisma } from '@/lib/db';
import { amazonService } from '@/lib/services/amazon';
import { scrapeAmazonProduct } from '@/lib/services/amazon/scraper';
import { extractProductData } from '@/lib/services/ai/product-extractor';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

interface UpdateOptions {
    onlyFillMissing: boolean;
}

interface UpdateResult {
    success: boolean;
    error?: string;
    details?: string;
}

/**
 * Updates an existing product with data from Amazon (API or Scraper).
 * Validates ASIN from existing product.
 */
export async function updateProductFromAmazon(
    productId: string,
    mode: 'api' | 'scrape',
    options: UpdateOptions
): Promise<UpdateResult> {
    try {
        // 1. Fetch existing product
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { category: true } // Need category slug for AI
        });

        if (!product) {
            return { success: false, error: 'Produkt nicht gefunden.' };
        }

        if (!product.category) {
            return { success: false, error: 'Produkt hat keine Kategorie.' };
        }

        const asin = product.asin;
        if (!asin) {
            return { success: false, error: 'Produkt hat keine ASIN.' };
        }

        console.log(`[UpdateAction] Updating product ${productId} (${asin}) via ${mode}. options:`, options);

        // 2. Fetch from Amazon
        let amazonItem;
        if (mode === 'scrape') {
            amazonItem = await scrapeAmazonProduct(asin);
        } else {
            amazonItem = await amazonService.getItem(asin);
        }

        if (!amazonItem) {
            return { success: false, error: `Keine Daten auf Amazon gefunden (${mode}).` };
        }

        // 3. AI Extraction
        const extractedData = await extractProductData(amazonItem, product.category.slug);

        // DEBUG: Log all extracted data for filter debugging
        console.log('[UpdateAction] === EXTRACTED DATA DEBUG ===');
        console.log('[UpdateAction] Category:', product.category.slug);
        console.log('[UpdateAction] price:', extractedData.price); // Added Debug
        console.log('[UpdateAction] voltageV:', extractedData.voltageV);
        console.log('[UpdateAction] inputVolts:', extractedData.inputVolts);
        console.log('[UpdateAction] outputVolts:', extractedData.outputVolts);
        console.log('[UpdateAction] maxChargeA:', extractedData.maxChargeA);
        console.log('[UpdateAction] maxChargeCurrent:', extractedData.maxChargeCurrent);
        console.log('[UpdateAction] currentA:', extractedData.currentA);
        console.log('[UpdateAction] batteryType:', extractedData.batteryType);
        // ... (truncated logs for brevity in replacement, but keeping core debugs)
        console.log('[UpdateAction] ===========================');

        // 4. Prepare Update Data
        const updateData: Prisma.ProductUpdateInput = {};

        const shouldUpdate = (currentValue: any, newValue: any) => {
            if (newValue === null || newValue === undefined) return false;
            // Always update if current is empty
            if (currentValue === null || currentValue === undefined || currentValue === '') return true;
            // Always update if not "onlyFillMissing"
            if (!options.onlyFillMissing) return true;

            // Format fixes (number vs string)
            if (typeof currentValue !== typeof newValue) {
                console.log(`[UpdateAction] Format mismatch: current="${currentValue}" vs new="${newValue}". Updating.`);
                return true;
            }
            // String case fixes
            if (typeof currentValue === 'string' && typeof newValue === 'string' && currentValue !== newValue) {
                console.log(`[UpdateAction] String mismatch: current="${currentValue}" vs new="${newValue}". Updating.`);
                return true;
            }

            return false;
        };

        if (shouldUpdate(product.name, extractedData.name)) updateData.name = extractedData.name;
        if (shouldUpdate(product.description, extractedData.description)) updateData.description = extractedData.description;
        if (shouldUpdate(product.price, extractedData.price)) updateData.price = extractedData.price;
        if (shouldUpdate(product.affiliateUrl, extractedData.affiliateUrl)) updateData.affiliateUrl = extractedData.affiliateUrl;

        // Image Localization Logic
        if (extractedData.imageUrl) {
            const isCurrentBlob = product.imageUrl?.includes('public.blob.vercel-storage.com');

            // If we have a URL and current is NOT localized (e.g. Amazon link), FORCE upload
            // This bypasses `shouldUpdate` return false if strings are identical
            if (!isCurrentBlob) {
                if (product.asin) {
                    const blobUrl = await downloadAndUploadImage(extractedData.imageUrl, product.asin);
                    if (blobUrl) {
                        updateData.imageUrl = blobUrl;
                    } else {
                        // Fallback: If upload fails, at least save the external URL if needed
                        if (shouldUpdate(product.imageUrl, extractedData.imageUrl)) {
                            updateData.imageUrl = extractedData.imageUrl;
                        }
                    }
                }
            } else {
                // Already localized, but maybe image changed?
                if (shouldUpdate(product.imageUrl, extractedData.imageUrl)) {
                    // Check if new URL is different and NOT blob (unlikely from AI unless it scraped new Amazon img)
                    // If it is different, we might need to re-upload.
                    if (!extractedData.imageUrl.includes('public.blob.vercel-storage.com')) {
                        if (product.asin) {
                            const blobUrl = await downloadAndUploadImage(extractedData.imageUrl, product.asin);
                            if (blobUrl) updateData.imageUrl = blobUrl;
                        }
                    } else {
                        updateData.imageUrl = extractedData.imageUrl;
                    }
                }
            }
        }

        // Spec & Technical Fields
        if (shouldUpdate(product.specs, extractedData.specs)) updateData.specs = extractedData.specs;
        if (shouldUpdate(product.powerW, extractedData.powerW)) updateData.powerW = extractedData.powerW;
        if (shouldUpdate(product.capacityAh, extractedData.capacityAh)) updateData.capacityAh = extractedData.capacityAh;
        if (shouldUpdate(product.voltageV, extractedData.voltageV)) updateData.voltageV = extractedData.voltageV;
        if (shouldUpdate(product.batteryType, extractedData.batteryType)) updateData.batteryType = extractedData.batteryType;
        if (shouldUpdate(product.currentA, extractedData.currentA)) updateData.currentA = extractedData.currentA;
        if (shouldUpdate(product.crossSectionMm2, extractedData.crossSectionMm2)) updateData.crossSectionMm2 = extractedData.crossSectionMm2;
        if (shouldUpdate(product.solarWp, extractedData.solarWp)) updateData.solarWp = extractedData.solarWp;
        if (shouldUpdate(product.maxDischargeA, extractedData.maxDischargeA)) updateData.maxDischargeA = extractedData.maxDischargeA;
        if (shouldUpdate(product.waveform, extractedData.waveform)) updateData.waveform = extractedData.waveform;
        if (shouldUpdate(product.fuseType, extractedData.fuseType)) updateData.fuseType = extractedData.fuseType;

        // Supported Voltages
        if (options.onlyFillMissing) {
            if (!product.supportedVoltages || (product.supportedVoltages as number[]).length === 0) {
                if (extractedData.supportedVoltages && extractedData.supportedVoltages.length > 0) {
                    updateData.supportedVoltages = extractedData.supportedVoltages;
                }
            }
        } else {
            if (extractedData.supportedVoltages) updateData.supportedVoltages = extractedData.supportedVoltages;
        }

        // 5. Merge filterValues
        const existingFilters = (product.filterValues as Record<string, any>) || {};

        const potentialFilterUpdates: Record<string, any> = {
            maxPowerWp: extractedData.solarWp || extractedData.powerW,
            capacityAh: extractedData.capacityAh,
            voltageV: extractedData.voltageV ? `${extractedData.voltageV}V` : undefined,
            maxDischargeA: extractedData.maxDischargeA,
            batteryType: mapBatteryType(extractedData.batteryType),
            constructionType: extractedData.constructionType,
            dimensions_length: extractedData.dimensions_length,
            dimensions_width: extractedData.dimensions_width,
            weight: extractedData.weight,
            maxInputVoltageV: extractedData.maxInputVoltageV,
            maxOutputCurrentA: extractedData.currentA,
            outputVoltage: extractedData.outputVolts?.map(v => `${v}V`) // Solar & Booster Output (Ladebooster "outputVoltage")
                || extractedData.supportedVoltages?.map(v => `${v}V`),
            hasBluetooth: extractedData.hasBluetooth ? 'Ja' : (extractedData.hasBluetooth === false ? 'Nein' : null),
            outputPowerW: extractedData.outputPowerW || extractedData.powerW,
            peakPowerW: extractedData.peakPowerW,
            // Ladebooster "inputVoltage" & Inverter "inputVoltage"
            inputVoltage: extractedData.inputVolts?.map(v => `${v}V`)
                || (extractedData.voltageV ? [`${extractedData.voltageV}V`] : undefined),
            maxChargeCurrent: extractedData.maxChargeCurrent || extractedData.currentA, // Ladebooster "maxChargeCurrent"
            maxChargeA: extractedData.maxChargeA || extractedData.maxChargeCurrent || extractedData.currentA,
            maxAmpere: extractedData.currentA,
            fuseType: mapFuseType(extractedData.fuseType),
            triggerType: mapTriggerType(extractedData.triggerType),
            length: extractedData.dimensions_length,
            crossSectionMm2: extractedData.crossSectionMm2,
        };

        const mergedFilters = { ...existingFilters };

        console.log('[UpdateAction] === EXISTING FILTERS ===', existingFilters);

        Object.keys(potentialFilterUpdates).forEach(key => {
            const newVal = potentialFilterUpdates[key];
            const oldVal = existingFilters[key];
            if (shouldUpdate(oldVal, newVal)) {
                mergedFilters[key] = newVal;
            }
        });

        if ((extractedData as any).filterValues) {
            const extra = (extractedData as any).filterValues;
            Object.keys(extra).forEach(k => {
                if (shouldUpdate(existingFilters[k], extra[k])) mergedFilters[k] = extra[k];
            });
        }

        updateData.filterValues = mergedFilters;

        console.log('[UpdateAction] === FINAL MERGED FILTERS ===', mergedFilters);

        // Brand Logic
        if (extractedData.brandName && (options.onlyFillMissing ? !product.brandId : true)) {
            const brandName = extractedData.brandName.trim();
            const matchedBrand = await prisma.brand.findFirst({
                where: {
                    name: { equals: brandName, mode: 'insensitive' }
                }
            });
            if (matchedBrand) {
                updateData.brand = { connect: { id: matchedBrand.id } };
                mergedFilters['brand'] = matchedBrand.id; // Sync filter if needed
            }
        }

        // 6. DB Update
        await prisma.product.update({
            where: { id: productId },
            data: updateData
        });

        console.log(`[UpdateAction] Success for ${productId}`);
        revalidatePath('/admin/products');
        revalidatePath(`/admin/products/${productId}`);

        return { success: true };

    } catch (error) {
        console.error('[UpdateAction] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unbekannter Fehler'
        };
    }
}

function mapBatteryType(type: string | null): string | null {
    if (!type) return null;
    const t = type.toLowerCase();
    if (t.includes('life') || t.includes('lfp')) return 'LiFePo4';
    if (t.includes('agm')) return 'AGM';
    if (t.includes('gel')) return 'GEL';
    return null;
}

function mapFuseType(type: string | null): string | null {
    if (!type) return null;
    const t = type.toLowerCase();
    if (t.includes('mini')) return 'Mini (ATM) – 5–30 A';
    if (t.includes('standard') || t.includes('ato') || t.includes('atc')) return 'Standard (ATO/ATC) – 5–40 A';
    if (t.includes('maxi')) return 'Maxi (MAXI) – 20–120 A';
    if (t.includes('midi')) return 'Midi Fuse (30–200 A)';
    if (t.includes('mega')) return 'Mega Fuse (80–500 A)';
    if (t.includes('rcd') || t.includes('fi')) return 'FI-Schutzschalter (RCD)';
    if (t.includes('ls') || t.includes('leitungsschutz')) return 'Leitungsschutzschalter (LS)';
    return null;
}

function mapTriggerType(type: string | null): string | null {
    if (!type) return null;
    const t = type.toLowerCase();
    if (t.includes('therm') || t.includes('thermal')) return 'Thermisch';
    if (t.includes('mag') || t.includes('magnetic')) return 'Magnetisch';
    return null;
}

function mapColor(color: string | null): string | null {
    if (!color) return null;
    const c = color.toLowerCase();
    if (c.includes('rot') || c.includes('red')) return 'Rot';
    if (c.includes('schwarz') || c.includes('black')) return 'Schwarz';
    return null;
}

/**
 * Downloads an image from a URL and uploads it to Vercel Blob storage.
 * Returns the Blob URL or null if failed.
 */
async function downloadAndUploadImage(url: string, asin: string): Promise<string | null> {
    try {
        console.log(`[UpdateAction] Downloading image from: ${url}`);

        // Use headers to mimic browser request
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Referer': 'https://www.amazon.de/',
            }
        });

        if (!response.ok) {
            console.error(`[UpdateAction] Failed to fetch image: ${response.status} ${response.statusText}`);
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(`[UpdateAction] Image downloaded, size: ${buffer.byteLength} bytes`);

        // Upload to Vercel Blob
        const { put } = await import('@vercel/blob');
        const result = await put(`product-images/${asin}.jpg`, buffer, {
            access: 'public',
            addRandomSuffix: true,
            contentType: 'image/jpeg'
        });

        console.log(`[UpdateAction] Image uploaded to Blob: ${result.url}`);
        return result.url;
    } catch (error) {
        console.error('[UpdateAction] Failed to download/upload image:', error);
        return null;
    }
}
