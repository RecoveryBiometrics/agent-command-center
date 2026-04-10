# Stage 1: Classify

## Inputs
- Post JSON (title, slug, html_content, existing category/language fields)
- Target language (if known) or auto-detect

## Process

### 1. Detect language
Check in order:
1. If post already has `language` field and it's not "en" default → use it
2. If post `category` is "GoHighLevel en Español" or similar → `es`
3. If post `category` is "GoHighLevel India" → `en-IN`
4. If title/content contains Arabic characters (regex `[\u0600-\u06FF]`) → `ar`
5. If title contains Spanish keywords (automatización, cómo, guía, agencia, etc.) → `es`
6. If title contains India keywords (india, rupee, razorpay, whatsapp india, etc.) → `en-IN`
7. Default → `en`

### 2. Classify into topic
Load keyword lists from `references/topic-keywords.md`. Use the language-appropriate list:
- English → `keywords`
- Spanish → `keywords_es`
- India → `keywords_in`
- Arabic → `keywords` (same as English for now)

Match keywords against lowercased title. Longer keywords match first (more specific).
Fallback: "Agency & Platform" (catch-all).

### 3. Validate
- `language` must be one of: en, es, en-IN, ar
- `category` must be one of the 8 topic categories
- If either is invalid, log a warning and fix

## Outputs
- Updated `language` field
- Updated `category` field (real topic, not language-as-category)

## Tools needed
- File reads for post JSONs and topic-keywords.md
