import React, { useState } from 'react';
import './PackageManager.css';

export default function PackageManager({ packages = [], onInstall, onRemove }) {
  const [query, setQuery] = useState('');
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInstall = async () => {
    if (!query.trim()) return;
    setInstalling(true);
    setError('');
    setSuccess('');
    try {
      const result = await onInstall(query.trim());
      setSuccess(`✓ ${result.package.name}@${result.package.version} installed`);
      setQuery('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to install package');
    }
    setInstalling(false);
  };

  return (
    <div className="package-manager">
      <div className="pm-header">📦 Packages</div>
      <div className="pm-install">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleInstall()}
          placeholder="Package name (e.g. lodash)"
          className="pm-input"
        />
        <button onClick={handleInstall} disabled={installing} className="pm-btn">
          {installing ? '...' : 'Install'}
        </button>
      </div>
      {error && <div className="pm-error">{error}</div>}
      {success && <div className="pm-success">{success}</div>}
      <div className="pm-list">
        {packages.length === 0 ? (
          <div className="pm-empty">No packages installed</div>
        ) : (
          packages.map(pkg => (
            <div key={pkg} className="pm-item">
              <span>📦 {pkg}</span>
              <button onClick={() => onRemove(pkg)} className="pm-remove">×</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
