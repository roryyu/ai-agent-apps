# Code Review Checklist — ai-agent-apps

适用于 Next.js + TypeScript AI Agent 项目的 Code Review 清单。每个 PR 都应对照此清单进行审查。

---

## A. 架构 (Architecture)

- [ ] **SSE 流式逻辑**：是否重复了 `reader.read()` + `decoder.decode()` + `chunk.split('\n\n')` 模式？应提取为共享 `useSSEStream()` 自定义 hook
- [ ] **主题组件重复**：ChatForm / ResultDisplay / Loading 是否仅在样式上有差异？应参数化为单一组件，接受 `theme` prop
- [ ] **API 路由重复**：`/api/chat` 和 `/api/chat-love` 共享约70%代码（LLM客户端初始化、消息构建、流处理）。应提取共享流式逻辑到 `lib/llm/stream.ts`
- [ ] **共享组件使用**：所有页面是否使用了 `components/` 下的共享组件？

## B. 安全 (Security)

- [ ] **路径遍历**：API 路由是否使用用户输入构造文件路径？`type` 参数必须白名单校验
- [ ] **输入验证**：每个 API 路由是否在 `request.json()` 后验证了类型、长度、必填字段？
- [ ] **密钥泄露**：代码中是否有硬编码的 API Key / Token？检查 `lib/llm/config.ts` 和 `.env` 文件是否被提交
- [ ] **个人数据存储**：是否存储了 PII？`chat-love` 路由中 `selfDesc` / `partnerDesc` 包含个人隐私数据，需脱敏处理
- [ ] **XSS via Markdown**：`react-markdown` 是否渲染了未消毒的内容？需添加 `rehype-sanitize`
- [ ] **限流**：API 路由是否有频率限制？LLM 调用会产生费用，必须控制
- [ ] **请求大小限制**：是否限制了 `userPrompt` 的最大长度？

## C. AI 特定 (AI-Specific)

- [ ] **Prompt 注入**：用户输入是否与系统提示正确分离？是否使用了 API 原生的 system/user 消息分离
- [ ] **Token 预算**：是否有输入长度限制？`max_tokens` 已设置但无输入限制
- [ ] **LLM 输出校验**：LLM 返回的 JSON 是否被安全解析？`JSON.parse()` 后是否有错误处理
- [ ] **费用监控**：流式路径是否跟踪了 Token 使用量？当前仅非流式路径使用 `TokenCounter`
- [ ] **流超时**：LLM API 调用是否设置了超时？防止连接挂起

## D. TypeScript & React

- [ ] **Hook 依赖数组**：`useCallback` / `useMemo` 的依赖数组是否正确？
- [ ] **Session ID 一致性**：所有页面是否使用 `generateSessionId()` from `lib/session.ts`？是否通过 `useEffect` 设置以避免 hydration 不匹配？
- [ ] **未使用的导入**：是否有未使用的 import 或变量？
- [ ] **类型断言**：`as` 类型断言是否安全？是否可以用类型收窄替代？
- [ ] **`any` 类型**：是否避免了 `any`？是否可以用具体类型替代？

## E. 错误处理 (Error Handling)

- [ ] **HTTP 状态码**：API 路由是否返回正确的 HTTP 错误码（400/429/500）？验证失败应返回 400，限流返回 429
- [ ] **流错误传播**：`controller.error()` 的错误是否被客户端正确捕获？
- [ ] **优雅降级**：LLM API 不可用时，用户是否看到有意义的错误信息？

## F. 样式 (Styling)

- [ ] **CSS 文件大小**：`globals.css` 是否超过可维护范围？应按主题拆分
- [ ] **内联样式**：是否过度使用 `style={{}}` ？应优先使用 CSS 类或 Tailwind 工具类
- [ ] **样式方案统一**：是否混合使用 Tailwind 类和自定义 CSS？应选择一种方案为主

---

## 自动化检查命令

提交 PR 前请确保以下命令全部通过：

```bash
npm run format:check   # 格式检查
npm run lint           # ESLint 检查
npm run lint:ts        # TypeScript 编译检查
npm run test           # 单元测试
npm run build          # Next.js 构建
```
