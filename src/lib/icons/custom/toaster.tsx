import { IconSvg, type IconSvgProps } from "@/lib/icons/icon-svg";

export function ToasterIcon({ className }: IconSvgProps) {
  return (
    <IconSvg className={className}>
      <rect x="5" y="8" width="14" height="10" rx="2" />
      <path d="M8 8 V6 A2 2 0 0 1 10 4 H14 A2 2 0 0 1 16 6 V8" />
      <path d="M8 14 H16" />
    </IconSvg>
  );
}
