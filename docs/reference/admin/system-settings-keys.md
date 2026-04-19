# System settings keys (`SystemSetting`, prompts, pricing)

Derived from [`../old/src/app/actions/settings.ts`](../old/src/app/actions/settings.ts), [`../old/src/app/actions/general-settings.ts`](../old/src/app/actions/general-settings.ts), and Prisma models in [`../schema.prisma`](../schema.prisma).

## `SystemSetting.key` values (AI + images + specs)

| Key | Purpose |
|-----|---------|
| `ai_provider` | `"google"` \| `"openai"` |
| `ai_model` | Chat model id/name used for recommendations and specs optimization |
| `ai_image_model` | Image generation model id |
| `gemini_api_key` | Google Generative AI key |
| `openai_api_key` | OpenAI key |
| `ai_image_prompt_template` | Prompt for schematic/image generation |
| `ai_specs_optimization_prompt` | Prompt for “Mit KI optimieren” on product specs; must support `{{INPUT}}` |
| `amazon_partner_tag` | Amazon Associates tag (general settings) |

## `PromptVersion` (active user prompt for recommendations)

- `getAISettings()` loads **`userPromptTemplate`** and **`systemPrompt`** from the **active** `PromptVersion` (`isActive: true`, latest by `createdAt`).
- `updateAISettings()` deactivates all active rows, then **creates** a new `PromptVersion` with incremented `version`, `systemPrompt: ""` (legacy empty), and the submitted `userPromptTemplate`.

## Model pricing (`ModelPricing` table)

- Rows keyed by `modelId` with `inputPrice` / `outputPrice` (USD per 1M tokens).
- `fetchAndSaveModelPricing(provider)` upserts models from OpenAI list or a fixed Gemini list, seeding from a built-in `KNOWN_PRICING` map when available.

## Placeholders (AI tab UI)

**Recommendation prompt** quick-insert: `{{PROMPT_FORMAT}}`, `{{PRODUCT_CONTEXT}}`.

**Image prompt** adds: `{{SELECTED_PRODUCTS}}`.

**Specs prompt:** `{{INPUT}}`.
