"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";

interface ProductCarouselProps {
    products: any[];
    categoryName: string;
}

export function ProductCarousel({ products, categoryName }: ProductCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % products.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    // Get current product
    const currentProduct = products[currentIndex];
    const isMissing = currentProduct?.isMissing ||
        (typeof currentProduct?.id === 'string' && currentProduct.id.startsWith("missing-"));

    return (
        <div className="relative">
            {/* Carousel Container - Fixed single card view */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm relative overflow-hidden">

                {/* Single Card Display */}
                {isMissing ? (
                    // Missing Product Card
                    <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 gap-6 bg-orange-50/50 dark:bg-orange-950/10">
                        <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <div className="max-w-md space-y-2">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                Kein Produkt gefunden
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Für '{categoryName}' konnte keine passende Empfehlung ermittelt werden.
                            </p>
                        </div>
                    </div>
                ) : (
                    // Product Card
                    <Card className="border-0 shadow-none rounded-none bg-transparent h-full">
                        <div className="flex flex-col md:flex-row gap-8 h-full p-6 md:p-8">
                            {/* Image Section */}
                            <div className="relative md:w-1/3 min-h-[250px] flex items-center justify-center bg-white dark:bg-gray-800/50 rounded-2xl p-4">
                                {/* Recommended Badge */}
                                {currentProduct?.isRecommended && (
                                    <div className="absolute top-4 left-4 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded shadow-sm z-10">
                                        Empfohlen
                                    </div>
                                )}

                                {currentProduct?.imageUrl ? (
                                    <div className="relative w-full h-[200px] hover:scale-105 transition-transform duration-500">
                                        <Image
                                            src={currentProduct.imageUrl}
                                            alt={currentProduct.name}
                                            fill
                                            className="object-contain"
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-gray-200">
                                        <span className="text-6xl">📦</span>
                                    </div>
                                )}
                            </div>

                            {/* Content Section */}
                            <div className="md:w-2/3 flex flex-col gap-4 py-2">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                                        {currentProduct?.name}
                                    </h3>
                                </div>

                                <div className="prose prose-sm dark:prose-invert text-gray-500 dark:text-gray-400 text-sm">
                                    <p>{currentProduct?.description || "Keine Beschreibung verfügbar."}</p>
                                </div>

                                {currentProduct?.explanation && (
                                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-lg text-xs text-indigo-800 dark:text-indigo-300 font-medium border border-indigo-100 dark:border-indigo-900/30">
                                        💡 {currentProduct.reason || currentProduct.explanation}
                                    </div>
                                )}

                                <div className="mt-auto pt-4 flex flex-col gap-2">
                                    <Button asChild className="w-full sm:w-auto bg-[#FF9900] hover:bg-[#E68A00] text-white font-bold h-11 rounded-xl shadow-sm px-8">
                                        <a
                                            href={currentProduct?.affiliateUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2"
                                            onClick={(e) => {
                                                const url = currentProduct?.affiliateUrl;
                                                if (!url) return;

                                                // Check for iOS
                                                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent || '') && !(window as any).MSStream;

                                                if (isIOS) {
                                                    e.preventDefault();

                                                    // Construct Deep Link (preserve ALL query params including tag)
                                                    // Standard URL: https://www.amazon.de/dp/B00...
                                                    // Deep Link: com.amazon.mobile.shopping.web://www.amazon.de/dp/B00...
                                                    const deepLink = url.replace(/^https?:\/\//, 'com.amazon.mobile.shopping.web://');

                                                    // Try to open App
                                                    window.location.href = deepLink;

                                                    // Fallback to Browser after delay
                                                    setTimeout(() => {
                                                        // Fallback: open original URL in new tab (standard behavior)
                                                        // We use window.open because we prevented default
                                                        window.open(url, '_blank');
                                                    }, 2500);
                                                }
                                                // Non-iOS devices continue with standard href behavior
                                            }}
                                        >
                                            <span>Auf Amazon ansehen</span>
                                        </a>
                                    </Button>
                                    <div className="text-[10px] text-gray-400 text-center sm:text-left ml-1">
                                        * Enthält Affiliate Links
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Navigation Arrows */}
                {products.length > 1 && (
                    <>
                        <button
                            onClick={prevSlide}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full p-3 shadow-lg hover:scale-110 transition-transform text-gray-700 dark:text-gray-200"
                            aria-label="Vorheriges Produkt"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full p-3 shadow-lg hover:scale-110 transition-transform text-gray-700 dark:text-gray-200"
                            aria-label="Nächstes Produkt"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </>
                )}
            </div>

            {/* Pagination Dots */}
            {products.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    {products.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`transition-all duration-300 rounded-full ${currentIndex === index
                                ? 'w-8 h-2 bg-indigo-600 dark:bg-indigo-400'
                                : 'w-2 h-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400'
                                }`}
                            aria-label={`Gehe zu Produkt ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Slide Counter */}
            {products.length > 1 && (
                <div className="text-center mt-2 text-sm text-gray-500">
                    {currentIndex + 1} / {products.length}
                </div>
            )}
        </div>
    );
}
