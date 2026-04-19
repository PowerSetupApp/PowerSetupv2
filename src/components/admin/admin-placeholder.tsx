type AdminPlaceholderProps = {
  title: string;
  description?: string;
};

export function AdminPlaceholder({ title, description }: AdminPlaceholderProps) {
  return (
    <div className="space-y-2">
      <h1 className="font-display text-2xl font-normal tracking-tight text-foreground">{title}</h1>
      {description ? (
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
