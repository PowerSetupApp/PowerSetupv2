# Admin panel — functional reference (legacy-derived)

Design-agnostic inventory of the **old** PowerSetup admin: routes, forms, settings keys, and APIs. Use this when implementing or redesigning the admin in the new app.

**Start here (agents):** [ADMIN-AGENT-BRIEF.md](../ADMIN-AGENT-BRIEF.md) — Admin vs Endnutzer, Lesereihenfolge, DoD-Überblick.

| Document | Contents |
|----------|----------|
| [routes-and-navigation.md](routes-and-navigation.md) | Sidebar links, URL map |
| [dashboard.md](dashboard.md) | Dashboard metrics and actions |
| [products.md](products.md) | Product list, edit/create, filters, Amazon, specs AI |
| [categories.md](categories.md) | Category CRUD and per-category filters |
| [brands.md](brands.md) | Brands list, wizard mapping, types |
| [consumer-devices-and-categories.md](consumer-devices-and-categories.md) | Wizard consumer CRUD |
| [media.md](media.md) | Mediathek vs modal upload |
| [results.md](results.md) | Results table, cost estimate, links |
| [settings-ui.md](settings-ui.md) | Settings tabs and form sections |
| [system-settings-keys.md](system-settings-keys.md) | `SystemSetting` keys, `PromptVersion`, pricing |
| [api-routes.md](api-routes.md) | ` /api/admin/*` routes in snapshot |

**Source tree:** [`../old/`](../old/README.md)  
**Data model:** [`../schema.prisma`](../schema.prisma)  
**Feature spec (checklist):** [`../../../features/PS-7-admin-panel.md`](../../../features/PS-7-admin-panel.md)
