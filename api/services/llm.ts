const GROQ_BASE = 'https://api.groq.com/openai/v1';
const OPENAI_BASE = 'https://api.openai.com/v1';

interface LLMConfig {
  provider: 'groq' | 'openai';
  apiKey: string;
  model: string;
}

function getConfig(): LLMConfig {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || '';
  const provider = process.env.LLM_PROVIDER === 'openai' ? 'openai' : 'groq';
  const model = process.env.LLM_MODEL || (provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini');
  return { provider, apiKey, model };
}

export async function generateRecommendations(products: any[], profile: { skinType?: string; skinConcerns?: string[]; allergies?: string[] }) {
  const config = getConfig();
  if (!config.apiKey) {
    return fallbackRecommendations(products, profile);
  }

  const baseUrl = config.provider === 'groq' ? GROQ_BASE : OPENAI_BASE;
  const systemPrompt = `You are a skincare AI expert. Given products and a customer's skin profile, recommend the best products.
Return ONLY a JSON array of objects with: { productIndex: number, score: 0-1, matchReasons: string[] }.
Score each product and explain exactly why it matches.`;

  const productsSummary = products.map((p, i) =>
    `[${i}] ${p.metadata?.title || p.label || 'Unknown'} | ${p.metadata?.productType || p.properties?.productType || ''} | Tags: ${(p.metadata?.tags || p.properties?.tags || []).join(', ')} | Ingredients: ${(p.metadata?.ingredients || p.properties?.ingredients || []).join(', ')}`
  ).join('\n');

  const userPrompt = `Skin: ${profile.skinType || 'normal'}\nConcerns: ${(profile.skinConcerns || []).join(', ') || 'none'}\nAllergies: ${(profile.allergies || []).join(', ') || 'none'}\n\nProducts:\n${productsSummary}`;

  try {
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });
    if (!resp.ok) {
      console.warn(`[LLM] API error (${resp.status}) — fallback`);
      return fallbackRecommendations(products, profile);
    }
    const data: any = await resp.json();
    const text = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(text);
    const recs = parsed.recommendations || parsed.scores || parsed;
    if (Array.isArray(recs)) {
      return products.map((p, i) => {
        const match = recs.find((r: any) => r.productIndex === i);
        return { ...p, score: match?.score || 0.5, matchReasons: match?.matchReasons || [], source: 'ai' };
      });
    }
  } catch (err) {
    console.warn('[LLM] Request failed — fallback');
  }
  return fallbackRecommendations(products, profile);
}

export async function generateSupportResponse(query: string, context: string) {
  const config = getConfig();
  if (!config.apiKey) return fallbackSupport(query);

  const baseUrl = config.provider === 'groq' ? GROQ_BASE : OPENAI_BASE;
  try {
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: `You are a helpful skincare e-commerce support agent. Answer questions based on the store context provided. Be concise and helpful. Context:\n${context}` },
          { role: 'user', content: query },
        ],
        temperature: 0.5,
        max_tokens: 500,
      }),
    });
    if (!resp.ok) return fallbackSupport(query);
    const data: any = await resp.json();
    return data.choices?.[0]?.message?.content || fallbackSupport(query);
  } catch {
    return fallbackSupport(query);
  }
}

export async function generateContent(topic: string, brandVoice: string) {
  const config = getConfig();
  if (!config.apiKey) return fallbackContent(topic);

  const baseUrl = config.provider === 'groq' ? GROQ_BASE : OPENAI_BASE;
  try {
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: `Write marketing content in this brand voice: ${brandVoice}. Return JSON with title and body fields.` },
          { role: 'user', content: `Topic: ${topic}` },
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    });
    if (!resp.ok) return fallbackContent(topic);
    const data: any = await resp.json();
    return JSON.parse(data.choices?.[0]?.message?.content || '{}');
  } catch {
    return fallbackContent(topic);
  }
}

function fallbackRecommendations(products: any[], profile: any) {
  return products.map((p) => {
    let score = 0.5;
    const reasons: string[] = [];
    const tags = p.metadata?.tags || p.properties?.tags || [];
    if (profile.skinConcerns?.length) {
      const match = profile.skinConcerns.filter((c: string) =>
        tags.some((t: string) => t.toLowerCase().includes(c.toLowerCase()))
      ).length;
      if (match > 0) { score += match * 0.15; reasons.push(`Targets ${match} concern(s)`); }
    }
    return { ...p, score: Math.min(score, 1), matchReasons: reasons, source: 'fallback' };
  }).sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
}

function fallbackSupport(query: string) {
  return `Thank you for your question about "${query}". Our team will get back to you shortly with personalized skincare advice.`;
}

function fallbackContent(topic: string) {
  return { title: topic, body: `Discover our curated selection of ${topic.toLowerCase()} — perfect for your skincare routine.` };
}

export async function callLLM(systemPrompt: string, userPrompt: string, format?: 'json'): Promise<string> {
  const config = getConfig();
  if (!config.apiKey) return '{}';

  const baseUrl = config.provider === 'groq' ? GROQ_BASE : OPENAI_BASE;
  const body: any = {
    model: config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  };
  if (format === 'json') body.response_format = { type: 'json_object' };

  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`LLM error: ${resp.statusText}`);
  const data: any = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}
