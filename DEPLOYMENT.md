# Cloudflare Workers 部署指南

这个项目已经从 Express.js 服务器迁移到 Cloudflare Workers，可以实现无服务器部署。

## 前置要求

1. **Cloudflare 账户**: 注册 [Cloudflare](https://cloudflare.com) 账户
2. **Node.js**: 确保安装了 Node.js 16.17.0 或更高版本
3. **Wrangler CLI**: 项目已包含 Wrangler 作为开发依赖

## 本地开发

### 1. 安装依赖
```bash
npm install
```

### 2. 设置环境变量
复制环境变量模板并设置你的 API 密钥：
```bash
cp .env.example .env
# 编辑 .env 文件，设置你的 API_KEY
```

### 3. 本地测试
运行基本功能测试：
```bash
node test-worker.js
```

### 4. 启动开发服务器
```bash
npm start
# 或者
npx wrangler dev
```

## 部署到 Cloudflare Workers

### 1. 登录 Cloudflare
```bash
npx wrangler login
```

### 2. 设置环境变量
在 Cloudflare Workers 中设置 API 密钥：
```bash
npx wrangler secret put API_KEY
# 输入你的 API 密钥
```

### 3. 部署到生产环境
```bash
npm run deploy
# 或者
npx wrangler deploy
```

### 4. 部署到测试环境
```bash
npm run deploy:staging
# 或者
npx wrangler deploy --env staging
```

## GitHub 自动部署

### 1. 推送代码到 GitHub
```bash
git add .
git commit -m "Migrate to Cloudflare Workers"
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

### 2. 在 Cloudflare Workers 中设置 GitHub 集成

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 Workers & Pages
3. 创建新的 Worker
4. 选择 "Connect to Git"
5. 连接你的 GitHub 仓库
6. 设置构建配置：
   - **Build command**: `npm install`
   - **Build output directory**: `/`
   - **Root directory**: `/`

### 3. 设置环境变量
在 Cloudflare Workers 设置页面中添加环境变量：
- `API_KEY`: 你的 API 密钥

### 4. 自动部署
现在每次推送到 main 分支时，Cloudflare 会自动部署新版本。

## API 端点

部署后，你的 API 将在以下端点可用：

- `GET /app/:id` - 获取应用详情
- `GET /list/:collection` - 获取应用列表
- `GET /search` - 搜索应用
- `GET /developer/:devId` - 获取开发者信息
- `GET /privacy/:id` - 获取隐私信息
- `GET /reviews/:id` - 获取评论
- `GET /similar/:id` - 获取相似应用
- `GET /version-history/:id` - 获取版本历史

## 认证

所有 API 请求都需要在请求头中包含 API 密钥：
```
x-api-key: your_secret_api_key_here
```

## 示例请求

```bash
# 获取应用详情
curl -H "x-api-key: your_api_key" https://your-worker.your-subdomain.workers.dev/app/553834731

# 搜索应用
curl -H "x-api-key: your_api_key" "https://your-worker.your-subdomain.workers.dev/search?term=candy%20crush&num=5"
```

## 配置文件说明

- `wrangler.toml`: Cloudflare Workers 配置文件
- `worker.js`: Workers 主入口文件
- `.env`: 本地环境变量（不要提交到 Git）
- `.env.example`: 环境变量模板

## 故障排除

### 1. 权限错误
如果遇到本地开发权限问题，可以尝试：
```bash
sudo chown -R $(whoami) ~/.wrangler
```

### 2. 依赖问题
如果某些 Node.js 包不兼容，项目已配置了 `nodejs_compat` 标志来解决大部分兼容性问题。

### 3. 环境变量
确保在 Cloudflare Workers 中正确设置了所有必需的环境变量。

## 成本优化

Cloudflare Workers 免费计划包括：
- 每天 100,000 次请求
- 每次请求最多 10ms CPU 时间

对于大多数用例，这已经足够了。如果需要更多资源，可以升级到付费计划。
