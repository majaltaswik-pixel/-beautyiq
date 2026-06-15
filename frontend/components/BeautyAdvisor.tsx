import React, { useState } from 'react';

interface SkinProfile {
  skinType?: string;
  skinConcerns?: string[];
  allergies?: string[];
  age?: number;
}

interface Recommendation {
  id: string;
  label: string;
  score: number;
  source: string;
  metadata?: { title?: string; price?: number; ingredients?: string[] };
}

interface RoutineStep {
  step: number;
  name: string;
  product?: any;
}

interface AdvisorResult {
  recommendations?: Recommendation[];
  routine?: RoutineStep[];
  similarProducts?: any[];
  ingredientInfo?: any[];
  reasoning?: string;
}

export function BeautyAdvisor() {
  const [step, setStep] = useState<'profile' | 'results'>('profile');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<SkinProfile>({ skinType: '', skinConcerns: [], allergies: [] });
  const [result, setResult] = useState<AdvisorResult | null>(null);
  const [concernInput, setConcernInput] = useState('');
  const [allergyInput, setAllergyInput] = useState('');

  const addConcern = () => {
    if (concernInput.trim() && !profile.skinConcerns?.includes(concernInput.trim())) {
      setProfile({ ...profile, skinConcerns: [...(profile.skinConcerns || []), concernInput.trim()] });
      setConcernInput('');
    }
  };

  const addAllergy = () => {
    if (allergyInput.trim() && !profile.allergies?.includes(allergyInput.trim())) {
      setProfile({ ...profile, allergies: [...(profile.allergies || []), allergyInput.trim()] });
      setAllergyInput('');
    }
  };

  const getRecommendations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      setResult(data.payload || data);
      setStep('results');
    } catch (err) {
      console.error('Failed to get recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const skinTypes = ['dry', 'oily', 'combination', 'normal', 'sensitive'];

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Analyzing your skin profile...</p>
      </div>
    );
  }

  if (step === 'results' && result) {
    return (
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => setStep('profile')}>← Back to Profile</button>

        {result.reasoning && <p style={styles.reasoning}>{result.reasoning}</p>}

        {result.recommendations && result.recommendations.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Recommended Products</h3>
            <div style={styles.grid}>
              {result.recommendations.map((rec, i) => (
                <div key={rec.id || i} style={styles.card}>
                  <h4 style={styles.cardTitle}>{rec.metadata?.title || rec.label}</h4>
                  {rec.metadata?.price && <p style={styles.price}>${rec.metadata.price}</p>}
                  <p style={styles.score}>Match: {Math.round(rec.score * 100)}%</p>
                  <span style={styles.badge}>{rec.source}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.routine && result.routine.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Your Routine</h3>
            {result.routine.map((s) => (
              <div key={s.step} style={styles.stepRow}>
                <span style={styles.stepNum}>{s.step}</span>
                <div>
                  <strong>{s.name}</strong>
                  {s.product && <p style={styles.productName}>{s.product.title || s.product.name}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Beauty Advisor</h2>
      <p style={styles.subtitle}>Tell us about your skin for personalized recommendations</p>

      <div style={styles.formGroup}>
        <label style={styles.label}>Skin Type</label>
        <div style={styles.chipGroup}>
          {skinTypes.map((type) => (
            <button
              key={type}
              style={{ ...styles.chip, background: profile.skinType === type ? '#7c3aed' : '#f1f5f9', color: profile.skinType === type ? '#fff' : '#475569' }}
              onClick={() => setProfile({ ...profile, skinType: type })}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Skin Concerns</label>
        <div style={styles.inputRow}>
          <input style={styles.input} value={concernInput} onChange={(e) => setConcernInput(e.target.value)} placeholder="e.g., acne, dryness, aging" onKeyDown={(e) => e.key === 'Enter' && addConcern()} />
          <button style={styles.addBtn} onClick={addConcern}>+ Add</button>
        </div>
        <div style={styles.tagGroup}>
          {profile.skinConcerns?.map((c) => (
            <span key={c} style={styles.tag}>
              {c} <button style={styles.tagRemove} onClick={() => setProfile({ ...profile, skinConcerns: profile.skinConcerns?.filter((x) => x !== c) })}>×</button>
            </span>
          ))}
        </div>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Allergies / Ingredients to Avoid</label>
        <div style={styles.inputRow}>
          <input style={styles.input} value={allergyInput} onChange={(e) => setAllergyInput(e.target.value)} placeholder="e.g., retinol, fragrance" onKeyDown={(e) => e.key === 'Enter' && addAllergy()} />
          <button style={styles.addBtn} onClick={addAllergy}>+ Add</button>
        </div>
        <div style={styles.tagGroup}>
          {profile.allergies?.map((a) => (
            <span key={a} style={{ ...styles.tag, background: '#fef2f2', color: '#dc2626' }}>
              {a} <button style={styles.tagRemove} onClick={() => setProfile({ ...profile, allergies: profile.allergies?.filter((x) => x !== a) })}>×</button>
            </span>
          ))}
        </div>
      </div>

      <button style={styles.submitBtn} onClick={getRecommendations} disabled={!profile.skinType}>
        Get Recommendations
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 800, margin: '0 auto' },
  title: { fontSize: 24, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' },
  subtitle: { color: '#64748b', margin: '0 0 24px', fontSize: 14 },
  formGroup: { marginBottom: 24 },
  label: { display: 'block', fontWeight: 600, marginBottom: 8, fontSize: 14, color: '#334155' },
  chipGroup: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  chip: { padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  inputRow: { display: 'flex', gap: 8 },
  input: { flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 },
  addBtn: { padding: '8px 16px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' },
  tagGroup: { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 },
  tag: { padding: '4px 10px', borderRadius: 12, fontSize: 12, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 },
  tagRemove: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'inherit', padding: 0, lineHeight: 1 },
  submitBtn: { width: '100%', padding: '12px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  backBtn: { background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: 14, marginBottom: 16 },
  reasoning: { background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 12, color: '#64748b', marginBottom: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 600, color: '#1e293b', marginBottom: 12 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 },
  card: { background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' },
  cardTitle: { fontSize: 15, fontWeight: 600, color: '#1e293b', margin: '0 0 4px' },
  price: { fontSize: 16, fontWeight: 700, color: '#7c3aed', margin: '4px 0' },
  score: { fontSize: 12, color: '#64748b', margin: '4px 0' },
  badge: { fontSize: 11, padding: '2px 8px', borderRadius: 8, background: '#f1f5f9', color: '#475569' },
  stepRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#fff', borderRadius: 8, marginBottom: 8, border: '1px solid #e2e8f0' },
  stepNum: { width: 28, height: 28, borderRadius: 14, background: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 },
  productName: { fontSize: 12, color: '#64748b', margin: '2px 0 0' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80 },
  spinner: { width: 40, height: 40, border: '4px solid #e2e8f0', borderTop: '4px solid #7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' as any },
  loadingText: { marginTop: 16, color: '#64748b', fontSize: 14 },
};
