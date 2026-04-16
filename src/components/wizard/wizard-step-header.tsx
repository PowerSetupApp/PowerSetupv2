import { cn } from "@/lib/utils";

export interface WizardStepHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function WizardStepHeader({ title, description, className }: WizardStepHeaderProps) {
  return (
    <header className={cn("space-y-2", className)}>
      <h1 className="font-display text-2xl font-normal leading-tight tracking-tight text-balance text-foreground sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="max-w-prose text-base leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}
