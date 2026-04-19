type AdminDbBannerProps = {
  message: string;
};

export function AdminDbUnavailableBanner({ message }: AdminDbBannerProps) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
    >
      <p className="font-medium text-amber-950 dark:text-amber-100">Datenbank nicht erreichbar</p>
      <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">{message}</p>
    </div>
  );
}
