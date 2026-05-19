import { IconSvg, type IconSvgProps } from "@/lib/icons/icon-svg";

/** Water droplet — Wasserpumpe / Frischwasser. */
export function WaterPumpIcon({ className }: IconSvgProps) {
  return (
    <IconSvg className={className}>
      <path d="M12 3 C12 3 6 11 6 15 A6 6 0 0 0 18 15 C18 11 12 3 12 3 Z" />
    </IconSvg>
  );
}
