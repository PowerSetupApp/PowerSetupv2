import { Zap, Tent, Sun, Plug } from 'lucide-react';

export function FloatingIcons() {
    return (
        <div className="fixed inset-0 -z-5 pointer-events-none overflow-hidden select-none hidden sm:block">
            {/* Floating Elements - Hidden on mobile to prevent clutter, as requested */}
            <Tent className="absolute top-[15%] left-[5%] w-16 h-16 text-olive-leaf-300/40 animate-[float_6s_ease-in-out_infinite]" />
            <Sun className="absolute top-[10%] right-[8%] w-20 h-20 text-cornsilk-400/50 animate-[spin_20s_linear_infinite]" />
            <Zap className="absolute bottom-[20%] left-[8%] w-12 h-12 text-sunlit-clay-300/40 animate-[float_5s_ease-in-out_infinite_1s]" />
            <Plug className="absolute bottom-[15%] right-[5%] w-14 h-14 text-black-forest-300/40 animate-[wiggle_4s_ease-in-out_infinite]" />
        </div>
    )
}
