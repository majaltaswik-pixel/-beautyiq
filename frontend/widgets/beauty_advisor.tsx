import React, { useState, useRef, useEffect } from 'react';

interface Product {
  label?: string;
  title?: string;
  price?: number;
  score?: number;
  metadata?: { title?: string; price?: number };
  properties?: { price?: number };
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
}

interface AdvisorProps {
  shop: string;
  apiKey: string;
  embedded?: boolean;
}

const SKIN_TYPES = ['dry', 'oily', 'combination', 'normal', 'sensitive'];
const SKIN_CONCERNS = ['acne', 'aging', 'hyperpigmentation', 'dehydration', 'redness', 'texture', 'dullness', 'large pores'];

export const BeautyAdvisorWidget: React.FC<AdvisorProps> = ({ shop, apiKey, embedded }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your AI Beauty Advisor. Tell me about your skin, and I'll recommend the perfect routine for you." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState({ skinType: '', concerns: [] as string[], allergies: [] as string[] });
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          skinType: profile.skinType || undefined,
          skinConcerns: profile.concerns.length ? profile.concerns : undefined,
          allergies: profile.allergies.length ? profile.allergies : undefined,
          shopDomain: shop,
        }),
      });
      const data = await res.json();
      const payload = data.payload || data;
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: payload.reasoning?.[0] || 'Here are my recommendations based on your profile.',
        products: payload.recommendations || payload.products || [],
      }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleConcern = (c: string) => {
    setProfile((p) => ({
      ...p,
      concerns: p.concerns.includes(c) ? p.concerns.filter((x) => x !== c) : [...p.concerns, c],
    }));
  };

  const containerStyle: React.CSSProperties = embedded
    ? { border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff' }
    : { maxWidth: 480, margin: '0 auto', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', background: '#fff' };

  return (
    <div style={containerStyle}>
      <div style={header}>
        <div>
          <span style={headerTitle}>Beauty Advisor</span>
          <span style={headerSub}>by BeautyIQ</span>
        </div>
        <button
          onClick={() => setShowProfile(!showProfile)}
          style={profileBtn}
        >
          {showProfile ? 'Apply' : 'My Skin'}
        </button>
      </div>

      {showProfile && (
        <div style={profilePanel}>
          <label style={label}>Skin Type</label>
          <div style={chipRow}>
            {SKIN_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setProfile({ ...profile, skinType: t })}
                style={{
                  ...chip,
                  borderColor: profile.skinType === t ? '#7c3aed' : '#e5e7eb',
                  background: profile.skinType === t ? '#ede9fe' : '#fff',
                  color: profile.skinType === t ? '#7c3aed' : '#6b7280',
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <label style={label}>Concerns</label>
          <div style={chipRow}>
            {SKIN_CONCERNS.map((c) => (
              <button
                key={c}
                onClick={() => toggleConcern(c)}
                style={{
                  ...chip,
                  borderColor: profile.concerns.includes(c) ? '#7c3aed' : '#e5e7eb',
                  background: profile.concerns.includes(c) ? '#ede9fe' : '#fff',
                  color: profile.concerns.includes(c) ? '#7c3aed' : '#6b7280',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={chatArea}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              ...bubble,
              background: msg.role === 'user' ? '#7c3aed' : '#f3f4f6',
              color: msg.role === 'user' ? '#fff' : '#1f2937',
            }}>
              {msg.content}
            </div>
            {msg.products && msg.products.length > 0 && (
              <div style={productRow}>
                {msg.products.slice(0, 3).map((p, idx) => {
                  const title = p.metadata?.title || p.label || 'Product';
                  const price = p.metadata?.price || p.properties?.price;
                  return (
                    <div key={idx} style={productCard}>
                      <div style={productName}>{title}</div>
                      {price && <div style={productPrice}>${price}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={loadingRow}>
            <div style={dot} />
            <span style={loadingText}>Analyzing...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div style={inputRow}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          placeholder="Ask about skincare..."
          style={inputField}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{ ...sendBtn, opacity: loading || !input.trim() ? 0.4 : 1 }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

const header: React.CSSProperties = {
  background: '#7c3aed', padding: '14px 18px',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
};
const headerTitle: React.CSSProperties = { color: '#fff', fontWeight: 700, fontSize: 14 };
const headerSub: React.CSSProperties = { color: '#c4b5fd', fontSize: 11, marginLeft: 8 };
const profileBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
  padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
};
const profilePanel: React.CSSProperties = {
  padding: 14, background: '#faf5ff', borderBottom: '1px solid #e5e7eb',
};
const label: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#7c3aed',
  display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px',
};
const chipRow: React.CSSProperties = {
  display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10,
};
const chip: React.CSSProperties = {
  padding: '4px 12px', border: '1px solid #e5e7eb', borderRadius: 16,
  cursor: 'pointer', fontSize: 12, transition: 'all 0.12s ease',
};
const chatArea: React.CSSProperties = {
  height: 340, overflowY: 'auto', padding: 16,
  display: 'flex', flexDirection: 'column', gap: 14,
};
const bubble: React.CSSProperties = {
  maxWidth: '82%', padding: '10px 14px', borderRadius: 12,
  fontSize: 13, lineHeight: 1.5,
};
const productRow: React.CSSProperties = {
  marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap',
};
const productCard: React.CSSProperties = {
  padding: '8px 12px', background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: 8, fontSize: 12,
};
const productName: React.CSSProperties = { fontWeight: 600, color: '#1f2937' };
const productPrice: React.CSSProperties = { color: '#6b7280', marginTop: 2 };
const loadingRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px',
};
const dot: React.CSSProperties = {
  width: 7, height: 7, background: '#7c3aed', borderRadius: '50%',
  animation: 'pulse 1.5s infinite',
};
const loadingText: React.CSSProperties = { color: '#9ca3af', fontSize: 12 };
const inputRow: React.CSSProperties = {
  borderTop: '1px solid #e5e7eb', padding: '10px 14px',
  display: 'flex', gap: 8,
};
const inputField: React.CSSProperties = {
  flex: 1, border: '1px solid #e5e7eb', borderRadius: 8,
  padding: '9px 12px', fontSize: 13, outline: 'none',
};
const sendBtn: React.CSSProperties = {
  background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8,
  padding: '9px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
};

export default BeautyAdvisorWidget;
