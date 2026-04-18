'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface FormValues {
  query: string;
}

// ChatForm 组件 - 科技风格
function TechChatForm({ onSubmit, loading }: { onSubmit: (values: FormValues) => void; loading: boolean }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !loading) {
      onSubmit({ query: value });
    }
  };

  return (
    <div className="tech-card">
      <div className="tech-card-header">
        <div className="tech-card-indicator"></div>
        <h2 className="tech-card-title">
          输入指令
        </h2>
      </div>
      <div className="tech-card-body">
        <form onSubmit={handleSubmit}>
          <textarea
            className="tech-textarea"
            placeholder="描述你的创业想法、问题或需求..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={loading}
          />
          <div style={{ marginTop: '14px' }}>
            <button
              type="submit"
              className="tech-button"
              disabled={loading || !value.trim()}
            >
              {loading ? '分析中...' : '执行分析'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ResultDisplay 组件 - 科技风格
function TechResultDisplay({ content, error, onRetry }: { content: string; error?: string; onRetry?: () => void }) {
  if (error) {
    return (
      <div className="tech-card">
        <div className="tech-card-header">
          <div className="tech-card-indicator" style={{ background: '#ef4444', boxShadow: '0 0 10px #ef4444' }}></div>
          <h2 className="tech-card-title">
            错误
          </h2>
        </div>
        <div className="tech-card-body">
          <div className="tech-error-box">
            [ERROR] {error}
          </div>
          {onRetry && (
            <div style={{ marginTop: '16px' }}>
              <button
                onClick={onRetry}
                className="tech-button"
              >
                重试
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
    <div className="tech-card">
      <div className="tech-card-header">
        <div className="tech-card-indicator"></div>
        <h2 className="tech-card-title">
          分析结果
        </h2>
      </div>
      <div className="tech-card-body">
        <div className="tech-result-box" style={{ padding: '20px' }}>
          <div style={{ paddingLeft: '24px' }} className="tech-markdown">
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
          <div style={{ marginTop: '16px' }}>
            <button
              onClick={onRetry}
              className="tech-button"
            >
              新的分析
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Loading 组件 - 科技风格
function TechLoading() {
  return (
    <div className="tech-loading-container">
      <div className="tech-loading-text">
        系统处理中...
      </div>
    </div>
  );
}

export default function Entrepreneurship() {
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
          type: 'entrepreneurship'
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error('请求失败');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
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
        const errorMessage = err instanceof Error ? err.message : '发生未知错误';
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
    <div className="tech-container">
      <div className="tech-grid-overlay"></div>
      <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <header className="tech-header">
          <h1 className="tech-title">
            创业智库
            <span className="tech-title-sub">Entrepreneurship Hub</span>
          </h1>
          <p className="tech-subtitle">
            AI 驱动的商业分析与策略建议
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <TechChatForm onSubmit={handleSubmit} loading={loading} />
          {loading && !result && (    <div className="tech-loading-container">
              <div className="tech-loading-text">
                系统处理中...
              </div>
              <div style={{padding: '0 8px',height:'32px',overflow:'hidden',color:'#727070',fontSize:'12px',lineHeight:'32px'}}>{reasoningContent}</div>
            </div>)}  

          <TechResultDisplay
            content={result}
            error={error}
            onRetry={error ? undefined : (result ? handleRetry : undefined)}
          />
        </div>

        <div className="tech-footer">
          © 2026 • VENTURE LAB
        </div>
      </div>
    </div>
  );
}
