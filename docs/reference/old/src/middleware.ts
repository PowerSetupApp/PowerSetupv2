import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Only apply to /admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
        // Admin login is currently disabled for development.
        // The following Basic Auth block is preserved but commented out.
        /*
        const authHeader = request.headers.get('authorization');

        if (!authHeader) {
            return new NextResponse('Authentication required', {
                status: 401,
                headers: {
                    'WWW-Authenticate': 'Basic realm="Admin Area"',
                },
            });
        }

        // Parse Basic Auth header
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        const [username, password] = credentials.split(':');

        const validUsername = process.env.ADMIN_USERNAME || 'admin';
        const validPassword = process.env.ADMIN_PASSWORD;
        if (!validPassword) {
            throw new Error("ADMIN_PASSWORD environment variable is required");
        }

        if (username !== validUsername || password !== validPassword) {
            return new NextResponse('Invalid credentials', {
                status: 401,
                headers: {
                    'WWW-Authenticate': 'Basic realm="Admin Area"',
                },
            });
        }
        */
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/api/admin/:path*'],
};
