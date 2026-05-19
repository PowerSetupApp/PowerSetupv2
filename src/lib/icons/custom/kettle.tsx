import { IconSvg, type IconSvgProps } from "@/lib/icons/icon-svg";

export function KettleIcon({ className }: IconSvgProps) {
  return (
    <IconSvg className={className}>
      <path d="M5 10 H17 A3 3 0 0 1 17 16 H7 A3 3 0 0 1 7 10 Z" />
      <path d="M17 10 V8 A2 2 0 0 0 15 6 H9" />
      <path d="M5 13 H3" />
      <path d="M10 6 V4 M13 5 V3" />
    </IconSvg>
  );
}
