# Stage 2: Localize

## Inputs
- Post JSON with correct `language` and `category` from Stage 1
- Business config (from business YAML)

## Process

### 1. Load market config
Read `references/market-config.md` for the post's language. Get:
- CTA text (e.g., "Free 30-Day Trial" vs "Prueba Gratis 30 Dias")
- Pricing in local currency (if applicable)
- Compliance notes (DPDP for India, GDPR for EU/Spain)
- Affiliate link UTM template

### 2. Verify affiliate links
Scan `html_content` for any links to gohighlevel.com. Ensure ALL include:
- `fp_ref=amplifi-technologies12`
- Correct UTM params: `utm_source=blog&utm_medium=article&utm_campaign={slug}`
- `target="_blank" rel="nofollow noopener"`

If any bare gohighlevel.com links found, fix them.

### 3. Verify CTA boxes
Check that CTA text matches the target language:
- EN: "Free 30-Day Trial", "Start My Free Trial"
- ES: "Prueba Gratis 30 Dias", "Comienza Tu Prueba Gratis"
- India: "Start Your 30-Day Free Trial" (English, but mention ₹ pricing)
- AR: "نسخة تجريبية مجانية لمدة 30 يوم"

### 4. Verify pricing references
If the post mentions pricing, ensure it uses correct local currency:
- EN: $97/$297/$497
- ES: $97 USD (~$1,900 MXN)
- India: $97 (~₹8,000)
- AR: $97 USD (~356 AED)

## Outputs
- Updated `html_content` with correct affiliate links and CTAs
- No structural changes to the post

## Tools needed
- File reads for market-config.md
- Regex for affiliate link verification
