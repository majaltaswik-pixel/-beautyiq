import React from 'react';
import ReactDOM from 'react-dom/client';
import { ShopifyApp } from '../shopify_app/app';

function getQueryParam(key: string): string {
  const params = new URLSearchParams(window.location.search);
  return params.get(key) || '';
}

function App() {
  const shop = getQueryParam('shop');
  const host = getQueryParam('host');
  const apiKey = getQueryParam('apiKey');

  if (!shop) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#6b7280', fontSize: 14 }}>
        BeautyIQ — App requires a valid shop parameter.
      </div>
    );
  }

  return <ShopifyApp shop={shop} host={host} apiKey={apiKey} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
