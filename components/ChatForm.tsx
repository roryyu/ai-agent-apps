'use client';

import { Form } from 'antd-mobile';

interface FormValues {
  query: string;
}

interface ChatFormProps {
  onSubmit: (values: FormValues) => void;
  loading?: boolean;
}

export default function ChatForm({ onSubmit, loading }: ChatFormProps) {
  const [form] = Form.useForm<FormValues>();

  return (
    <div className="brutal-card">
      <div className="brutal-card-header">
        <span style={{
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--accent-primary)',
          fontFamily: 'var(--mono-font)',
        }}>
          //
        </span>
        <h2 className="brutal-card-title">
          INPUT QUERY
        </h2>
      </div>
      <div className="brutal-card-body">
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            onSubmit(values);
          }}
          footer={
            <button
              type="submit"
              disabled={loading}
              className="brutal-button"
            >
              {loading ? 'PROCESSING...' : 'EXECUTE QUERY'}
            </button>
          }
        >
          <Form.Item
            name="query"
            label={<span style={{
              fontWeight: 700,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--mono-font)',
              textTransform: 'uppercase',
              fontSize: '11px',
              letterSpacing: '1px',
              marginBottom: '8px'
            }}>
              YOUR QUERY
            </span>}
            rules={[{ required: true, message: 'INPUT REQUIRED' }]}
          >
            <textarea
              className="brutal-textarea"
              placeholder="ENTER YOUR QUERY HERE..."
              rows={6}
              maxLength={2000}
            />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
