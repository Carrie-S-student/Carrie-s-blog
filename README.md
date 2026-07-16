# Carrie's Blog

这是一个用 Next.js 搭建的个人博客，包含：

- **前台（6 个页面）**：首页、学习与输入、思考与输出、Research、关于我、提问箱
- **自建评论系统**（访客免登录即可评论）
- **提问箱**（访客提问 → 后台审核回复 → 公开显示）
- **学术论文展示**（Research 页面，记录论文题目/发表时间/期刊会议）
- **后台管理系统**：密码登录、写文章（所见即所得编辑器，支持插入图片/视频/YouTube）、管理评论、审核提问箱、管理论文、站点设置
- **全局动画系统**：页面切换过渡动画、按钮微交互反馈
- **深色模式**：支持亮色/暗色切换，跟随系统偏好

你完全不需要懂代码，跟着下面的步骤操作就能把博客跑起来、部署上线。

## 一、本地先跑起来看看效果

1. 安装依赖（只需要第一次执行）：

   ```bash
   npm install
   ```

2. 复制环境变量文件：

   ```bash
   cp .env.example .env
   ```

   然后打开 `.env` 文件，按照里面的中文注释填好每一项（本地开发阶段，`DATABASE_URL` 可以先用 `npx prisma dev` 自动生成，`BLOB_READ_WRITE_TOKEN` 可以先留空，本地上传图片视频的功能会不可用，但其他功能都能正常使用）。

3. 同步数据库结构：

   ```bash
   npx prisma db push
   ```

4. 启动开发服务器：

   ```bash
   npm run dev
   ```

   这条命令会同时启动前端页面和后端 API，因为这个项目是一个完整的 Next.js 应用。
   - 前端页面：`/`, `/about`, `/learning`, `/thinking`, `/ask` 等
   - 后台管理：`/admin`, `/admin/login`, `/admin/settings` 等
   - 后端接口：`/api/admin/upload` 以及文章、评论、提问箱数据的读取/写入

   然后浏览器打开 http://localhost:3000 就能看到博客了。后台地址是 http://localhost:3000/admin，用你在 `.env` 里设置的 `ADMIN_PASSWORD` 登录。

   如果想模拟生产环境，可以先运行：

   ```bash
   npm run build
   npm run start
   ```

## 二、上传首页背景图

- 首页背景图现在直接在后台设置：登录后台 → 站点设置 → 上传首页背景图。
- 上传成功后，系统会保存图片地址到数据库，首页会自动读取并显示。
- 如果你想直接使用本地图片，也可以先把它放到 `public/hero.jpg`，然后在后台设置页面的 URL 输入框里填 `/hero.jpg` 并保存。
- 目前关于我页面的照片仍然使用 `public/about.jpg`。

如果你在本地看到“还没有配置 BLOB_READ_WRITE_TOKEN，暂时无法上传文件”的提示，说明你的本地 `.env` 里还没有填入 Vercel Blob 的读写令牌。这个功能不是必须部署后才可用，但要使用后台上传图片，必须先在 Vercel Blob 中创建存储并把生成的 `BLOB_READ_WRITE_TOKEN` 填到本地 `.env`。如果你暂时不想配置 Vercel Blob，直接用 `public/hero.jpg` 作为本地背景图即可。

没有放照片之前，首页会显示默认渐变背景，关于我页面会显示占位提示，不影响其他功能。

## 三、正式部署上线（推荐：Vercel + Neon + Vercel Blob，都有免费额度）

### 1. 准备一个数据库（Neon）

1. 去 https://neon.tech 免费注册并创建一个 Postgres 数据库。
2. 创建后复制它给你的连接字符串（形如 `postgres://...`），先记下来，之后会用到。

### 2. 把代码放到 GitHub

如果还没有 GitHub 仓库，创建一个新仓库，把这个项目的代码推送上去（可以让我帮你操作 git 命令）。

### 3. 在 Vercel 部署

1. 去 https://vercel.com 用 GitHub 账号登录。
2. 点 "Add New" → "Project"，选择你刚才的仓库，点 Import。
3. 在环境变量（Environment Variables）里填入以下几项（对应 `.env.example` 里的说明）：
   - `NEXT_PUBLIC_SITE_URL`：你的博客公开访问地址，例如 `https://my-blog.vercel.app`
   - `DATABASE_URL`：刚才从 Neon 复制的连接串
   - `ADMIN_PASSWORD`：你自己设置的后台密码
   - `SESSION_SECRET`：本地终端运行 `openssl rand -base64 32` 生成的随机字符串
   - `BLOB_READ_WRITE_TOKEN`：先留空，下一步创建好 Blob 存储后再回来补上
4. 点 Deploy，等它构建完成。

### 4. 开通图片/视频上传功能（Vercel Blob）

1. 部署完成后，进入这个项目的 Vercel 控制台，点顶部 "Storage" 标签。
2. 创建一个新的 Blob Store（免费额度足够个人博客使用）。
3. 创建后 Vercel 会自动帮你把 `BLOB_READ_WRITE_TOKEN` 加进项目的环境变量里；如果没有自动添加，就手动复制粘贴到项目设置的环境变量里。
4. 回到 Deployments 标签，找到最新一次部署，点右上角菜单选择 "Redeploy" 让新的环境变量生效。

### 5. 同步数据库结构到线上数据库

在你自己电脑的项目文件夹里，临时把 `.env` 里的 `DATABASE_URL` 换成 Neon 的线上连接串，然后运行：

```bash
npx prisma db push
```

跑完之后再把 `.env` 换回本地开发用的数据库连接串（如果还需要本地开发）。

完成以上步骤后，你的博客就正式上线了，可以用 Vercel 分配的网址访问，后台地址是「网址 + /admin」。

## 四、日常怎么用

- **写文章**：登录后台 → 文章管理 → 写新文章，写完可以先不勾选"发布"存为草稿，想公开的时候再编辑勾选发布。
- **插入图片/视频**：编辑器工具栏里点"图片/视频"按钮直接上传；也可以点"YouTube"按钮粘贴视频链接直接嵌入。
- **管理标签**：后台"标签管理"里为每个栏目创建分类标签，写文章时可以给文章打标签。
- **管理评论**：后台"评论管理"里可以隐藏或删除不合适的评论。
- **回复提问箱**：后台"提问箱"里能看到访客的提问，写好回复点"回复并公开"后，访客就能在 `/ask` 页面看到你的回复了；如果不想公开某条提问，点"拒绝"即可。
- **添加论文记录**：后台"Research"里填写论文题目、发表时间和期刊/会议，前台 `/research` 页面会自动展示。

---

以下是这个项目技术层面的补充说明（给你自己或者其他开发者看）：

- 框架：Next.js 16（App Router）+ React 19 + Tailwind CSS v4，纯 JavaScript，没有用 TypeScript。
- 数据库：Prisma 7 + PostgreSQL（本地用 `prisma dev`，线上推荐 Neon）。
- 鉴权：单一后台密码登录，基于 JWT 的 session cookie，`proxy.js` 负责保护 `/admin/*` 路由。
- 编辑器：Tiptap 所见即所得编辑器，保存的是 HTML；前台渲染时会用 `isomorphic-dompurify` 做一次安全过滤。
- 文件上传：走 `/api/admin/upload` 这个 Route Handler（不是 Server Action，避免 1MB 请求体限制），存储在 Vercel Blob。
