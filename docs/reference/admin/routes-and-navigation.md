# Admin routes and navigation

Source: [`../old/src/app/admin/layout.tsx`](../old/src/app/admin/layout.tsx)

## Sidebar (order)

| Label | Path |
|-------|------|
| Dashboard | `/admin` |
| Produkte | `/admin/products` |
| Marken | `/admin/brands` |
| Kategorien | `/admin/categories` |
| Mediathek | `/admin/media` |
| Verbraucher | `/admin/consumer-devices` |
| Verbr.-Kategorien | `/admin/consumer-categories` |
| Ergebnisse | `/admin/results` |
| Einstellungen | `/admin/settings` |

Footer: **Zur Website** → `/` (label uses `LogOut` icon in legacy layout).

## Page routes (App Router)

| Area | Routes |
|------|--------|
| Products | `/admin/products`, `/admin/products/new`, `/admin/products/[id]` |
| Categories | `/admin/categories`, `/admin/categories/new`, `/admin/categories/[id]` |
| Brands | `/admin/brands` (single page + dialogs) |
| Media | `/admin/media` |
| Consumer devices | `/admin/consumer-devices`, `/admin/consumer-devices/new`, `/admin/consumer-devices/[id]` |
| Consumer categories | `/admin/consumer-categories`, `/admin/consumer-categories/new`, `/admin/consumer-categories/[id]` |
| Results | `/admin/results` |
| Settings | `/admin/settings` (client tabs; see [settings-ui.md](settings-ui.md)) |
