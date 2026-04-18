# 项目开发总结

## 项目概述

开发一个对话式生成式 AI 应用，手机端 H5，使用 Next.js + React + Ant Design Mobile + TypeScript。

---

## 开发过程

### 1. 初始化项目

**用户需求**：阅读 plan/project.md，制定开发计划并开始开发

**完成的工作**：
- 初始化 Next.js 15 项目（TypeScript + Tailwind）
- 安装所需依赖：antd-mobile、@anthropic-ai/sdk、openai
- 创建项目目录结构

### 2. 实现 LLM Client 核心模块

**用户需求**：主要业务逻辑是页面展示 form，提交后，System prompt 和 user prompt 一起给大模型，然后将返回值返回给页面展示出来

**完成的工作**：
- 创建 `lib/llm/types.ts` - 类型定义
- 创建 `lib/llm/config.ts` - 环境变量配置
- 创建 `lib/llm/token.ts` - Token 计数
- 创建 `lib/llm/client.ts` - LLM 客户端（支持 Anthropic 和 OpenAI）
- 创建 `app/api/chat/route.ts` - API 路由

### 3. 开发前端页面

**用户需求**：前端为手机端适配

**完成的工作**：
- 创建 `components/ChatForm.tsx` - 表单组件
- 创建 `components/ResultDisplay.tsx` - 结果展示组件
- 创建 `components/Loading.tsx` - 加载状态组件
- 创建 `app/page.tsx` - 主页面

### 4. 样式优化

**用户需求**：使用 frontend-design 技能做样式优化

**完成的工作**：
- 学习并应用 frontend-design 技能
- 采用复古未来主义 Brutalist 风格
- 深色主题 + 橙绿对比色
- 网格背景 + 扫描线动画
- 自定义卡片样式（硬阴影、粗边框、零圆角）
- Space Mono + Inter 字体组合

### 5. 简化输入框

**用户需求**：输入框只有一个，不需要分 topic 和 description

**完成的工作**：
- 将两个输入框合并为一个大文本域
- 更新类型定义和提交逻辑

### 6. systemPrompt 移到服务端

**用户需求**：systemPrompt 放在服务端，不用前端显示传递

**完成的工作**：
- 修改 API 路由，在服务端定义 systemPrompt
- 移除前端的 systemPrompt 传递

### 7. 从 soul.md 读取 systemPrompt

**用户需求**：systemPrompt 从 soul.md 中读取

**完成的工作**：
- 创建 `soul.md` 文件，包含段永平的人格设定
- 修改 API 路由，使用 fs/promises 读取 soul.md
- 添加错误处理，读取失败时回退到默认提示词

### 8. Markdown 渲染

**用户需求**：response 的内容使用 markdown 语法渲染

**完成的工作**：
- 安装 react-markdown 库
- 更新 ResultDisplay 组件，使用 ReactMarkdown
- 自定义所有 Markdown 元素的样式（标题、段落、列表、代码、引用等）

### 9. 流式响应

**用户需求**：chat 接口流式响应，大模型返回多少显示多少

**完成的工作**：
- 修改 API 路由，使用 Server-Sent Events (SSE) 返回流式响应
- 支持 OpenAI 和 Anthropic 两种 API 的流式调用
- 修改前端，使用 fetch API 读取流式响应
- 逐块解析 SSE 数据并累积显示
- Markdown 渲染实时更新

### 10. 独立 Session ID

**用户需求**：每个页面打开生成一个独立的 id，对应一个独立的 session，避免多人打开时，调用大模型，session 只有一个相互影响

**完成的工作**：
- 创建 `lib/session.ts` - 生成唯一会话 ID
- 前端在页面加载时生成 sessionId
- 请求头和请求体中传递 sessionId
- API 路由在所有日志前加上 [sessionId] 前缀
- 可以清楚区分不同用户的请求

---

## 项目技术栈

- **框架**：Next.js 15 (App Router)
- **UI 库**：Ant Design Mobile 5.x
- **语言**：TypeScript
- **LLM API**：Anthropic / OpenAI (兼容阿里云通义千问)
- **Markdown 渲染**：react-markdown

---

## 项目结构

```
app-money/
├── app/
│   ├── api/chat/route.ts      # LLM 流式 API 端点
│   ├── page.tsx                # 主页面
│   ├── layout.tsx              # 根布局
│   └── globals.css             # Brutalist 风格样式
├── lib/
│   ├── llm/
│   │   ├── client.ts           # LLM 客户端
│   │   ├── types.ts            # 类型定义
│   │   ├── config.ts           # 环境变量配置
│   │   ├── token.ts            # Token 计数
│   │   └── index.ts
│   └── session.ts              # Session ID 生成
├── components/
│   ├── ChatForm.tsx            # 输入表单
│   ├── ResultDisplay.tsx       # Markdown 结果展示
│   └── Loading.tsx             # 加载状态
├── soul.md                     # AI 人设（段永平）
├── .env.local                  # 环境变量配置
├── .env.example                # 环境变量示例
└── CLAUDE.md                   # 项目指导文档
```

---

## 设计风格

**复古未来主义 Brutalist 风格**
- 深色背景 (#0a0a0a)
- 橙色 (#ff3e00) + 亮绿色 (#00ff88) 对比色
- 网格背景图案
- 扫描线动画
- 硬阴影、粗边框、零圆角
- Space Mono（等宽）+ Inter（无衬线）字体

---

## 核心功能

1. ✅ 单输入框表单
2. ✅ 流式响应显示
3. ✅ Markdown 渲染
4. ✅ 独立会话 ID
5. ✅ 从 soul.md 读取人设
6. ✅ 移动端适配
7. ✅ Brutalist 设计风格
