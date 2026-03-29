# 后端说明

这是 `Hello, my world` 的后端服务，负责登录、资料、分身、聊天、朋友圈、文件上传和 AI 推演接口。

## 当前能力

- 登录与会话隔离
- 用户资料管理
- 分身创建与同步
- 聊天消息
- 朋友圈动态与评论
- 文件上传与落盘
- 分支推演 AI 接口

## 目录说明

- `prisma/schema.prisma`：数据库结构
- `prisma/migrations/`：数据库迁移
- `prisma/seed.ts`：种子数据
- `src/auth/`：登录、密码、会话、鉴权
- `src/routes/auth.ts`：登录相关接口
- `src/routes/branches.ts`：分身相关接口
- `src/routes/ai.ts`：AI 推演、动态、回复接口
- `src/store/databaseStore.ts`：数据库实现
- `src/store/memoryStore.ts`：内存实现
- `src/utils/upload.ts`：文件上传落盘
- `uploads/`：实际上传文件目录

## 环境变量

- `PORT=3001`
- `CORS_ORIGINS=http://localhost:5173,http://localhost:4173`
- `DATABASE_URL=file:C:/Users/7_0/AppData/Local/WHM1/dev.db`
- `DEEPSEEK_BASE_URL=https://api.deepseek.com`
- `DEEPSEEK_API_KEY=你的 DeepSeek 密钥`
- `DEEPSEEK_TEXT_MODEL=deepseek-chat`
- `AI_PROXY_BASE_URL=https://128api.cn/v1`
- `AI_PROXY_API_KEY=你的图片代理密钥`
- `AI_IMAGE_MODEL=gemini-2.0-flash-exp-image-generation`
- `AI_REQUEST_TIMEOUT_MS=60000`

说明：

- 文本推演固定走 `DEEPSEEK_TEXT_MODEL`
- 图片生成固定走 `AI_IMAGE_MODEL`
- 文本请求通过 DeepSeek 的 OpenAI 兼容接口完成，图片请求继续走原来的图片链路
- 这样可以避免一个模型名同时兼顾文本和图片时互相冲突

## 单入口访问

如果前端已经打包到 `server/public/`，这个后端会同时提供：

- H5：`/`
- 管理后台：`/admin/`
- API：`/api`

对应的构建产物会落在：

- `server/public/h5`
- `server/public/admin`

## 启动方式

```bash
cd server
npm install
npm run prisma:generate
npm run db:migrate
npm run dev
```

如果要重新写入种子数据：

```bash
npm run db:seed
```

如果要启动单入口生产版：

```bash
npm run build
npm run start
```

## 登录流程

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

说明：

- 注册只需要手机号 + 密码，系统会直接为新账号创建独立世界
- 登录只验证已经存在的手机号和密码，不再自动创建账号
- 登录成功后前端需要带 `Authorization: Bearer <token>`
- 除了 `GET /api/health`、`POST /api/auth/login` 和 `POST /api/auth/register`，其他主要接口都需要登录
- 如果注册成功，返回的数据结构和登录一致，前端可以直接进入主界面

## 文件上传

- 上传接口：`POST /api/files/upload`
- 文件会先写入 `server/uploads/`
- 然后把文件信息登记到数据库
- 外部可以通过 `/uploads/...` 直接访问

## AI 推演

- `POST /api/branches/preview`
- `POST /api/ai/moments/generate`
- `POST /api/ai/replies`

说明：

- 预演会结合当前用户资料、年份和分身内容来生成
- 如果 AI 返回失败，前端会提示重试，不会偷偷走本地模板
- AI 请求使用兼容 OpenAI 的 `chat/completions` 流式接口，`delta.content` 会被逐段拼接

## 常用脚本

```bash
npm run dev
npm run build
npm run build:server
npm run build:web
npm run start
npm run prisma:generate
npm run db:migrate
npm run db:seed
```
