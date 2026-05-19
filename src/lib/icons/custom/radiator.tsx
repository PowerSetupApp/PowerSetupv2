import { IconSvg, type IconSvgProps } from "@/lib/icons/icon-svg";

/** Standheizung / Gebläse — vertical fins in a frame. */
export function RadiatorIcon({ className }: IconSvgProps) {
  return (
    <IconSvg className={className}>
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <path d="M8 8 V16 M11 8 V16 M14 8 V16 M17 8 V16" />
    </IconSvg>
  );
}
