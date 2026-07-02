# Vercel 部署指南

## 第一步：准备 JSONBin（免费数据存储）

1. 打开 https://jsonbin.io
2. 点 "Sign Up" 注册（用邮箱，免费）
3. 登录后，点 "Create Bin"
4. 在内容里输入：
   ```
   {"records": []}
   ```
   > 注意：JSONBin 不能为空，所以必须包一层 `{"records": []}`
5. 点 "Create"
6. 记录以下信息：
   - **Bin ID**：在 URL 里，格式类似 `64a1b2c3d4e5f6g7h8i9j0k1`
   - **API Key**：点右上角头像 → "API Keys" → 复制 "Master Key"

## 第二步：上传代码到 GitHub

1. 打开 GitHub Desktop
2. 你应该会看到文件变更（新增了 `api/` 文件夹和 `vercel.json`）
3. 在左下角填写摘要：`适配 Vercel 部署`
4. 点 "Commit to main"
5. 点 "Push origin"

## 第三步：部署到 Vercel

1. 打开 https://vercel.com
2. 点 "Sign Up" → 选择 "Continue with GitHub"
3. 登录 GitHub 后，点 "Add New..." → "Project"
4. 选择你的 `resume-filter` 仓库
5. 在 "Environment Variables" 里添加：
   - `JSONBIN_API_KEY` = 你的 JSONBin API Key
   - `JSONBIN_BIN_ID` = 你的 JSONBin Bin ID
6. 点 "Deploy"

等待 1 分钟，Vercel 会给你一个网址：`https://你的项目名.vercel.app`

## 第四步：测试

1. 打开 `https://你的项目名.vercel.app`
2. 输入姓名，填写筛选条件，提交
3. 打开 `https://你的项目名.vercel.app/admin.html`
4. 查看是否能看到提交的记录

## 常见问题

### 1. 提交后数据没保存？
检查 Vercel 的环境变量是否设置正确。

### 2. 页面打不开？
检查 Vercel 部署日志，看是否有错误。

### 3. 同事无法访问？
确认 Vercel 项目是公开的（默认是公开的）。

## 数据存储说明

- 数据存储在 JSONBin（免费）
- 你可以随时登录 JSONBin 查看原始数据
- 免费版限制：10,000 次请求/月（够内部使用）
