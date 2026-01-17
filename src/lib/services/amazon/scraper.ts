import * as cheerio from 'cheerio';
import { AmazonItem } from './types';

/**
 * Scrapes Amazon product page to extract basic details.
 * Mimics the structure of AmazonItem so it can be fed into the AI extractor.
 */
export async function scrapeAmazonProduct(urlOrAsin: string): Promise<AmazonItem | null> {
    const asin = extractAsin(urlOrAsin);
    if (!asin) {
        throw new Error('Could not extract ASIN from input');
    }

    const url = `https://www.amazon.de/dp/${asin}`;
    console.log(`[AmazonScraper] Scraping URL: ${url}`);

    try {
        // Random delay to mimic human behavior (1-3 seconds)
        const delay = Math.floor(Math.random() * 2000) + 1000;
        await new Promise(r => setTimeout(r, delay));

        const response = await fetch(url, {
            headers: {
                // Mimic a real browser to avoid simple blocking
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            }
        });

        if (!response.ok) {
            if (response.status === 503) {
                console.error('[AmazonScraper] 503 Service Unavailable - Likely CAPTCHA or blocking.');
                throw new Error('Amazon hat den Zugriff blockiert (CAPTCHA/Bot-Schutz). Bitte versuche es später oder nutze einen anderen Link.');
            }
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Amazon responded with ${response.status}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Check for CAPTCHA title
        const title = $('title').text();
        if (title.includes('Robot Check') || title.includes('CAPTCHA')) {
            throw new Error('Amazon CAPTCHA detected.');
        }

        // --- Extraction Strategies ---

        // 1. Title
        const productTitle = $('#productTitle').text().trim();

        // 2. Brand
        // "Besuchen Sie den Victron Energy-Store" -> "Victron Energy"
        const brandText = $('#bylineInfo').text().trim() || $('#bylineInfo_feature_div').text().trim();
        let brand = brandText.replace('Besuchen Sie den', '').replace('-Store', '').replace('Marke:', '').trim();

        // 3. Price
        // Strategies: .a-price-whole, #price_inside_buybox, .a-color-price
        let priceAmount = 0;
        const priceWhole = $('.a-price-whole').first().text().replace(/[^0-9]/g, '');
        const priceFraction = $('.a-price-fraction').first().text().replace(/[^0-9]/g, '');

        if (priceWhole) {
            priceAmount = parseFloat(`${priceWhole}.${priceFraction || '00'}`);
        } else {
            // Fallback for older layouts
            const rawPrice = $('#price_inside_buybox').text() || $('.a-color-price').first().text();
            // "25,99 €" -> 25.99
            const match = rawPrice.match(/([0-9]+)[.,]([0-9]{2})/);
            if (match) {
                priceAmount = parseFloat(`${match[1]}.${match[2]}`);
            }
        }

        // 4. Features (Bullet Points)
        const features: string[] = [];
        $('#feature-bullets li span.a-list-item').each((_, el) => {
            const text = $(el).text().trim();
            if (text) features.push(text);
        });

        // 5. Images
        // Try to find the dynamic image data
        let mainImage = $('#landingImage').attr('src');
        // Sometimes hidden in data attributes
        if (!mainImage) {
            const dynamicImage = $('#landingImage').attr('data-a-dynamic-image');
            if (dynamicImage) {
                try {
                    const json = JSON.parse(dynamicImage);
                    // Get the largest image (keys are URLs)
                    mainImage = Object.keys(json)[0];
                } catch (e) { /* ignore */ }
            }
        }

        // 6. Technical Details (Table)
        const technicalDetails: Array<{ name: string, value: string }> = [];
        $('#productDetails_techSpec_section_1 tr').each((_, el) => {
            const name = $(el).find('th').text().trim();
            const value = $(el).find('td').text().trim();
            if (name && value) {
                technicalDetails.push({ name, value });
            }
        });

        // Construct AmazonItem
        const item: AmazonItem = {
            asin: asin,
            detailPageUrl: url,
            itemInfo: {
                title: { displayValue: productTitle },
                byLineInfo: { brand: { displayValue: brand } },
                features: { displayValues: features },
                technicalInfo: { technicalDetails },
                // Create a basic product info structure if we found dimensions (hard to parse reliably from HTML but AI might find it in features)
                productInfo: {},
            },
            images: {
                primary: {
                    large: { url: mainImage }
                }
            },
            offers: {
                listings: [{
                    price: {
                        amount: priceAmount,
                        currency: 'EUR',
                        displayAmount: `${priceAmount.toFixed(2)} €`
                    },
                    availability: { message: 'In Stock' } // Assumption
                }]
            }
        };

        if (!productTitle) {
            console.warn('[AmazonScraper] Failed to extract title. HTML might be obfuscated or different layout.');
        }

        return item;

    } catch (error) {
        console.error('[AmazonScraper] Error:', error);
        throw error;
    }
}

function extractAsin(input: string): string | null {
    const trimmed = input.trim();
    if (/^[A-Z0-9]{10}$/i.test(trimmed)) return trimmed.toUpperCase();
    const match = trimmed.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i);
    return match ? match[1].toUpperCase() : null;
}
