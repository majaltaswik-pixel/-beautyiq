import React, { useState } from 'react';
import { Layout } from '../components/Layout';

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    autoSync: true,
    syncInterval: 60,
    defaultSkinType: '',
    enableUpsell: true,
    enableRecovery: true,
    recoveryDiscount: 10,
    enableContentGen: true,
    enableAnalytics: true,
    ragTopK: 10,
  });

  const saveSettings = async () => {
    setSaving(true);
    // Settings would be persisted to backend
    setTimeout(() => setSaving(false), 500);
  };

  return (
    <Layout title="Settings">
      <div style={styles.container}>
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Product Sync</h3>
          <div style={styles.field}>
            <label style={styles.label}>
              <input type="checkbox" checked={settings.autoSync} onChange={(e) => setSettings({ ...settings, autoSync: e.target.checked })} />
              <span style={styles.checkLabel}>Auto-sync products from Shopify</span>
            </label>
          </div>
          {settings.autoSync && (
            <div style={styles.field}>
              <label style={styles.label}>Sync interval (minutes)</label>
              <input type="number" style={styles.input} value={settings.syncInterval} onChange={(e) => setSettings({ ...settings, syncInterval: Number(e.target.value) })} min={5} max={1440} />
            </div>
          )}
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>AI Modules</h3>
          <div style={styles.field}>
            <label style={styles.label}>
              <input type="checkbox" checked={settings.enableUpsell} onChange={(e) => setSettings({ ...settings, enableUpsell: e.target.checked })} />
              <span style={styles.checkLabel}>Enable Upsell Engine</span>
            </label>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>
              <input type="checkbox" checked={settings.enableRecovery} onChange={(e) => setSettings({ ...settings, enableRecovery: e.target.checked })} />
              <span style={styles.checkLabel}>Enable Cart Recovery</span>
            </label>
          </div>
          {settings.enableRecovery && (
            <div style={styles.field}>
              <label style={styles.label}>Recovery discount (%)</label>
              <input type="number" style={styles.input} value={settings.recoveryDiscount} onChange={(e) => setSettings({ ...settings, recoveryDiscount: Number(e.target.value) })} min={0} max={100} />
            </div>
          )}
          <div style={styles.field}>
            <label style={styles.label}>
              <input type="checkbox" checked={settings.enableContentGen} onChange={(e) => setSettings({ ...settings, enableContentGen: e.target.checked })} />
              <span style={styles.checkLabel}>Enable Content Generation</span>
            </label>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>
              <input type="checkbox" checked={settings.enableAnalytics} onChange={(e) => setSettings({ ...settings, enableAnalytics: e.target.checked })} />
              <span style={styles.checkLabel}>Enable Analytics Tracking</span>
            </label>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>RAG & Knowledge Graph</h3>
          <div style={styles.field}>
            <label style={styles.label}>RAG results per query (topK)</label>
            <input type="number" style={styles.input} value={settings.ragTopK} onChange={(e) => setSettings({ ...settings, ragTopK: Number(e.target.value) })} min={1} max={50} />
          </div>
        </div>

        <button style={styles.saveBtn} onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 600, margin: '0 auto' },
  section: { background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e2e8f0', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#1e293b', margin: '0 0 16px' },
  field: { marginBottom: 14 },
  label: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#334155', fontWeight: 500 },
  checkLabel: { marginLeft: 4 },
  input: { width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, marginTop: 4, maxWidth: 200 },
  saveBtn: { width: '100%', padding: 12, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' },
};
