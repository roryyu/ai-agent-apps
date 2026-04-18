'use client';

export default function Loading() {
  return (
    <div className="brutal-card" style={{ boxShadow: '8px 8px 0 var(--accent-secondary)' }}>
      <div className="brutal-card-header">
        <span style={{
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--accent-secondary)',
          fontFamily: 'var(--mono-font)',
        }}>
          ◆
        </span>
        <h2 className="brutal-card-title">
          PROCESSING
        </h2>
      </div>
      <div className="loading-container">
        <div className="loading-text">
          [NEURAL CORES ACTIVE...]
        </div>
      </div>
    </div>
  );
}
