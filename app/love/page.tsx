'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface FormValues {
  selfDesc: string;
  partnerDesc: string;
}

// 爱心粒子组件
function LoveHearts() {
  const [hearts, setHearts] = useState<Array<{ id: number; left: string; delay: string; duration: string; emoji: string }>>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const heartEmojis = ['❤️', '💕', '💗', '💖', '💘', '💝'];
    const newHearts = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${6 + Math.random() * 6}s`,
      emoji: heartEmojis[Math.floor(Math.random() * heartEmojis.length)],
    }));
    setHearts(newHearts);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="love-hearts">
      {hearts.map(h => (
        <div
          key={h.id}
          className="love-heart"
          style={{
            left: h.left,
            animationDelay: h.delay,
            animationDuration: h.duration,
          }}
        >
          {h.emoji}
        </div>
      ))}
    </div>
  );
}

// ChatForm 组件 - 浪漫风格，双输入框
function LoveChatForm({ onSubmit, loading }: { onSubmit: (values: FormValues) => void; loading: boolean }) {
  const [selfDesc, setSelfDesc] = useState('');
  const [partnerDesc, setPartnerDesc] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((selfDesc.trim() || partnerDesc.trim()) && !loading) {
      onSubmit({ selfDesc, partnerDesc });
    }
  };

  return (
    <div className="love-card">
      <div className="love-card-header">
        <span>💝</span>
        <h2 className="love-card-title">
          写下你的爱情期许
        </h2>
        <span>💝</span>
      </div>
      <div className="love-card-body">
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label className="love-input-label">
              👤 关于你自己
            </label>
            <textarea
              className="love-textarea"
              placeholder="描述一下您的性别、年龄、哪里人，社交联系方式，还有性格、爱好、爱情观..."
              value={selfDesc}
              onChange={(e) => setSelfDesc(e.target.value)}
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="love-input-label">
              💑 你理想的另一半
            </label>
            <textarea
              className="love-textarea"
              placeholder="描述一下你希望的另一半是什么样子..."
              value={partnerDesc}
              onChange={(e) => setPartnerDesc(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <button
              type="submit"
              className="love-button"
              disabled={loading || (!selfDesc.trim() && !partnerDesc.trim())}
            >
              {loading ? '💕 分析中...' : '💌 提交'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ResultDisplay 组件 - 浪漫风格
function LoveResultDisplay({ content, error, onRetry }: { content: string; error?: string; onRetry?: () => void }) {
  if (error) {
    return (
      <div className="love-card">
        <div className="love-card-header">
          <span>💔</span>
          <h2 className="love-card-title">
            呀，出错了
          </h2>
          <span>💔</span>
        </div>
        <div className="love-card-body">
          <div className="love-error-box">
            [ERROR] {error}
          </div>
          {onRetry && (
            <div style={{ marginTop: '20px' }}>
              <button
                onClick={onRetry}
                className="love-button"
              >
                💕 再试一次
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
    <div className="love-card">
      <div className="love-card-header">
        <span>💖</span>
        <h2 className="love-card-title">
          爱的寄语
        </h2>
        <span>💖</span>
      </div>
      <div className="love-card-body">
        <div className="love-result-box" style={{ padding: '24px' }}>
          <div style={{ paddingLeft: '32px' }} className="love-markdown">
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
              className="love-button"
            >
              💝 再来一次
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Loading 组件 - 浪漫风格
function LoveLoading() {
  return (
    <div className="love-loading-container">
      <div className="love-loading-text">
        💕 正在为你牵线...
      </div>
    </div>
  );
}

export default function Love() {
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
      const userPrompt = `关于我自己：${values.selfDesc || '暂无描述'}\n\n我理想的另一半：${values.partnerDesc || '暂无描述'}`;

      const response = await fetch('/api/chat-love', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': sessionId,
        },
        body: JSON.stringify({
          userPrompt,
          formData: values,
          sessionId,
          type: 'love'
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
              const loadingStr=`\n\n---系统匹配您的理想对象中，稍等...---\n\n`
              if(parsed.reasoning_content){
                reasoningAccumulatedContent.push(parsed.reasoning_content) 
                if(reasoningAccumulatedContent.length > 10){
                  reasoningAccumulatedContent.shift()
                }
                setReasoningContent(reasoningAccumulatedContent.join(''));
              }
              if (parsed.content) {
                accumulatedContent += parsed.content;
                if(parsed.content!=loadingStr){
                  accumulatedContent.replace(loadingStr,'')
                }
                setResult(accumulatedContent);
              }
              if (parsed.system_content) {
                  setResult(accumulatedContent+parsed.system_content);
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
    <div className="love-container">
      <LoveHearts />
      <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <header className="love-header">
          <h1 className="love-title">
            <span className="heart">💕</span>
            恋恋笔记
            <span className="heart">💕</span>
          </h1>
          <p className="love-subtitle">
            遇见你，是我最美丽的意外
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <LoveChatForm onSubmit={handleSubmit} loading={loading} />

          {loading && !result && (<div className="love-loading-container">
      <div className="love-loading-text">
        💕 正在为你牵线...
      </div>
      <div style={{padding: '0 8px',height:'32px',overflow:'hidden',color:'#727070',fontSize:'12px',lineHeight:'32px'}}>{reasoningContent}</div>
    </div>)}

          <LoveResultDisplay
            content={result}
            error={error}
            onRetry={error ? undefined : (result ? handleRetry : undefined)}
          />
        </div>

        <div className="love-footer">
          💝 Made with Love 💝
        </div>
      </div>
    </div>
  );
}
