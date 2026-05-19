import { IconSvg, type IconSvgProps } from "@/lib/icons/icon-svg";

export function FuseBoxIcon({ className }: IconSvgProps) {
  return (
    <IconSvg className={className}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 9 H16 M8 12 H16 M8 15 H13" />
      <circle cx="7" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="7" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="7" cy="15" r="1" fill="currentColor" stroke="none" />
    </IconSvg>
  );
}
