/**
 * Amazon Creators API v2.2 Service
 * Uses the official @amzn/creatorsapi-nodejs-sdk for product lookup.
 */

import { IAmazonService, AmazonItem } from './types';
// @ts-ignore - SDK might not have types or is local
import { ApiClient, DefaultApi, GetItemsRequestContent } from '@amzn/creatorsapi-nodejs-sdk';

/**
 * Amazon Creators API Service implementation using the official SDK.
 */
class AmazonService implements IAmazonService {
    private api: any;
    private initialized: boolean = false;

    constructor() {
        this.initialize();
    }

    private initialize() {
        if (this.initialized) return;

        const clientId = process.env.AMAZON_CLIENT_ID;
        const clientSecret = process.env.AMAZON_CLIENT_SECRET;
        const partnerTag = process.env.AMAZON_PARTNER_TAG;

        const missingVars: string[] = [];
        if (!clientId) missingVars.push('AMAZON_CLIENT_ID');
        if (!clientSecret) missingVars.push('AMAZON_CLIENT_SECRET');
        if (!partnerTag) missingVars.push('AMAZON_PARTNER_TAG');

        if (missingVars.length > 0) {
            console.warn(`[AmazonService] Credentials missing: ${missingVars.join(', ')}. Service will fail if used.`);
            // store error to throw it later when used? 
            // For now, we leave initialized=false so getItem throws.
            return;
        }

        try {
            const apiClient = new ApiClient();
            // @ts-ignore
            apiClient.credentialId = clientId;
            // @ts-ignore
            apiClient.credentialSecret = clientSecret;
            // "2.2" is typically for EU region. 
            apiClient.version = "2.2";

            this.api = new DefaultApi(apiClient);
            this.initialized = true;
            console.log('[AmazonService] SDK Initialized.');
        } catch (error) {
            console.error('[AmazonService] Failed to initialize SDK:', error);
        }
    }

    /**
     * Fetch product data by ASIN from Amazon Creators API.
     */
    async getItem(asin: string): Promise<AmazonItem | null> {
        if (!this.initialized) {
            this.initialize();
            if (!this.initialized) {
                // Diagnose why
                const missingVars: string[] = [];
                if (!process.env.AMAZON_CLIENT_ID) missingVars.push('AMAZON_CLIENT_ID');
                if (!process.env.AMAZON_CLIENT_SECRET) missingVars.push('AMAZON_CLIENT_SECRET');
                if (!process.env.AMAZON_PARTNER_TAG) missingVars.push('AMAZON_PARTNER_TAG');

                if (missingVars.length > 0) {
                    throw new Error(`Amazon Service Configuration Error: Missing environment variables: ${missingVars.join(', ')}`);
                }
                throw new Error('Amazon Service not active (unknown initialization failure).');
            }
        }

        const partnerTag = process.env.AMAZON_PARTNER_TAG;
        if (!partnerTag) {
            throw new Error('Amazon Service Configuration Error: AMAZON_PARTNER_TAG is defined but missing at runtime.');
        }

        const normalizedAsin = asin.toUpperCase().trim();
        console.log(`[AmazonService] Fetching item: ${normalizedAsin}`);

        try {
            // Marketplace typically matches the endpoint/region (e.g. www.amazon.de for Germany)
            // We can infer or config this. For now default to amazon.de
            const marketplace = "www.amazon.de";

            const getItemsRequest = new GetItemsRequestContent();
            getItemsRequest.partnerTag = partnerTag;
            getItemsRequest.itemIds = [normalizedAsin];
            getItemsRequest.resources = [
                'images.primary.large',
                'images.primary.medium',
                'itemInfo.title',
                'itemInfo.byLineInfo',
                'itemInfo.features',
                'itemInfo.technicalInfo',
                'itemInfo.productInfo',
                'itemInfo.classifications',
                'offersV2.listings.price',
                'offersV2.listings.availability',
            ];

            // Note: The SDK methods are async/promise-based.
            const response = await this.api.getItems(marketplace, getItemsRequest);

            if (!response || !response.itemsResult || !response.itemsResult.items || response.itemsResult.items.length === 0) {
                console.log(`[AmazonService] No item found for ASIN: ${normalizedAsin}`);
                return null;
            }

            const item = response.itemsResult.items[0];
            console.log(`[AmazonService] Successfully fetched: ${item.itemInfo?.title?.displayValue}`);

            return item as AmazonItem;

        } catch (error: any) {
            console.error('[AmazonService] Error fetching item:', error);
            // The SDK might return errors in a specific format, try to log useful parts
            if (error && error.response) {
                console.error('API Response Status:', error.response.status);
                console.error('API Response Text:', error.response.text);
                if (error.response.body) {
                    console.error('API Response Body:', JSON.stringify(error.response.body, null, 2));
                }
            }
            throw new Error(`Amazon API Error: ${error.message || 'Unknown error'}`);
        }
    }
}

// Export singleton instance
export const amazonService = new AmazonService();

