# 部署指南

把这个平台放到线上的方式：后端 + Postgres 数据库用 **Render**，前端用 **Vercel**。两者都有免费/低价档位，付费部分需要绑一张信用卡。这份文档是实际要点的具体操作步骤——我没法帮你创建账号或者在控制台上点按钮，这些步骤需要你自己来跑。

预计总成本：**约每月 $13**（Render Web Service "Starter" 约 $7/月 + Render Postgres "Starter" 约 $6/月）。Vercel 的免费档对前端来说完全够用。

## 为什么选这个组合

- Render 是把后端跑成单个常驻进程，这一点在这里特别关键：后台登录（`backend/app/auth.py`）是把有效的 session token 存在进程内存里的一个 Python 集合，而不是数据库表。这种方式只有在"正好一个后端实例"的情况下才能正常工作——而这正好是 Render Starter Web Service 的默认行为（不用担心自动多实例扩容）。像 Vercel functions、AWS Lambda 这类无服务器平台会跑多个相互隔离的实例，会悄无声息地把登录功能弄坏。
- Render 在同一个控制台里也提供托管 Postgres，后端和数据库能放在一起管理。
- Vercel 特别适合前端，因为这是一个纯静态的 Vite 构建产物，没有服务端代码，免费档就很好用。

## 0. 把代码推到 GitHub

Render 和 Vercel 都是通过连接 GitHub 仓库来部署的。如果 `d:\code` 还不是一个推送到 GitHub 的 git 仓库，这就是第 0 步——建一个仓库（可以是私有的），把 `backend/` 和 `frontend/` 推上去。

## 1. Render：Postgres 数据库

1. 在 render.com 注册账号。
2. **New +** → **PostgreSQL**。起个名字（比如 `imagery-study-db`），选离你最近的区域，套餐选 **Starter**（约 $6/月——免费档的 Postgres 30 天后就会过期，不适合一个要跑好几个月的毕业论文项目）。
3. 创建好之后，复制 **Internal Database URL**（以 `postgres://...` 开头）——第 2 步要把这个粘贴到后端服务的环境变量里。

## 2. Render：后端 Web 服务

1. **New +** → **Web Service** → 连接你的 GitHub 仓库。
2. **Root Directory**（根目录）：`backend`
3. **Runtime**（运行环境）：Python 3
4. **Build Command**（构建命令）：`pip install -r requirements.txt`
5. **Start Command**（启动命令）：`uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. **Plan**（套餐）：Starter（约 $7/月——能避免免费档"闲置后休眠"的问题，不然空闲一段时间后第一个请求会等很久）
7. 在 **Environment**（环境变量）里加：
   - `DATABASE_URL` = 第 1 步复制的 Internal Database URL
   - `ADMIN_PASSWORD` = 你自己设置的一个正式密码（不要用默认的 `changeme-dev-password`——不设置的话后端会打印警告并且处于不安全状态）
   - `CORS_ORIGINS` = 先保持 `http://localhost:5173` 不动，等第 4 步拿到 Vercel 的地址后再回来改
8. 部署。上线后记下后端的公开地址（大概长这样：`https://imagery-study-backend.onrender.com`）——前端要用到这个地址。
9. 检查一下：浏览器打开 `https://<你的后端地址>.onrender.com/api/health`，应该返回 `{"status":"ok"}`。

## 3. Vercel：前端

1. 在 vercel.com 注册账号，**Add New** → **Project** → 导入同一个 GitHub 仓库。
2. **Root Directory**（根目录）：`frontend`
3. 框架预设应该会自动识别成 Vite（构建命令 `npm run build`，输出目录 `dist`）——保持默认设置就行。
4. 在 **Environment Variables**（环境变量）里加：
   - `VITE_API_BASE` = 第 2.8 步拿到的 Render 后端地址（比如 `https://imagery-study-backend.onrender.com`，末尾不要带斜杠）
5. 部署。记下生成的 Vercel 地址（比如 `https://imagery-study.vercel.app`）。

## 4. 回填 CORS，把两边接起来

回到 Render 后端服务的环境变量，设置：

- `CORS_ORIGINS` = `https://imagery-study.vercel.app`（第 3.5 步你实际拿到的 Vercel 地址）

保存——Render 会自动重新部署。不做这一步的话，部署好的前端发出的请求会被浏览器的 CORS 策略拦下来。

## 5. 验证线上部署

- 打开 Vercel 的地址，走一遍知情同意 → 意象问卷 → 客观任务 → 代码追踪 → Parsons problems → 结束页的完整流程，确认浏览器控制台（F12）没有报错。
- 打开 `<vercel地址>/admin`，用你设置的 `ADMIN_PASSWORD` 登录，确认刚才那个被试者的数据出现在列表里。

## 日常运维提示

- **数据持久性**：Render 上的 Postgres 跟 Web 服务是独立的——重新部署或重启后端不会动到数据。`Base.metadata.create_all()` 每次后端启动时都会跑（见 `backend/app/main.py`），但它只会*补齐*缺失的表/种子数据，绝不会删除或清空已有数据。
- **改后台密码**：在 Render 的环境变量里改 `ADMIN_PASSWORD` 然后重新部署即可；这会让之前签发的所有登录 token 立刻失效（因为 token 只在内存里校验，其实重启一次也会有同样的效果）。
- **本地开发不受影响**：只要不设置 `DATABASE_URL`/`CORS_ORIGINS` 这两个环境变量，后端还是会默认用本地 SQLite（`experiment.db`）和 `http://localhost:5173`——之前说过的本地跑法（开两个服务、访问 `localhost:5173`）完全不受影响，照旧能用。
