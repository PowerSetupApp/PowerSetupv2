import type { ComponentType } from "react";

import type { IconKey } from "@/lib/icons/icon-keys";

export type IconComponent = ComponentType<{ className?: string }>;

export type IconRegistry = Record<IconKey, IconComponent>;
