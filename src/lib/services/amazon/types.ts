/**
 * Types for Amazon Creators API responses (camelCase convention)
 * These types mirror the new Amazon Creators API structure (launching Jan 31, 2026).
 */

// Main response from GetItems operation
export interface AmazonGetItemsResponse {
    itemsResult?: {
        items?: AmazonItem[];
    };
    errors?: AmazonError[];
}

export interface AmazonItem {
    asin: string;
    detailPageUrl?: string;
    itemInfo?: AmazonItemInfo;
    images?: AmazonImages;
    offers?: AmazonOffers;
}

export interface AmazonItemInfo {
    title?: {
        displayValue?: string;
    };
    byLineInfo?: {
        brand?: {
            displayValue?: string;
        };
        manufacturer?: {
            displayValue?: string;
        };
    };
    features?: {
        displayValues?: string[];
    };
    productInfo?: {
        itemDimensions?: {
            height?: { displayValue?: number; unit?: string };
            length?: { displayValue?: number; unit?: string };
            width?: { displayValue?: number; unit?: string };
            weight?: { displayValue?: number; unit?: string };
        };
    };
    technicalInfo?: {
        technicalDetails?: Array<{
            name?: string;
            value?: string;
        }>;
    };
    classifications?: {
        productGroup?: {
            displayValue?: string;
        };
    };
}

export interface AmazonImages {
    primary?: {
        large?: {
            url?: string;
            height?: number;
            width?: number;
        };
        medium?: {
            url?: string;
        };
    };
    variants?: Array<{
        large?: { url?: string };
        medium?: { url?: string };
    }>;
}

export interface AmazonOffers {
    listings?: Array<{
        price?: {
            displayAmount?: string;
            amount?: number;
            currency?: string;
        };
        availability?: {
            message?: string;
            type?: string;
        };
    }>;
}

export interface AmazonError {
    code?: string;
    message?: string;
}

// Service interface for dependency injection
export interface IAmazonService {
    getItem(asin: string): Promise<AmazonItem | null>;
}
