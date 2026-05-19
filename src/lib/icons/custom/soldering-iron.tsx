import { IconSvg, type IconSvgProps } from "@/lib/icons/icon-svg";

export function SolderingIronIcon({ className }: IconSvgProps) {
  return (
    <IconSvg className={className}>
      <path d="M4 18 L14 8 L17 11 L7 21 Z" />
      <path d="M14 8 L18 4" />
      <path d="M6 20 L4 22" />
    </IconSvg>
  );
}
