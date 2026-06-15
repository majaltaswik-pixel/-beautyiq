import React, { useState } from 'react';

interface Step {
  name: string;
  type: string;
  products: any[];
}

const ROUTINE_TEMPLATES = [
  { name: 'Morning Glow', timeOfDay: 'AM', steps: ['Cleanser', 'Vitamin C', 'Moisturizer', 'SPF'] },
  { name: 'Evening Repair', timeOfDay: 'PM', steps: ['Oil Cleanser', 'Cleanser', 'Retinol', 'Night Cream'] },
  { name: 'Hydration Boost', timeOfDay: 'both', steps: ['Cleanser', 'Hyaluronic Acid', 'Moisturizer'] },
  { name: 'Acne Control', timeOfDay: 'both', steps: ['Cleanser', 'Salicylic Acid', 'Niacinamide', 'Oil-Free Moisturizer'] },
  { name: 'Brightening', timeOfDay: 'AM', steps: ['Cleanser', 'Vitamin C', 'Moisturizer', 'SPF'] },
];

export function RoutineBuilder() {
  const [routine, setRoutine] = useState<Step[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadTemplate = (name: string) => {
    setSelectedTemplate(name);
    const template = ROUTINE_TEMPLATES.find((t) => t.name === name);
    if (template) {
      setRoutine(template.steps.map((stepName, i) => ({ name: stepName, type: stepName.toLowerCase().replace(/\s+/g, '_'), products: [] })));
    }
  };

  const buildRoutine = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/recommendations/routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routineSteps: routine.map((s) => s.name) }),
      });
      const data = await res.json();
      setResult(data.payload || data);
    } catch (err) {
      console.error('Failed to build routine:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Routine Builder</h2>
      <p style={styles.subtitle}>Build or customize your skincare routine</p>

      <div style={styles.section}>
        <label style={styles.label}>Start from a template</label>
        <div style={styles.templateGrid}>
          {ROUTINE_TEMPLATES.map((t) => (
            <button
              key={t.name}
              style={{ ...styles.templateCard, border: selectedTemplate === t.name ? '2px solid #7c3aed' : '1px solid #e2e8f0' }}
              onClick={() => loadTemplate(t.name)}
            >
              <h4 style={styles.templateName}>{t.name}</h4>
              <span style={styles.timeBadge}>{t.timeOfDay}</span>
              <p style={styles.stepCount}>{t.steps.length} steps</p>
            </button>
          ))}
        </div>
      </div>

      {routine.length > 0 && (
        <div style={styles.section}>
          <label style={styles.label}>Your Routine Steps</label>
          {routine.map((step, i) => (
            <div key={i} style={styles.stepRow}>
              <span style={styles.stepNum}>{i + 1}</span>
              <input
                style={styles.stepInput}
                value={step.name}
                onChange={(e) => {
                  const updated = [...routine];
                  updated[i] = { ...updated[i], name: e.target.value };
                  setRoutine(updated);
                }}
              />
              <button style={styles.removeBtn} onClick={() => setRoutine(routine.filter((_, idx) => idx !== i))}>×</button>
            </div>
          ))}
          <button style={styles.addStepBtn} onClick={() => setRoutine([...routine, { name: '', type: '', products: [] }])}>
            + Add Step
          </button>
        </div>
      )}

      {routine.length > 0 && (
        <button style={styles.buildBtn} onClick={buildRoutine} disabled={loading}>
          {loading ? 'Building...' : 'Build Routine'}
        </button>
      )}

      {result && (
        <div style={styles.result}>
          <h3 style={styles.resultTitle}>Your Personalized Routine</h3>
          {result.steps || result.routine?.map?.((s: any, i: number) => (
            <div key={i} style={styles.resultStep}>
              <span style={styles.resultStepNum}>{s.step || i + 1}</span>
              <div>
                <strong>{s.name}</strong>
                {s.product && <p style={styles.productInfo}>{s.product.title || s.product.name}</p>}
              </div>
            </div>
          )) || <p>No routine steps returned</p>}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 800, margin: '0 auto' },
  title: { fontSize: 24, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' },
  subtitle: { color: '#64748b', margin: '0 0 24px', fontSize: 14 },
  section: { marginBottom: 24 },
  label: { display: 'block', fontWeight: 600, marginBottom: 12, fontSize: 14, color: '#334155' },
  templateGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 },
  templateCard: { padding: 16, borderRadius: 12, background: '#fff', cursor: 'pointer', textAlign: 'center' as const },
  templateName: { fontSize: 14, fontWeight: 600, color: '#1e293b', margin: '0 0 4px' },
  timeBadge: { fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#f3e8ff', color: '#7c3aed' },
  stepCount: { fontSize: 12, color: '#64748b', margin: '6px 0 0' },
  stepRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  stepNum: { width: 28, height: 28, borderRadius: 14, background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 },
  stepInput: { flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 },
  removeBtn: { background: '#fef2f2', border: 'none', color: '#dc2626', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 16 },
  addStepBtn: { padding: '8px 16px', background: 'none', border: '1px dashed #e2e8f0', borderRadius: 8, color: '#7c3aed', cursor: 'pointer', fontSize: 14, width: '100%' },
  buildBtn: { width: '100%', padding: 12, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  result: { marginTop: 24 },
  resultTitle: { fontSize: 18, fontWeight: 600, color: '#1e293b', marginBottom: 12 },
  resultStep: { display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#fff', borderRadius: 8, marginBottom: 8, border: '1px solid #e2e8f0' },
  resultStepNum: { width: 28, height: 28, borderRadius: 14, background: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 },
  productInfo: { fontSize: 12, color: '#64748b', margin: '2px 0 0' },
};
