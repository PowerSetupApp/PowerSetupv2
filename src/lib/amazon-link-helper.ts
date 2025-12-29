export function getAmazonLink(url: string, tag?: string): string {
    if (!url || !tag) return url;

    try {
        const urlObj = new URL(url);
        urlObj.searchParams.set("tag", tag);
        return urlObj.toString();
    } catch (e) {
        // If URL parsing fails (e.g. relative URL or invalid), try basic string manipulation or return original
        // Assuming most affiliate links are absolute URLs.
        console.warn("Invalid URL for Amazon tag appending:", url);
        return url;
    }
}
