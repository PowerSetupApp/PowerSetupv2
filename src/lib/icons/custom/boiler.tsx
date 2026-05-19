import { IconSvg, type IconSvgProps } from "@/lib/icons/icon-svg";

/** Warmwasserboiler — tank with heat lines. */
export function BoilerIcon({ className }: IconSvgProps) {
  return (
    <IconSvg className={className}>
      <rect x="7" y="5" width="10" height="14" rx="2" />
      <path d="M10 9 H14 M10 12 H14 M10 15 H14" />
      <path d="M12 2 V5" />
    </IconSvg>
  );
}
