'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface FormValues {
  query: string;
}

// 粒子组件 - 使用 useState 和 useEffect 避免 hydration 不匹配
function TreeholeParticles() {
  const [particles, setParticles] = useState<Array<{ id: number; left: string; delay: string; duration: string }>>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 只在客户端生成随机粒子数据
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${6 + Math.random() * 6}s`,
    }));
    setParticles(newParticles);
  }, []);

  // 在服务端或挂载前不渲染粒子
  if (!mounted) {
    return null;
  }

  return (
    <div className="treehole-particles">
      {particles.map(p => (
        <div
          key={p.id}
          className="treehole-particle"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}

// ChatForm 组件 - 哥特风格
function TreeholeChatForm({ onSubmit, loading }: { onSubmit: (values: FormValues) => void; loading: boolean }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !loading) {
      onSubmit({ query: value });
    }
  };

  return (
    <div className="treehole-card">
      <div className="treehole-card-header">
        <span style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#da70d6',
          fontFamily: 'Cinzel, serif',
        }}>
          ✧
        </span>
        <h2 className="treehole-card-title">
          吐露心声
        </h2>
      </div>
      <div className="treehole-card-body">
        <form onSubmit={handleSubmit}>
          <textarea
            className="treehole-textarea"
            placeholder="将你的秘密写入虚空..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={loading}
          />
          <div style={{ marginTop: '16px' }}>
            <button
              type="submit"
              className="treehole-button"
              disabled={loading || !value.trim()}
            >
              {loading ? '吞噬中...' : '投入深渊'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ResultDisplay 组件 - 哥特风格
function TreeholeResultDisplay({ content, error, onRetry }: { content: string; error?: string; onRetry?: () => void }) {
  if (error) {
    return (
      <div className="treehole-card">
        <div className="treehole-card-header">
          <span style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#ff6b6b',
            fontFamily: 'Cinzel, serif',
          }}>
            ✕
          </span>
          <h2 className="treehole-card-title">
            虚空回应
          </h2>
        </div>
        <div className="treehole-card-body">
          <div className="treehole-error-box">
            [ERROR] {error}
          </div>
          {onRetry && (
            <div style={{ marginTop: '20px' }}>
              <button
                onClick={onRetry}
                className="treehole-button"
              >
                再次尝试
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
    <div className="treehole-card">
      <div className="treehole-card-header">
        <span style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#da70d6',
          fontFamily: 'Cinzel, serif',
        }}>
          ✦
        </span>
        <h2 className="treehole-card-title">
          深渊低语
        </h2>
      </div>
      <div className="treehole-card-body">
        <div className="treehole-result-box" style={{ padding: '24px' }}>
          <div style={{ paddingLeft: '24px' }} className="treehole-markdown">
            <ReactMarkdown
              components={{
                h1: ({ ...props }) => <h1 {...props} />,
                h2: ({ ...props }) => <h2 {...props} />,
                h3: ({ ...props }) => <h3 {...props} />,
                p: ({ ...props }) => <p {...props} />,
                ul: ({ ...props }) => <ul {...props} />,
                ol: ({ ...props }) => <ol {...props} />,
                li: ({ ...props }) => <li {...props} />,
                strong: ({ ...props }) => <strong {...props} />,
                code: ({ ...props }) => <code {...props} />,
                pre: ({ ...props }) => <pre {...props} />,
                blockquote: ({ ...props }) => <blockquote {...props} />,
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
              className="treehole-button"
            >
              再次倾诉
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Loading 组件 - 哥特风格
function TreeholeLoading() {
  return (
    <div className="treehole-loading-container">
      <div className="treehole-loading-text">
        虚空正在聆听...
      </div>
    </div>
  );
}

export default function Treehole() {
  const [sessionId, setSessionId] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [reasoningContent, setReasoningContent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 在客户端生成 sessionId，避免 hydration 不匹配
  useEffect(() => {
    setSessionId(`${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`);
  }, []);

  const handleSubmit = useCallback(async (values: FormValues) => {
    setLoading(true);
    setError('');
    setResult('');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const userPrompt = values.query;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': sessionId,
        },
        body: JSON.stringify({
          userPrompt,
          formData: {},
          sessionId,
          type:'treehole'
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error('虚空拒绝了你的请求');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法聆听虚空的低语');
      }

      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let reasoningAccumulatedContent = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              
              if(parsed.reasoning_content){
                reasoningAccumulatedContent.push(parsed.reasoning_content) 
                if(reasoningAccumulatedContent.length > 10){
                  reasoningAccumulatedContent.shift()
                }
                setReasoningContent(reasoningAccumulatedContent.join(''));
              }
              if (parsed.content) {
                accumulatedContent += parsed.content;
                
                setResult(accumulatedContent);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const errorMessage = err instanceof Error ? err.message : '虚空保持沉默';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [sessionId]);

  const handleRetry = useCallback(() => {
    setError('');
    setResult('');
  }, []);

  return (
    <div className="treehole-container">
      <TreeholeParticles />
      <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <header className="treehole-header">
          <h1 className="treehole-title">
            <span>✦</span> 深渊 <span>✦</span>
          </h1>
          <p className="treehole-subtitle">
            当你凝视深渊时，深渊也在凝视着你
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <TreeholeChatForm onSubmit={handleSubmit} loading={loading} />

          {loading && !result && (<div className="treehole-loading-container">
      <div className="treehole-loading-text">
        虚空正在聆听...
      </div>
      <div style={{padding: '0 8px',height:'32px',overflow:'hidden',color:'#727070',fontSize:'12px',lineHeight:'32px'}}>{reasoningContent}</div>
    </div>)}

          <TreeholeResultDisplay
            content={result}
            error={error}
            onRetry={error ? undefined : (result ? handleRetry : undefined)}
          />
        </div>

        <div className="treehole-footer">
          ✦ 秘 密 永 存 ✦
        </div>
      </div>
    </div>
  );
}
