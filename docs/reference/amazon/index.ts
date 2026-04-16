import { mockAmazonService } from './mock-amazon-service';
import { amazonService as realAmazonService } from './amazon-service';

export * from './types';
export { mockAmazonService, realAmazonService };

// Allow switching to mock service via environment variable
export const amazonService = process.env.USE_MOCK_AMAZON === 'true'
    ? mockAmazonService
    : realAmazonService;
