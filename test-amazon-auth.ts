
/**
 * Diagnostic script to test Amazon Creators API Authentication via SDK
 * Run with: npx tsx test-amazon-auth.ts
 */

import { config } from 'dotenv';
config(); // Load .env file

import { amazonService } from './src/lib/services/amazon/amazon-service';

async function runTests() {
    console.log('--- Amazon SDK Integration Test ---');

    // Check env vars presence
    const missing = [];
    if (!process.env.AMAZON_CLIENT_ID) missing.push('AMAZON_CLIENT_ID');
    if (!process.env.AMAZON_CLIENT_SECRET) missing.push('AMAZON_CLIENT_SECRET');
    if (!process.env.AMAZON_PARTNER_TAG) missing.push('AMAZON_PARTNER_TAG');

    if (missing.length > 0) {
        console.error(`❌ Missing Environment Variables: ${missing.join(', ')}`);
        process.exit(1);
    }

    const TEST_ASIN = 'B0DLFMFBJW'; // Example ASIN from SDK sample

    console.log(`Testing getItem() with ASIN: ${TEST_ASIN}...`);

    try {
        const item = await amazonService.getItem(TEST_ASIN);

        if (item) {
            console.log('✅ SUCCESS!');
            console.log('   Item found:', item.itemInfo?.title?.displayValue);
            console.log('   Feature:', item.itemInfo?.features?.displayValues?.[0]?.substring(0, 50) + '...');
        } else {
            console.log('❌ FAILED (Null response)');
            console.log('   The API returned no item, but no error was thrown.');
        }
    } catch (error: any) {
        console.log('❌ EXCEPTION:', error.message);
        if (error.cause) {
            console.log('   Cause:', error.cause);
        }
    }
}

runTests();
