
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
import dotenv from "dotenv";
import { URL } from "url";
import fs from "fs";
import path from "path";
import https from "https";

dotenv.config();

const { Pool } = pkg;

async function downloadImage(url: string, filepath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download image: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { }); // Delete the file async. (But we don't check the result)
            reject(err);
        });
    });
}

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL environment variable is not set");
    }

    const url = new URL(connectionString);
    const pool = new Pool({
        connectionString,
        ssl: {
            rejectUnauthorized: false,
            servername: url.hostname
        }
    });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const products = await prisma.product.findMany({
            where: {
                imageUrl: {
                    contains: 'm.media-amazon.com',
                },
            },
        });

        console.log(`Found ${products.length} products with Amazon images.`);

        const imagesDir = path.join(process.cwd(), "public", "images", "products");
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        for (const product of products) {
            if (!product.imageUrl) continue;

            const extension = path.extname(product.imageUrl).split('?')[0] || '.jpg';
            const filename = `${product.id}${extension}`;
            const filepath = path.join(imagesDir, filename);
            const publicPath = `/images/products/${filename}`;

            console.log(`Downloading ${product.imageUrl} to ${filepath}...`);

            try {
                await downloadImage(product.imageUrl, filepath);

                await prisma.product.update({
                    where: { id: product.id },
                    data: { imageUrl: publicPath },
                });
                console.log(`Updated product ${product.name} (${product.id})`);
            } catch (error) {
                console.error(`Failed to process product ${product.id}:`, error);
            }
        }

    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
