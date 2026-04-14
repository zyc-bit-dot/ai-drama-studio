# AI 短剧生成工作台 — 项目状态日志

> 每次新会话开始时，先让 Claude 读取本文件以恢复上下文。

---

## 当前阶段

**Phase 1.8 完成** ✅ — 卡片流 CRUD 管理（前移/后移/插入/删除）  
**Phase 2 完成** ✅ — DeepSeek LLM 接入（分镜拆解 + 提示词润色）  
**Phase 3 完成** ✅ — 可灵 API 接入（JWT 鉴权 + 任务提交 + 5s 轮询）  
**Phase 4 完成** ✅ — 工作区持久化（localStorage Auto-Save + 清空工作台）  
**Phase 5 完成** ✅ — 多剧本管理 + ZIP/TXT 导出中心

---

## 已完成功能

### Phase 0
- [x] Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui v4 初始化
- [x] crypto-js 类型包安装

### Phase 1
- [x] 主控台三栏布局（左：小说输入，右：分镜预览，底：进度面板）
- [x] `SettingsDialog` — API Key 输入面板（前端遮挡显示）
- [x] `POST /api/settings` — 后端加密保存 Key 到 `data/config.json`
- [x] `GET /api/settings` — 返回脱敏 Key（DeepSeek: `****xxxx`；Kling Access Key: `xxxx****xxxx`；Kling Secret Key: `****xxxx`）
- [x] 可灵双密钥拆分：`klingAccessKey` + `klingSecretKey` 独立存储，Secret Key 前端永久遮挡
- [x] `POST /api/mock/analyze` — Mock 分镜拆解（返回 5 个场景卡片）
- [x] `POST /api/mock/generate` — Mock 视频生成（SSE 流式进度推送）
- [x] Mock 数据驱动完整 UI 交互闭环

### Phase 1.5
- [x] 左侧双 Tab 模式（shadcn Tabs）
  - Tab 1「📖 小说智能拆解」：原有批量拆解逻辑不变
  - Tab 2「⚡ 直接写分镜」：8 种题材选择器 + 单条 Prompt 输入 → 追加到分镜板
- [x] 分镜卡片 Prompt 区域改为可编辑 Textarea（用户随时修改后可重新生成）
- [x] 「✨ AI 润色」按钮：Mock 1s loading → 随机从 5 种电影级提示词模板中选一个替换当前 Prompt
- [x] 可灵双密钥（klingAccessKey + klingSecretKey）独立存储，Secret Key 永久遮挡

### Phase 1.8
- [x] 卡片头部 4 个管理按钮（ArrowLeft / ArrowRight / Plus / Trash2，ghost icon）
- [x] `handleMoveSceneUp/Down`：数组内交换位置
- [x] `handleDeleteScene`：从数组移除
- [x] `handleInsertSceneAfter`：就地插入，继承 genre，prompt 为空，id 唯一
- [x] 序号 `#N` 由数组实际位置（arrayIndex）动态渲染，不依赖 scene.index 字段
- [x] 边界禁用：第一张卡 ArrowLeft disabled，最后一张 ArrowRight disabled
- [x] 生成中（pending/generating）4 个管理按钮全部 disabled，防止状态错乱
- [x] hover title 提示文字（向前移 / 向后移 / 在此后插入分镜 / 删除分镜）

---

## 目录结构

```
ai-drama-studio/
├── PROJECT_LOG.md               ← 本文件
├── data/
│   └── config.json              ← API Key 加密存储（gitignored）
├── lib/
│   ├── server/
│   │   └── config.ts            ← 服务端 Key 读写（Node crypto AES-256）
│   └── genres.ts                ← 题材选项常量（GENRE_OPTIONS）
├── types/
│   └── index.ts                 ← 共享类型定义（Scene, Config 等）
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 ← 主控台页面（客户端组件入口）
│   └── api/
│       ├── settings/route.ts    ← GET/POST API Key
│       └── mock/
│           ├── analyze/route.ts ← Mock 分镜拆解
│           └── generate/route.ts← Mock 视频生成（SSE）
└── components/
    ├── settings/
    │   └── SettingsDialog.tsx
    └── studio/
        ├── StudioLayout.tsx       ← 整体布局 + 状态管理 + Tabs
        ├── NovelInput.tsx         ← Tab 1：小说批量拆解
        ├── DirectInput.tsx        ← Tab 2：直接写分镜（新增）
        ├── StoryboardPreview.tsx  ← 右侧分镜卡片（含可编辑 Prompt + 润色）
        └── VideoProgress.tsx      ← 底部进度面板
```

---

## API 接口说明

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/settings` | GET | 获取已保存 Key（脱敏显示） |
| `/api/settings` | POST | 保存 Key（body: `{ deepseekKey, klingAccessKey, klingSecretKey }`） |
| `/api/analyze` | POST | **真实** 分镜拆解（DeepSeek，body: `{ novelText }`） |
| `/api/polish` | POST | **真实** 提示词润色（DeepSeek，body: `{ prompt }`） |
| `/api/video/generate` | POST | **真实** 提交可灵任务（body: `{ prompt }`，返回 `{ taskId }`） |
| `/api/video/status` | GET | **真实** 查询任务状态（query: `?taskId=xxx`） |
| `/api/mock/generate` | POST | 已废弃（保留文件备用） |
| `/api/mock/analyze` | POST | 保留备用（不再被前端调用） |

---

## 安全规范

- API Key 用 AES-256-CBC 加密，密钥 `SERVER_ENCRYPT_SECRET`（默认写在 `lib/server/config.ts`，生产环境改为环境变量）
- 前端**从不**存储明文 Key，只显示脱敏版本
- 所有 API 调用在服务端读取 Key 后发起

---

## 已完成 — Phase 2

- [x] `lib/server/llm/LLMService.ts` — 接口定义（analyzeNovel / polishPrompt）
- [x] `lib/server/llm/DeepSeekAdapter.ts` — OpenAI SDK 适配 DeepSeek，动态读取 Key，含结构验证
- [x] `POST /api/analyze` — 真实小说拆解，`response_format: json_object`，返回 3-6 个 Scene
- [x] `POST /api/polish` — 真实提示词润色，扩写为电影级英文镜头语言
- [x] 前端 Toast 通知（sonner）：loading / success / error 三态
- [x] `/api/mock/generate` 保留（Phase 3 替换为真实 Kling）

## 已完成 — Phase 3

- [x] `lib/server/video/VideoService.ts` — 接口定义（submitTask / queryTask）
- [x] `lib/server/video/KlingAdapter.ts`
  - JWT 生成：`{ iss: accessKey, exp: now+1800, nbf: now-5 }`，HS256
  - `submitTask`：POST `/v1/videos/text2video`，model_name=kling-v1
  - `queryTask`：GET `/v1/videos/text2video/{taskId}`，解析 task_status / videos[0].url
- [x] `POST /api/video/generate` — 提交任务，返回 `{ taskId }`
- [x] `GET /api/video/status?taskId=` — 查询状态，返回 `{ status, progress, videoUrl, coverUrl }`
- [x] 前端轮询（StudioLayout）
  - SSE 完全废弃，改为 `setInterval` 每 5s 轮询
  - `pollingRefs`（useRef Map）管理所有活跃 interval，组件卸载自动清理
  - processing 阶段每轮 progress +8%，上限 90%，succeed 跳 100%
  - 删除卡片时自动停止对应轮询
  - `isAnyGenerating` 由 scenes 状态派生（useMemo），无冗余 state

## Kling 状态映射

| Kling task_status | 前端 SceneStatus | progress |
|-------------------|-----------------|----------|
| submitted | pending | 10% |
| processing | generating | 每轮+8%，上限90% |
| succeed | completed | 100% |
| failed | failed | 0% |

## 已完成 — Phase 4

- [x] `hooks/useLocalStorage.ts` — 类型安全通用 Hook，SSR/Hydration 安全（useEffect 挂载后读取）
- [x] `scenes` 和 `projectTitle` 替换为 `useLocalStorage`，键名：`drama-studio-scenes` / `drama-studio-title`
- [x] 所有增删改查、进度更新、视频 URL 均实时同步到 localStorage
- [x] Hydration 期间显示「加载中...」占位，避免内容闪烁
- [x] 顶部新增「🗑️ 新建项目」按钮 + AlertDialog 二次确认弹窗
- [x] 确认后：清空 scenes、重置 title、清除 localStorage、停止所有轮询

## 待办事项 (Phase 5)

- [ ] 批量生成按钮（一键生成所有 idle 场景）
- [ ] 项目导出（JSON 文件下载）
- [ ] 错误重试策略（指数退避）

---

## 已知 Bug / 注意事项

- Next.js 16 + React 19 下 `use client` 组件不能使用 `async/await` 直接在渲染中 fetch，所有数据获取用 `useEffect` + `useState`
- Tailwind v4 不再支持 `tailwind.config.js`，主题变量在 `globals.css` 中定义
- `crypto-js` npm 包**未安装**（只有类型），服务端加密改用 Node.js 内置 `crypto` 模块

---

## 本地开发

```bash
cd /home/anbq/ai-drama-studio
npm run dev
# 访问 http://localhost:3000
```
