/**
 * Appends an Amazon Partner Tag to a given URL.
 * Checks if the URL is an Amazon URL before appending.
 * Handles existing query parameters correctly.
 * 
 * @param url The product URL
 * @param tag The Amazon Partner Tag (e.g. "test-21")
 * @returns The URL with the tag appended
 */
export function appendAmazonTag(url: string, tag: string): string {
    if (!url || !tag) return url;

    try {
        // Basic check if it's an amazon URL to avoid tagging non-amazon links
        // Adjust regex as needed for different amazon domains (.com, .de, etc.)
        if (!url.match(/amazon\./i) && !url.match(/amzn\./i)) {
            return url;
        }

        const urlObj = new URL(url);
        urlObj.searchParams.set("tag", tag);
        return urlObj.toString();
    } catch (e) {
        // Fallback for relative URLs or invalid URLs
        return url;
    }
}
