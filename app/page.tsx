'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ChatForm from '@/components/ChatForm';
import ResultDisplay from '@/components/ResultDisplay';
import Loading from '@/components/Loading';
import { generateSessionId } from '@/lib/session';

interface FormValues {
  query: string;
}

export default function Home() {
  const [sessionId, setSessionId] = useState('');
  const [result, setResult] = useState<string>('');
  const [reasoningContent, setReasoningContent] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSessionId(generateSessionId());
  }, []);

  const handleSubmit = useCallback(
    async (values: FormValues) => {
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
        let reasoningAccumulatedContent = '';

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
                if (parsed.reasoning_content) {
                  reasoningAccumulatedContent += parsed.reasoning_content;
                  setReasoningContent(reasoningAccumulatedContent);
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
    },
    [sessionId]
  );

  const handleRetry = useCallback(() => {
    setError('');
    setResult('');
  }, []);

  return (
    <div className="app-container">
      <div className="scan-line"></div>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <header className="app-header">
          <h1 className="app-title">
            AI<span>_</span>ASSISTANT
          </h1>
          <p className="app-subtitle">SYSTEM ONLINE • V1.0</p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <ChatForm onSubmit={handleSubmit} loading={loading} />

          {loading && !result && (
            <div>
              <Loading />
              <textarea readOnly>{reasoningContent}</textarea>
            </div>
          )}
          <ResultDisplay
            content={result}
            error={error}
            onRetry={error ? undefined : result ? handleRetry : undefined}
          />
        </div>

        <div
          style={{
            marginTop: '32px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '10px',
            fontFamily: 'var(--mono-font)',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}
        >
          © 2026 • NEURAL INTERFACE
        </div>
      </div>
    </div>
  );
}
