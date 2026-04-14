# AI 短剧生成工作台 — 项目状态日志

> 每次新会话开始时，先让 Claude 读取本文件以恢复上下文。

---

## 当前阶段

**Phase 1.8 完成** ✅ — 卡片流 CRUD 管理（前移/后移/插入/删除）  
**Phase 2 完成** ✅ — DeepSeek LLM 接入（分镜拆解 + 提示词润色）  
**Phase 3 完成** ✅ — 可灵 API 接入（JWT 鉴权 + 任务提交 + 5s 轮询）  
**Phase 4 完成** ✅ — 工作区持久化（localStorage Auto-Save + 清空工作台）  
**Phase 5 完成** ✅ — 多剧本管理 + ZIP/TXT 导出中心  
**Phase 5.5 完成** ✅ — 手动中断视频生成 + BYOK 鉴权架构重构  
**Phase 6 完成** ✅ — 生产环境构建预检 + Vercel 部署上线

---

## 🌐 线上环境信息

| 项目 | 地址 |
|------|------|
| **生产网站（常用）** | https://ai-drama-studio-ten.vercel.app |
| **Vercel 控制台** | https://vercel.com/zyc-bit-dots-projects/ai-drama-studio |
| **GitHub 仓库** | https://github.com/zyc-bit-dot/ai-drama-studio |
| **本地开发** | http://localhost:3000（`npm run dev`） |

### GitHub / Vercel 账号信息

| 平台 | 用户名 | 邮箱 |
|------|--------|------|
| GitHub | `zyc-bit-dot` | zhangyuchi2309@gmail.com |
| Vercel | `zyc-bit-dot`（同 GitHub OAuth） | zhangyuchi2309@gmail.com |

### 自动部署说明

Vercel 已连接 GitHub 仓库的 `main` 分支。每次执行以下操作后，Vercel 会**自动触发重新部署**（无需手动操作）：

```bash
cd /home/anbq/ai-drama-studio
git add .
git commit -m "描述改动"
git push   # 推送到 main 分支即触发自动部署
```

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 框架 | Next.js 16.2.3（App Router，Turbopack） |
| 语言 | TypeScript |
| 样式 | Tailwind CSS v4 |
| UI 组件 | shadcn/ui v4（base-ui 底层） |
| 状态持久化 | localStorage（自定义 `useLocalStorage` Hook） |
| LLM | DeepSeek API（OpenAI SDK 兼容） |
| 视频生成 | 可灵 Kling API（JWT HS256 鉴权） |
| 部署 | Vercel Serverless |

---

## 目录结构

```
ai-drama-studio/
├── PROJECT_LOG.md               ← 本文件（交接文档）
├── .gitignore                   ← 已排除 .env*, node_modules, .next, data/config.json
├── data/
│   └── config.json              ← 服务端加密 Key 备用存储（本地开发用，已 gitignore）
├── lib/
│   ├── apiKeys.ts               ← 客户端 API Key 工具（localStorage 读写 + 生成请求 Header）
│   ├── server/
│   │   ├── config.ts            ← 服务端 Key 读写（Node crypto AES-256，Serverless 下为空）
│   │   ├── llm/
│   │   │   ├── LLMService.ts    ← LLM 服务接口定义
│   │   │   └── DeepSeekAdapter.ts ← DeepSeek 适配器（支持 Header Key 覆盖）
│   │   └── video/
│   │       ├── VideoService.ts  ← 视频服务接口定义
│   │       └── KlingAdapter.ts  ← 可灵适配器（JWT 生成 + 支持 Header Key 覆盖）
│   ├── exportUtils.ts           ← ZIP / TXT 导出工具
│   └── genres.ts                ← 题材选项常量（GENRE_OPTIONS）
├── types/
│   └── index.ts                 ← 共享类型定义（Scene, Project, ApiKeyConfig 等）
├── hooks/
│   └── useLocalStorage.ts       ← 类型安全 localStorage Hook（SSR/Hydration 安全）
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 ← 主控台页面入口（客户端组件）
│   └── api/
│       ├── settings/route.ts    ← GET/POST API Key（向后兼容，生产环境不再使用）
│       ├── analyze/route.ts     ← 真实分镜拆解（DeepSeek）
│       ├── polish/route.ts      ← 真实提示词润色（DeepSeek）
│       ├── video/
│       │   ├── generate/route.ts ← 提交可灵视频任务
│       │   └── status/route.ts  ← 查询可灵任务状态
│       ├── export/proxy/route.ts ← 视频下载代理（绕过 CORS）
│       └── mock/                ← Mock 接口（保留备用，不再被前端调用）
└── components/
    ├── settings/
    │   └── SettingsDialog.tsx   ← API Key 设置面板（BYOK，存 localStorage）
    └── studio/
        ├── StudioLayout.tsx       ← 整体布局 + 全局状态管理
        ├── NovelInput.tsx         ← Tab 1：小说批量拆解
        ├── DirectInput.tsx        ← Tab 2：直接写分镜
        ├── StoryboardPreview.tsx  ← 右侧分镜卡片网格（含中断按钮）
        ├── ProjectLibrary.tsx     ← 左侧剧本库抽屉（Sheet）
        └── VideoProgress.tsx      ← 底部进度面板
```

---

## API 接口说明

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/analyze` | POST | 分镜拆解（DeepSeek），Header: `X-Deepseek-Key` |
| `/api/polish` | POST | 提示词润色（DeepSeek），Header: `X-Deepseek-Key` |
| `/api/video/generate` | POST | 提交可灵任务，Header: `X-Kling-Access` + `X-Kling-Secret` |
| `/api/video/status` | GET | 查询任务状态，Header: `X-Kling-Access` + `X-Kling-Secret` |
| `/api/export/proxy` | GET | 视频下载代理，query: `?url=...` |
| `/api/settings` | GET/POST | 服务端 Key 存储（向后兼容，生产环境已弃用） |

---

## 鉴权架构（BYOK 模式）

**生产环境（Vercel Serverless）采用 BYOK（Bring Your Own Key）模式：**

1. 用户在「设置」面板输入 API Key
2. Key 保存在**浏览器 localStorage** 中（不上传服务器）
3. 每次调用 API 时，前端从 localStorage 读取 Key，放入自定义 HTTP Header 发送
4. 后端从 Header 中读取 Key 并调用第三方 API
5. 后端若 Header 中无 Key，回退读取服务端 `data/config.json`（本地开发用）

```
localStorage
  drama-studio-deepseek-key    → Header: X-Deepseek-Key
  drama-studio-kling-access-key → Header: X-Kling-Access
  drama-studio-kling-secret-key → Header: X-Kling-Secret
```

**前端工具函数：** `lib/apiKeys.ts`
- `getApiHeaders()` — 读取 localStorage，返回 Header 对象，供 fetch 使用
- `saveApiKeys()` — 保存 Key 到 localStorage
- `getStoredApiKeys()` — 读取 Key 原值（用于 SettingsDialog 状态徽章）
- `maskTail() / maskMiddle()` — 客户端脱敏显示

---

## 视频生成状态机

| Kling task_status | 前端 SceneStatus | progress |
|-------------------|-----------------|----------|
| submitted | pending | 10% |
| processing | generating | 每轮+8%，上限 90% |
| succeed | completed | 100% |
| failed | failed | 0% |

**注意**：progress 0→90% 是前端模拟进度（每 5 秒轮询 +8%，约 56 秒到顶）。90%→100% 必须等可灵返回 `succeed`，可灵实际生成时间通常 3~10 分钟，高峰期更长，属正常现象。

---

## 已完成功能

### Phase 0
- [x] Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui v4 初始化

### Phase 1
- [x] 三栏布局（左：小说输入，右：分镜预览，底：进度面板）
- [x] `SettingsDialog` — API Key 输入面板

### Phase 1.5
- [x] 左侧双 Tab（小说智能拆解 / 直接写分镜）
- [x] 分镜卡片 Prompt 区域可编辑 Textarea
- [x] 「✨ AI 润色」按钮

### Phase 1.8
- [x] 卡片头部 4 个管理按钮（前移 / 后移 / 插入 / 删除）
- [x] 边界禁用：第一张禁前移，最后一张禁后移
- [x] 生成中所有管理按钮 disabled

### Phase 2
- [x] `DeepSeekAdapter` — analyzeNovel / polishPrompt
- [x] `POST /api/analyze` — 真实小说拆解
- [x] `POST /api/polish` — 真实提示词润色
- [x] sonner Toast 通知（loading / success / error）

### Phase 3
- [x] `KlingAdapter` — JWT 生成 + submitTask + queryTask
- [x] `POST /api/video/generate` — 提交任务
- [x] `GET /api/video/status` — 查询状态
- [x] 前端 5s 轮询（pollingRefs Map 管理，组件卸载自动清理）
- [x] 删除卡片时自动停止对应轮询

### Phase 4
- [x] `useLocalStorage` Hook（SSR/Hydration 安全）
- [x] scenes + projectTitle 持久化到 localStorage
- [x] 「🗑️ 清空工作台」按钮 + AlertDialog 二次确认

### Phase 5
- [x] 多剧本管理（ProjectLibrary 抽屉，左侧面板）
- [x] 剧本新建 / 切换 / 删除
- [x] ZIP 批量下载已完成视频（`/api/export/proxy` 绕 CORS）
- [x] TXT 剧本文件导出

### Phase 5.5 — 手动中断 + BYOK 重构
- [x] `handleCancelGeneration` — 立即 clearInterval，状态重置为 idle，progress 归零
- [x] SceneCard 生成中显示红色「中断」按钮（StopCircle 图标）
- [x] SettingsDialog 改为纯 localStorage 存取（废弃 `/api/settings` 调用）
- [x] 所有前端 fetch 加入 API Key Headers（`getApiHeaders()`）
- [x] DeepSeekAdapter / KlingAdapter 支持 Header Key 覆盖参数
- [x] 修复 base-ui `asChild` TypeScript 报错（改用 `render` prop）

### Phase 6 — 生产部署
- [x] `npm run build` 零报错零警告通过
- [x] `.gitignore` 覆盖所有敏感文件
- [x] git 初始化，分支 `main`，绑定远程 `origin`
- [x] Vercel CLI 部署，生产环境上线

---

## 本地开发

```bash
cd /home/anbq/ai-drama-studio
npm run dev
# 访问 http://localhost:3000
```

**gh CLI 路径**（已安装到用户目录）：

```bash
export PATH="$HOME/bin:$PATH"   # 新终端需执行一次
gh auth status                   # 验证登录状态
```

---

## 已知注意事项

- Next.js 16 + React 19：`use client` 组件不能直接 async/await 渲染，数据获取用 `useEffect` + `useState`
- Tailwind v4：不再支持 `tailwind.config.js`，主题变量在 `globals.css` 定义
- shadcn/ui v4（base-ui 底层）：不支持 `asChild` prop，需改用 `render` prop（见 `ProjectLibrary.tsx` 和 `StudioLayout.tsx`）
- 可灵视频生成时长：通常 3~10 分钟，前端进度条 90% 是上限，等可灵返回 `succeed` 后跳 100%

---

## 待办 / 可扩展方向

- [ ] 批量生成（一键生成所有 idle 场景）
- [ ] 错误重试策略（指数退避）
- [ ] 自定义域名绑定（Vercel 控制台 → Domains）
- [ ] 可灵模型参数暴露（时长 5s/10s、画幅比例、高清模式）
