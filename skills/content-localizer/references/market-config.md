# Market Configuration — Per Language

Used by Stage 2 (Localize) to adapt content for each target market.

## Localized Trial + Start Landing Page URLs (CRITICAL)

Every non-English blog post MUST link CTAs to the language-appropriate landing page. The English `/trial` + `/start` pages are in English; linking ES/IN/AR readers to English pages tanks conversion.

| Language | Trial URL (podcast traffic) | Start URL (blog traffic) |
|---|---|---|
| English | `https://globalhighlevel.com/trial` | `https://globalhighlevel.com/start` |
| Spanish (es) | `https://globalhighlevel.com/es/trial/` | `https://globalhighlevel.com/es/start/` |
| India (en-IN) | `https://globalhighlevel.com/in/trial/` | `https://globalhighlevel.com/in/start/` |
| Arabic (ar) | `https://globalhighlevel.com/ar/trial/` | `https://globalhighlevel.com/ar/start/` |

Each localized page has: native headline, 3 market-tailored value props (WhatsApp for ES/IN/AR, Razorpay for IN), 3 FAQ items, CTA button to the GHL affiliate URL with `fp_ref=amplifi-technologies12&utm_campaign={lang}-{podcast|blog}`. Arabic renders `dir="rtl"`.

**Writer prompt rule:** Every blog script and verticals writer MUST use the language-appropriate URL — NEVER bare `/trial` or `https://globalhighlevel.com/trial` in a non-English post. The `ensure_affiliate_links()` function in each blog script should rewrite bare trial URLs to their localized equivalent.

## English (en)
- **CTA:** "Free 30-Day Trial", "Start My Free Trial", "Try GoHighLevel Free"
- **Pricing:** $97/month (Starter), $297/month (Unlimited), $497/month (SaaS Pro)
- **Annual:** ~$970/year (17% savings)
- **Currency:** USD
- **Compliance:** Standard US terms
- **Affiliate UTM:** utm_source=blog&utm_medium=article&utm_campaign={slug}

## Spanish (es)
- **CTA:** "Prueba Gratis 30 Dias", "Comienza Tu Prueba Gratis", "Prueba GoHighLevel Gratis"
- **Pricing:** $97 USD/mes (~$1,900 MXN, ~$390,000 COP, ~$97,000 ARS, ~€90)
- **Annual:** ~$970 USD/ano (17% de ahorro)
- **Currency:** USD + approximate local (MXN, COP, ARS, EUR)
- **Compliance:** GDPR for Spain users
- **Note:** Exchange rates fluctuate — always note "approximate"
- **Affiliate UTM:** utm_source=blog&utm_medium=article&utm_campaign={slug}

## India (en-IN)
- **CTA:** "Start Your 30-Day Free Trial", "Try GoHighLevel Free for 30 Days"
- **Pricing:** $97/month (~₹8,000/month), $297/month (~₹24,700/month), $497/month (~₹41,400/month)
- **Annual:** ~$970/year (~₹80,800/year, 17% savings)
- **Currency:** USD + INR
- **Payment methods:** Razorpay, PayU, UPI
- **Compliance:** DPDP Act (Data Protection and Digital Privacy)
- **Key feature:** WhatsApp integration (saves SMS costs vs US market)
- **Competitors to reference:** Zoho CRM, FunnelOS, LeadSquared
- **Affiliate UTM:** utm_source=blog&utm_medium=article&utm_campaign={slug}

## Arabic (ar)
- **CTA:** "نسخة تجريبية مجانية لمدة 30 يوم", "ابدأ تجربتك المجانية"
- **Pricing:** $97 USD/month (~356 AED, ~364 SAR, ~4,800 EGP)
- **Annual:** ~$970 USD/year (17% savings)
- **Currency:** USD + AED/SAR/EGP
- **Key feature:** WhatsApp integration (primary business comms in MENA)
- **Text direction:** RTL — post JSON html_content should use dir="rtl" wrapper
- **Compliance:** Standard — no specific local data protection highlighted
- **Affiliate UTM:** utm_source=blog&utm_medium=article&utm_campaign={slug}

## Affiliate Link Template (all markets)
```
https://www.gohighlevel.com/highlevel-bootcamp?fp_ref=amplifi-technologies12&utm_source=blog&utm_medium=article&utm_campaign={slug}
```
ALL links to gohighlevel.com MUST include fp_ref=amplifi-technologies12. No exceptions.
