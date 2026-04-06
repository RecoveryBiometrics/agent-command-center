/**
 * Gemini Client Wrapper — Rate-limited access to Google Gemini 2.0 Flash.
 *
 * Uses @google/generative-ai package (CommonJS compatible).
 * Handles rate limiting, retries, and grounded search configuration.
 */
const config = require('../config');

let genAI = null;
let model = null;
let lastRequestTime = 0;
let requestCount = 0;

/**
 * Initialize the Gemini client. Lazy — called on first use.
 */
function init() {
  if (genAI) return;

  const apiKey = process.env[config.GEMINI.API_KEY_ENV]
    || process.env.GOOGLE_AI_API_KEY
    || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      `Missing API key. Set one of: ${config.GEMINI.API_KEY_ENV}, GOOGLE_AI_API_KEY, or GOOGLE_API_KEY. ` +
      `Get a free key from https://aistudio.google.com/apikey`
    );
  }

  const { GoogleGenerativeAI } = require('@google/generative-ai');
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: config.GEMINI.MODEL });
}

/**
 * Wait to respect rate limits.
 */
async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  const minDelay = config.GEMINI.RATE_LIMIT.DELAY_BETWEEN_REQUESTS_MS;

  if (elapsed < minDelay) {
    await new Promise(r => setTimeout(r, minDelay - elapsed));
  }

  lastRequestTime = Date.now();
  requestCount++;
}

/**
 * Send a prompt to Gemini with automatic rate limiting and retries.
 *
 * @param {string} prompt - The prompt text
 * @param {object} [options] - Optional configuration
 * @param {boolean} [options.groundedSearch] - Enable grounded search (web results)
 * @param {number} [options.maxTokens] - Max output tokens (default 2048)
 * @returns {Promise<string>} - The response text
 */
async function generate(prompt, options = {}) {
  init();

  const { maxTokens = 2048, groundedSearch = false } = options;

  const generationConfig = {
    maxOutputTokens: maxTokens,
    temperature: 0.3,
  };

  const tools = groundedSearch
    ? [{ googleSearch: {} }]
    : undefined;

  let lastError;
  for (let attempt = 0; attempt < config.GEMINI.RATE_LIMIT.MAX_RETRIES; attempt++) {
    try {
      await rateLimit();

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
        tools,
      });

      const response = result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini');
      }

      return text.trim();
    } catch (err) {
      lastError = err;
      const isRateLimit = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');

      if (isRateLimit && attempt < config.GEMINI.RATE_LIMIT.MAX_RETRIES - 1) {
        const delay = config.GEMINI.RATE_LIMIT.RETRY_DELAY_MS * (attempt + 1);
        console.log(`  Rate limited, retrying in ${delay / 1000}s (attempt ${attempt + 2}/${config.GEMINI.RATE_LIMIT.MAX_RETRIES})...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      if (!isRateLimit) throw err;
    }
  }

  throw lastError;
}

/**
 * Send a prompt expecting a JSON response. Parses and returns the object.
 *
 * @param {string} prompt - The prompt (should instruct JSON output)
 * @param {object} [options] - Same options as generate()
 * @returns {Promise<object>} - Parsed JSON response
 */
async function generateJSON(prompt, options = {}) {
  const text = await generate(prompt, options);

  // Extract JSON from markdown code fences if present
  // Handle grounded search responses that may duplicate the JSON block
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  let jsonStr = jsonMatch ? jsonMatch[1].trim() : text;

  // If the JSON is truncated, try to repair it
  try {
    return JSON.parse(jsonStr);
  } catch (firstErr) {
    // Try to find and parse just the first complete JSON object
    const objStart = jsonStr.indexOf('{');
    if (objStart >= 0) {
      // Find matching closing brace by counting
      let depth = 0;
      let inString = false;
      let escape = false;
      for (let i = objStart; i < jsonStr.length; i++) {
        const ch = jsonStr[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\') { escape = true; continue; }
        if (ch === '"' && !escape) { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{') depth++;
        if (ch === '}') { depth--; if (depth === 0) {
          try {
            return JSON.parse(jsonStr.substring(objStart, i + 1));
          } catch { break; }
        }}
      }
    }

    // Last resort: try to fix truncated JSON by closing open structures
    let repaired = jsonStr;
    // Count unclosed brackets/braces
    const opens = (repaired.match(/\[/g) || []).length - (repaired.match(/\]/g) || []).length;
    const braces = (repaired.match(/\{/g) || []).length - (repaired.match(/\}/g) || []).length;
    // Trim trailing incomplete entries (remove last partial object)
    repaired = repaired.replace(/,\s*\{[^}]*$/, '');
    repaired = repaired.replace(/,\s*"[^"]*$/, '');
    for (let i = 0; i < opens; i++) repaired += ']';
    for (let i = 0; i < braces; i++) repaired += '}';
    try {
      return JSON.parse(repaired);
    } catch {
      throw new Error(`Failed to parse Gemini JSON response: ${firstErr.message}\nRaw: ${text.slice(0, 500)}`);
    }
  }
}

/**
 * Get current request count (for budget tracking).
 */
function getRequestCount() {
  return requestCount;
}

/**
 * Reset request count (e.g., at start of a new run).
 */
function resetRequestCount() {
  requestCount = 0;
}

module.exports = { generate, generateJSON, getRequestCount, resetRequestCount };
