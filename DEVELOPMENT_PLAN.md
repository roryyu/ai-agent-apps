# 开发计划

## 项目概述
对话式生成式AI应用，手机端H5。

**技术栈：**
- Next.js 15 (App Router)
- React 19
- Ant Design Mobile 5.x
- TypeScript

---

## 开发阶段

### 阶段 1: 项目初始化
**任务：** 初始化 Next.js 项目并安装依赖

**步骤：**
1. 使用 `create-next-app` 创建项目
2. 安装 Ant Design Mobile 和其他必要依赖
3. 配置 TypeScript

**依赖包：**
```bash
# 核心依赖
next@latest react@latest react-dom@latest
antd-mobile @ant-design/icons
@anthropic-ai/sdk openai
typescript @types/node @types/react @types/react-dom

# 开发工具
eslint eslint-config-next
```

---

### 阶段 2: 项目基础结构配置
**任务：** 设置项目目录结构和配置文件

**目录结构：**
```
app-money/
├── app/                          # Next.js App Router
│   ├── api/
│   │   └── chat/route.ts        # LLM API 端点
│   ├── page.tsx                 # 主页面
│   ├── layout.tsx               # 根布局
│   └── globals.css              # 全局样式
├── lib/
│   ├── llm/
│   │   ├── client.ts            # LLM 客户端
│   │   ├── types.ts             # 类型定义
│   │   ├── config.ts            # 配置管理
│   │   └── token.ts             # Token 计数
│   └── constants.ts             # 常量
├── components/
│   ├── ChatForm.tsx             # 表单组件
│   ├── ResultDisplay.tsx        # 结果展示组件
│   └── Loading.tsx              # 加载状态组件
├── .env.local                   # 环境变量（不提交）
├── .env.example                 # 环境变量示例
└── next.config.mjs              # Next.js 配置
```

**配置文件：**
- `.env.example`: API_TYPE, API_KEY, BASE_URL, MODEL
- `next.config.mjs`: 配置 Ant Design Mobile
- `tsconfig.json`: TypeScript 配置

---

### 阶段 3: LLM Client 核心模块
**任务：** 实现 LLM 客户端相关模块

**文件清单：**

1. **`lib/llm/types.ts`** - 类型定义
   - Message 接口
   - ToolSchema 接口
   - 其他相关类型

2. **`lib/llm/config.ts`** - 配置管理
   - 从环境变量读取配置
   - API_TYPE, API_KEY, BASE_URL, MODEL

3. **`lib/llm/token.ts`** - Token 计数
   - tokenCounter 单例
   - 记录输入/输出 token

4. **`lib/llm/client.ts`** - LLM 客户端
   - 基于现有代码移植
   - AnthropicClient 类
   - OpenAIClient 类
   - createClient 工厂函数

---

### 阶段 4: API 路由
**任务：** 创建 Next.js API Route 处理聊天请求

**文件：** `app/api/chat/route.ts`

**功能：**
- POST /api/chat
- 接收请求: { systemPrompt, userPrompt, formData }
- 调用 LLM Client
- 返回流式或非流式响应

**请求体：**
```typescript
{
  systemPrompt: string;
  userPrompt: string;
  formData?: Record<string, any>;
}
```

**响应体：**
```typescript
{
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}
```

---

### 阶段 5: 前端页面组件
**任务：** 开发移动端适配的页面和组件

**核心组件：**

1. **`app/page.tsx`** - 主页面
   - 组合 Form 和 Result 组件
   - 管理表单状态和结果状态
   - 移动端布局

2. **`components/ChatForm.tsx`** - 表单组件
   - 使用 Ant Design Mobile 组件
   - 输入字段（根据业务需求定义）
   - 提交按钮
   - 表单验证

3. **`components/ResultDisplay.tsx`** - 结果展示组件
   - Markdown 渲染（可选）
   - 加载状态
   - 错误状态
   - 重新生成按钮

4. **`components/Loading.tsx`** - 加载组件
   - 动画加载效果

**移动端适配：**
- 使用 Ant Design Mobile 的 Grid / Flex 布局
- 适配不同屏幕尺寸
- 触摸友好的交互

---

### 阶段 6: 集成与测试
**任务：** 完整功能测试

**测试项：**
- 表单提交流程
- API 请求/响应
- 错误处理
- 加载状态
- 移动端 UI 适配

---

## 执行顺序

1. ✅ 初始化项目
2. ✅ 配置基础结构
3. ✅ 实现 LLM Client 模块
4. ✅ 创建 API 路由
5. ✅ 开发前端组件
6. ✅ 集成测试

---

## 后续优化（可选）
- 添加流式响应支持
- 添加对话历史记录
- 添加用户认证
- 添加数据持久化
