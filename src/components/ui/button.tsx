import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-display font-semibold tracking-tight transition-[color,background-color,border-color,box-shadow,transform] duration-[var(--duration-base)] ease-[var(--ease-out)] disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-border-focus focus-visible:ring-[3px] focus-visible:ring-[color-mix(in_oklch,var(--amber-400)_35%,transparent)] cursor-pointer active:scale-[0.99] motion-reduce:active:scale-100",
  {
    variants: {
      variant: {
        default:
          "border border-amber-500 bg-amber-400 text-charcoal-700 shadow-sm hover:bg-amber-300 hover:shadow-md dark:text-charcoal-700",
        primary:
          "border border-amber-500 bg-amber-400 text-charcoal-700 shadow-sm hover:bg-amber-300 hover:shadow-md dark:text-charcoal-700",
        secondary:
          "border border-border-2 bg-bg-2 text-fg-1 shadow-none hover:bg-sand-50 dark:hover:bg-charcoal-500",
        dark:
          "border border-charcoal-500 bg-charcoal-600 text-sand-50 shadow-[var(--shadow-sm)] hover:bg-charcoal-500",
        ghost:
          "border border-transparent bg-transparent text-fg-1 hover:bg-sand-100 dark:hover:bg-charcoal-500",
        danger:
          "border border-rust-100 bg-bg-2 text-rust-700 hover:bg-rust-50 dark:border-rust-300 dark:text-rust-50 dark:hover:bg-rust-500/20",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/25 dark:bg-destructive/70",
        outline:
          "border border-border-2 bg-bg-2 text-fg-1 shadow-none hover:bg-sand-50 hover:border-border-2 dark:hover:bg-charcoal-500",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 rounded-[var(--radius-md)] px-4 py-2 text-sm has-[>svg]:px-3",
        sm: "h-8 rounded-[var(--radius-sm)] px-3 text-xs gap-1.5 has-[>svg]:px-2.5",
        md: "h-10 rounded-[var(--radius-md)] px-4 text-[13.5px]",
        lg: "h-12 min-h-12 rounded-[var(--radius-md)] px-6 text-[15px]",
        icon: "size-10 rounded-[var(--radius-md)] p-0",
        "icon-sm": "size-8 rounded-[var(--radius-sm)] p-0",
        "icon-lg": "size-12 rounded-[var(--radius-md)] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  iconLeft,
  iconRight,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
  }) {
  const Comp = asChild ? Slot : "button";

  if (asChild) {
    return (
      <Comp
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {iconLeft}
      {children}
      {iconRight}
    </Comp>
  );
}

export { Button, buttonVariants };
