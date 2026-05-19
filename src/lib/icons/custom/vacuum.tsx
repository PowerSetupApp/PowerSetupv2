import { IconSvg, type IconSvgProps } from "@/lib/icons/icon-svg";

export function VacuumIcon({ className }: IconSvgProps) {
  return (
    <IconSvg className={className}>
      <path d="M6 10 H14 L16 18 H8 Z" />
      <path d="M14 10 L16 6 H19" />
      <circle cx="10" cy="20" r="1.5" />
      <circle cx="14" cy="20" r="1.5" />
      <path d="M10 6 V4 H14 V6" />
    </IconSvg>
  );
}
