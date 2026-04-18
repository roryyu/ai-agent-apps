'use client';

import ReactMarkdown from 'react-markdown';

interface ResultDisplayProps {
  content: string;
  error?: string;
  onRetry?: () => void;
}

export default function ResultDisplay({ content, error, onRetry }: ResultDisplayProps) {
  if (error) {
    return (
      <div className="brutal-card">
        <div className="brutal-card-header">
          <span style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--accent-primary)',
            fontFamily: 'var(--mono-font)',
          }}>
            ×
          </span>
          <h2 className="brutal-card-title">
            ERROR
          </h2>
        </div>
        <div className="brutal-card-body">
          <div className="error-box">
            [ERROR] {error}
          </div>
          {onRetry && (
            <div style={{ marginTop: '20px' }}>
              <button
                onClick={onRetry}
                className="brutal-button brutal-button-secondary"
              >
                RETRY
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className="brutal-card">
      <div className="brutal-card-header">
        <span style={{
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--accent-secondary)',
          fontFamily: 'var(--mono-font)',
        }}>
          ✓
        </span>
        <h2 className="brutal-card-title">
          AI RESPONSE
        </h2>
      </div>
      <div className="brutal-card-body">
        <div className="result-box" style={{ padding: '24px' }}>
          <div style={{ paddingLeft: '24px' }}>
            <ReactMarkdown
              components={{
                h1: ({ ...props }) => <h1 style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  marginBottom: '16px',
                  marginTop: '24px',
                  color: 'var(--text-primary)',
                  borderBottom: '2px solid var(--accent-primary)',
                  paddingBottom: '8px'
                }} {...props} />,
                h2: ({ ...props }) => <h2 style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  marginBottom: '12px',
                  marginTop: '20px',
                  color: 'var(--text-primary)'
                }} {...props} />,
                h3: ({ ...props }) => <h3 style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  marginBottom: '10px',
                  marginTop: '16px',
                  color: 'var(--text-primary)'
                }} {...props} />,
                p: ({ ...props }) => <p style={{
                  marginBottom: '12px',
                  lineHeight: '1.8',
                  color: 'var(--text-primary)'
                }} {...props} />,
                ul: ({ ...props }) => <ul style={{
                  marginBottom: '12px',
                  paddingLeft: '24px',
                  color: 'var(--text-primary)'
                }} {...props} />,
                ol: ({ ...props }) => <ol style={{
                  marginBottom: '12px',
                  paddingLeft: '24px',
                  color: 'var(--text-primary)'
                }} {...props} />,
                li: ({ ...props }) => <li style={{
                  marginBottom: '6px',
                  lineHeight: '1.7'
                }} {...props} />,
                strong: ({ ...props }) => <strong style={{
                  color: 'var(--accent-secondary)',
                  fontWeight: 700
                }} {...props} />,
                code: ({ ...props }) => <code style={{
                  background: 'var(--bg-secondary)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontFamily: 'var(--mono-font)',
                  fontSize: '14px',
                  color: 'var(--accent-primary)'
                }} {...props} />,
                pre: ({ ...props }) => <pre style={{
                  background: 'var(--bg-secondary)',
                  padding: '16px',
                  borderRadius: '8px',
                  overflowX: 'auto',
                  marginBottom: '12px',
                  border: '1px solid var(--border-color)'
                }} {...props} />,
                blockquote: ({ ...props }) => <blockquote style={{
                  borderLeft: '4px solid var(--accent-primary)',
                  paddingLeft: '16px',
                  marginLeft: '0',
                  marginBottom: '12px',
                  color: 'var(--text-secondary)',
                  fontStyle: 'italic'
                }} {...props} />,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>
        {onRetry && (
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={onRetry}
              className="brutal-button brutal-button-secondary"
            >
              REGENERATE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
