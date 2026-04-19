export function PaperBackground({ className }: { className?: string }) {
    return (
        <div className={`fixed inset-0 -z-10 pointer-events-none overflow-hidden ${className}`}>
            {/* Base Color - Cream/Cornsilk */}
            <div className="absolute inset-0 bg-cornsilk-50" />

            {/* Technical Grid Pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                        {/* Major Grid Lines */}
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-olive-leaf-800" />
                        {/* Minor Grid Lines (Subdivisions) */}
                        <path d="M 10 0 L 10 40 M 20 0 L 20 40 M 30 0 L 30 40 M 0 10 L 40 10 M 0 20 L 40 20 M 0 30 L 40 30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-olive-leaf-600" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pattern)" />
            </svg>

            {/* Existing Texture SVG Overlay (Paper Noise) */}
            <svg className="absolute inset-0 w-full h-full opacity-20">
                <filter id="paper-noise">
                    <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                    <feBlend in="SourceGraphic" mode="multiply" />
                </filter>
                <rect width="100%" height="100%" filter="url(#paper-noise)" />
            </svg>

            {/* Vignette Overlay for Depth */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-cornsilk-200/40 opacity-30" />
        </div>
    )
}
