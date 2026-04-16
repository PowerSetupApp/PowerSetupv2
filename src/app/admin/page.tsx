export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
      <p className="text-muted-foreground">
        Funktionsflächen und CRUD gemäß PS-7 kommen in Phase 7. Diese Route ist per Basic Auth geschützt
        (<code className="rounded bg-muted px-1 text-sm">ADMIN_PASSWORD</code>, optional{" "}
        <code className="rounded bg-muted px-1 text-sm">ADMIN_USERNAME</code>, Standard{" "}
        <code className="rounded bg-muted px-1 text-sm">admin</code>).
      </p>
    </div>
  );
}
