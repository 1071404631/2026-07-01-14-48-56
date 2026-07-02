# Render.com 免费云部署指南

> Render 是 GitHub 官方推荐的免费云服务，部署后同事 **24 小时**可在线访问，不需要你的电脑一直开着。

---

## 免费额度

| 项目 | 限制 |
|------|------|
| 运行时长 | 750 小时/月（刚好覆盖整月） |
| 内存 | 512 MB（本项目只用 ~30MB，完全够） |
| 休眠 | 15 分钟无人访问自动休眠，下次访问等 30 秒唤醒 |
| 数据 | **⚠️ 免费版数据文件在服务重启后会丢失**（重启用得不频繁，但需要定期备份） |

---

## 第一步：准备工作（5分钟）

### 1. 注册 GitHub 账号

1. 打开 https://github.com/signup
2. 用邮箱注册，设置用户名和密码
3. 注册后登录即可，不需要填任何额外信息

### 2. 下载 GitHub Desktop

1. 打开 https://desktop.github.com
2. 下载 Windows 版并安装
3. 打开 GitHub Desktop，用刚才注册的 GitHub 账号登录

---

## 第二步：上传代码到 GitHub（5分钟）

> 全程图形界面操作，不需要敲任何命令。

1. 打开 GitHub Desktop
2. 点击 **File → Add local repository**
3. 选择项目目录：`C:\Users\wuhaofan\WorkBuddy\2026-07-01-14-48-56`
4. 如果提示"not a git repository"，点击 **create a repository**
   - Name：填 `resume-filter`
   - 勾选 **Initialize this repository with a README** 选否
   - 点 **Create Repository**
5. 界面左侧会显示准备上传的文件列表，这些就是要部署到 Render 的文件：
   - `.gitignore`
   - `admin.html`
   - `index.html`
   - `logo.png`
   - `package.json`
   - `server.js`
6. 左下角 **Summary** 输入：`初始化项目`
7. 点击 **Commit to main**
8. 点击右上角 **Publish repository**
   - 取消勾选 **Keep this code private**（改为公开，免费部署需要公开仓库）
   - 点击 **Publish Repository**

✅ 代码已上传到 GitHub。

---

## 第三步：部署到 Render.com（5分钟）

### 1. 注册 Render

1. 打开 https://render.com
2. 点击 **Get Started for Free**
3. 选择 **Sign up with GitHub**（用你的 GitHub 账号登录）
4. 授权 Render 访问你的 GitHub

### 2. 创建 Web Service

1. 登录 Render 后，点击右上角 **New +** → **Web Service**
2. 在列表中找到你的仓库 `resume-filter`，点击 **Connect**
3. 填写配置（关键步骤）：

| 配置项 | 值 |
|--------|-----|
| **Name** | `resume-filter`（随便填） |
| **Region** | `Singapore`（新加坡，国内访问最快） |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | 留空（项目零依赖，不需要构建） |
| **Start Command** | `node server.js` |
| **Instance Type** | **Free**（默认就是免费） |

4. 点击页面底部的 **Create Web Service**

### 3. 等待部署

- Render 会自动检测项目、构建并启动
- 页面会显示部署日志，约 1-2 分钟
- 看到 **"Your service is live"** 就是成功了
- 你的网址会显示在页面上方，形如：`https://resume-filter-xxxx.onrender.com`

### 4. 测试访问

用浏览器打开你的 Render 网址：
- **填表页面**：`https://resume-filter-xxxx.onrender.com`
- **管理后台**：`https://resume-filter-xxxx.onrender.com/admin.html`

把这个网址发给同事，他们就能 **24 小时**在线填表了！

---

## 第四步：数据备份（重要！）

免费版在**极少数情况下**（Render 重启服务、部署更新等）数据可能会丢失。建议你：

### 定期备份（推荐每周一次）

1. 打开管理后台：`https://你的网址.onrender.com/admin.html`
2. 点击 **导出全部** 按钮
3. 下载的 JSON 文件就是完整备份，保存到电脑上

### 如果数据丢失了怎么办？

1. 打开管理后台
2. 点击导入按钮（或手动恢复）：目前需告诉我，我帮你加导入功能

---

## 更新代码

如果以后要修改页面（比如增减筛选条件），更新方法：

1. 在本地修改好文件（我会帮你改）
2. 打开 GitHub Desktop
3. 界面会显示修改了哪些文件
4. 左下角 Summary 输入这次改了什么（如"新增筛选条件"）
5. 点击 **Commit to main**
6. 点击 **Push origin**（右上角或顶部栏）
7. Render 会自动检测到 GitHub 更新，**自动重新部署**（约1-2分钟）

---

## 部署后验证清单

- [ ] 提交一条测试数据
- [ ] 管理后台能看到测试数据
- [ ] 导出数据试试
- [ ] 给同事发了网址，他们能打开
- [ ] 删除测试数据
- [ ] 已经阅读「数据备份」部分

---

## 常见问题

**Q: 页面打开很慢？**
A: 免费版 15 分钟无人访问会休眠。第一次打开需要等 30 秒左右唤醒，之后访问就正常了。这是正常的。

**Q: Render 网址太长了，能用短网址吗？**
A: 可以在 Render 后台 → Settings → 拉到页面底部 → **Custom Domain** 绑定你自己的域名。需要先买域名并做域名解析。

**Q: 数据真的会丢吗？**
A: Render 只在以下情况重启服务：你更新代码、Render 维护系统。日常使用中非常稳定，数据不易丢失。但**强烈建议定期备份**，有备无患。

**Q: 能隐藏管理后台不让同事看到吗？**
A: 目前管理后台和填表页面在同一个网址下，任何知道 `/admin.html` 的人都能访问。如果在意，后续可以加一个简单的密码保护。

**Q: 免费版够用吗？**
A: 750 小时/月刚好够 24 小时运行。偶尔的冷启动不影响使用。本项目内存占用很低，免费版绰绰有余。

**Q: 不想公开 GitHub 仓库怎么办？**
A: 免费部署需要公开仓库。如果介意，Render 有付费版（$7/月起）支持私有仓库。
