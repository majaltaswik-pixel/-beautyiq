import React, { useState } from 'react';

interface Product {
  label: string;
  price: number;
  reason: string;
}

interface RoutineStep {
  step: number;
  name: string;
  products: Product[];
}

interface BuilderProps {
  shop: string;
}

const SKIN_TYPES = ['dry', 'oily', 'combination', 'normal', 'sensitive'] as const;
const CONCERNS = ['acne', 'aging', 'hyperpigmentation', 'dehydration', 'redness', 'texture', 'dullness', 'large pores'] as const;

const STEP_NAMES = ['Cleanser', 'Toner', 'Serum', 'Moisturizer', 'SPF'];

const DEFAULT_ROUTINE: RoutineStep[] = [
  { step: 1, name: 'Cleanser', products: [{ label: 'Gentle Gel Cleanser', price: 26, reason: 'Removes impurities without stripping' }] },
  { step: 2, name: 'Serum', products: [{ label: 'Hydrating Hyaluronic Serum', price: 42, reason: 'Deep hydration for all skin types' }] },
  { step: 3, name: 'Moisturizer', products: [{ label: 'Daily Barrier Cream', price: 34, reason: 'Locks in moisture' }] },
  { step: 4, name: 'SPF', products: [{ label: 'Mineral SPF 40', price: 28, reason: 'Essential daily protection' }] },
];

const MOCK_TEMPLATES = [
  { name: 'Morning Glow', timeOfDay: 'AM', steps: ['Cleanser', 'Vitamin C Serum', 'Moisturizer', 'SPF'] },
  { name: 'Evening Repair', timeOfDay: 'PM', steps: ['Oil Cleanser', 'Cleanser', 'Retinol Serum', 'Night Cream'] },
  { name: 'Hydration Boost', timeOfDay: 'All Day', steps: ['Cleanser', 'Hyaluronic Serum', 'Moisturizer'] },
  { name: 'Acne Control', timeOfDay: 'All Day', steps: ['Cleanser', 'Salicylic Treatment', 'Niacinamide Serum', 'Oil-Free Moisturizer'] },
];

export const RoutineBuilder: React.FC<BuilderProps> = ({ shop }) => {
  const [skinType, setSkinType] = useState('');
  const [concerns, setConcerns] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [routine, setRoutine] = useState<RoutineStep[]>([]);

  const toggleConcern = (c: string) => {
    setConcerns((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  };

  const generateRoutine = async () => {
    if (!skinType) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skinType, skinConcerns: concerns, shopDomain: shop, query: `build routine for ${skinType} skin` }),
      });
      const data = await res.json();
      const payload = data.payload || data;
      if (payload.routine?.length) {
        setRoutine(payload.routine.map((s: any, i: number) => ({
          step: i + 1,
          name: s.name || STEP_NAMES[i] || `Step ${i + 1}`,
          products: s.product ? [{ label: s.product.title || s.product.name, price: s.product.price || 0, reason: s.reason || '' }] : [],
        })));
      } else {
        setRoutine(buildFallbackRoutine(skinType, concerns));
      }
    } catch {
      setRoutine(buildFallbackRoutine(skinType, concerns));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Routine Builder</h2>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Build a personalized skincare routine</p>
      </div>

      <div style={card}>
        <div style={{ marginBottom: 20 }}>
          <Label text="Skin Type" />
          <div style={chipRow}>
            {SKIN_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setSkinType(t)}
                style={{
                  ...chip,
                  borderColor: skinType === t ? '#7c3aed' : '#e5e7eb',
                  background: skinType === t ? '#ede9fe' : '#fff',
                  color: skinType === t ? '#7c3aed' : '#6b7280',
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <Label text="Concerns" />
          <div style={chipRow}>
            {CONCERNS.map((c) => (
              <button
                key={c}
                onClick={() => toggleConcern(c)}
                style={{
                  ...chip,
                  borderColor: concerns.includes(c) ? '#7c3aed' : '#e5e7eb',
                  background: concerns.includes(c) ? '#ede9fe' : '#fff',
                  color: concerns.includes(c) ? '#7c3aed' : '#6b7280',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generateRoutine}
          disabled={!skinType || generating}
          style={{
            ...primaryBtn,
            opacity: !skinType || generating ? 0.4 : 1,
          }}
        >
          {generating ? 'Building...' : 'Build My Routine'}
        </button>
      </div>

      {routine.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>Your Routine</h3>
            <span style={{ fontSize: 14, color: '#6b7280' }}>
              Total <strong style={{ color: '#111827' }}>${routine.reduce((s, r) => s + r.products.reduce((ps, p) => ps + p.price, 0), 0).toFixed(2)}</strong>
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {routine.map((step) => (
              <div key={step.step} style={stepCard}>
                <div style={stepNum}>{step.step}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#1f2937', fontSize: 14 }}>{step.name}</div>
                  {step.products.map((p, i) => (
                    <div key={i} style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                      {p.label}{p.price ? ` — $${p.price}` : ''}
                      {p.reason ? <span style={{ color: '#9ca3af' }}> &middot; {p.reason}</span> : ''}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {routine.length === 0 && !generating && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>Quick Templates</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {MOCK_TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => {
                  setRoutine(t.steps.map((name, i) => ({
                    step: i + 1, name,
                    products: [{ label: name, price: 0, reason: `${t.timeOfDay} step` }],
                  })));
                }}
                style={templateCard}
              >
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }}>{t.name}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{t.timeOfDay} &middot; {t.steps.length} steps</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Label: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>{text}</div>
);

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
  padding: 24, marginBottom: 24,
};
const chipRow: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' };
const chip: React.CSSProperties = {
  padding: '7px 18px', border: '1.5px solid #e5e7eb', borderRadius: 24,
  cursor: 'pointer', fontSize: 13, fontWeight: 500,
  transition: 'all 0.12s ease',
};
const primaryBtn: React.CSSProperties = {
  width: '100%', padding: '11px 24px', background: '#7c3aed',
  color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer',
  fontSize: 14, fontWeight: 600,
};
const stepCard: React.CSSProperties = {
  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
  padding: 14, display: 'flex', alignItems: 'center', gap: 14,
};
const stepNum: React.CSSProperties = {
  width: 30, height: 30, background: '#ede9fe', borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 13, fontWeight: 700, color: '#7c3aed', flexShrink: 0,
};
const templateCard: React.CSSProperties = {
  padding: 14, background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: 10, cursor: 'pointer', textAlign: 'left',
  transition: 'border-color 0.12s ease',
};

export default RoutineBuilder;

function buildFallbackRoutine(skinType: string, concerns: string[]): RoutineStep[] {
  const isDry = skinType === 'dry';
  const isAging = concerns.includes('aging');
  const isAcne = concerns.includes('acne');
  return [
    { step: 1, name: 'Cleanser', products: [{ label: isDry ? 'Cream Cleanser' : 'Gel Cleanser', price: 26, reason: 'Gentle daily cleanse' }] },
    { step: 2, name: 'Toner', products: [{ label: 'Balancing Toner', price: 22, reason: 'Prepares skin for treatment' }] },
    { step: 3, name: 'Serum', products: [{ label: isAging ? 'Retinol Serum' : isAcne ? 'Niacinamide Serum' : 'Hydrating Serum', price: 44, reason: 'Targeted treatment' }] },
    { step: 4, name: 'Moisturizer', products: [{ label: isDry ? 'Rich Moisturizer' : 'Lightweight Gel', price: 32, reason: 'Locks in hydration' }] },
    { step: 5, name: 'SPF', products: [{ label: 'Daily SPF 40', price: 26, reason: 'Essential UV protection' }] },
  ];
}
