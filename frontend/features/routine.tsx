import React, { useState } from 'react';

const ROUTINE_TEMPLATES = [
  { name: 'Morning Glow', timeOfDay: 'AM', steps: ['Cleanser', 'Vitamin C', 'Moisturizer', 'SPF'] },
  { name: 'Evening Repair', timeOfDay: 'PM', steps: ['Oil Cleanser', 'Cleanser', 'Retinol', 'Night Cream'] },
  { name: 'Hydration Boost', timeOfDay: 'both', steps: ['Cleanser', 'Hyaluronic Acid', 'Moisturizer'] },
  { name: 'Acne Control', timeOfDay: 'both', steps: ['Cleanser', 'Salicylic Acid', 'Niacinamide', 'Oil-Free Moisturizer'] },
  { name: 'Brightening', timeOfDay: 'AM', steps: ['Cleanser', 'Vitamin C', 'Moisturizer', 'SPF'] },
];

export const FeatureRoutine: React.FC = () => {
  const [routine, setRoutine] = useState<{ name: string; steps: string[] }>({ name: '', steps: [] });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadTemplate = (name: string) => {
    const t = ROUTINE_TEMPLATES.find(x => x.name === name);
    if (t) setRoutine({ name: t.name, steps: [...t.steps] });
  };

  const build = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/v1/recommendations/routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routineSteps: routine.steps }),
      });
      setResult(await r.json());
    } catch (e: any) { setResult({ error: e.message }); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Routine Builder</h2>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Build personalized skincare routines that bundle complementary products and increase order value.</p>
      </div>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Templates</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
            {ROUTINE_TEMPLATES.map(t => (
              <button key={t.name} onClick={() => loadTemplate(t.name)} style={{ padding: 14, borderRadius: 8, border: routine.name === t.name ? '2px solid #7c3aed' : '1px solid #e5e7eb', background: routine.name === t.name ? '#ede9fe' : '#fff', cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }}>{t.name}</div>
                <div style={{ fontSize: 10, color: '#7c3aed', marginTop: 4 }}>{t.timeOfDay} · {t.steps.length} steps</div>
              </button>
            ))}
          </div>
        </div>
        {routine.steps.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Steps</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {routine.steps.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f9fafb', borderRadius: 8 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 12, background: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: '#1f2937' }}>{s}</span>
                </div>
              ))}
            </div>
            <button onClick={build} disabled={loading} style={{ padding: '10px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>{loading ? 'Building...' : 'Build Routine with Products'}</button>
          </div>
        )}
        {result && (
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16, fontSize: 12 }}>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: '#374151' }}>{JSON.stringify(result.payload || result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
