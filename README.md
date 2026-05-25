# FB Reels 批量开启 · Chrome Extension

一键批量打开 Facebook Reels 创建页。

## 功能特性

* **精准识别书签**：自动扫描书签栏，精准匹配 Reels Composer（发布工具）链接，自动过滤主页浏览等无关链接
* **多书签选择**：检测到多个 Reels 书签时，可手动选择要使用的链接，默认选择第一个
* **主页头像显示**：自动从书签链接提取主页 ID，通过 Graph API 显示对应的 Facebook 主页头像
* **ID 一键复制**：完整显示公共主页编号，点击即可复制到剪切板
* **灵活数量控制**：支持 1\~20 个标签页，提供快捷按钮（3 / 5 / 8 / 10 / 15）
* **多书签滚动**：超过 3 个书签时，列表区域支持上下滚动，方便选择
* **双速模式**

  * 🧍 拟人模式：每隔 1\~1.5 秒打开一个，模拟真人操作
  * ⚡ 极速模式（默认）：所有标签页瞬间同时打开
* **版本自动检测**：启动时自动检测 GitHub 最新版本，有新版本时弹出更新提示

## 安装方法

1. 前往 [Releases](https://github.com/secure-artifacts/fb-reels-bulk-opener/releases/latest) 下载最新版 ZIP
2. 解压到本地文件夹
3. 打开 Chrome，地址栏输入 `chrome://extensions/`
4. 右上角开启**开发者模式**
5. 点击**加载已解压的扩展程序**，选择解压后的文件夹
6. 扩展图标出现在工具栏，点击即可使用

## 使用方法

1. 在 Facebook Business Suite 中打开 Reels 创建页，将该链接保存到书签
2. 点击扩展图标，插件自动识别书签中的 Reels 链接并显示主页头像
3. 选择打开数量和速度模式
4. 点击**极速批量打开**

## 支持识别的链接格式

|链接类型|示例|是否识别|
|-|-|-|
|Business Suite Reels Composer|`business.facebook.com/latest/reels\_composer/...`|✅ 识别|
|Reels 创建页|`www.facebook.com/reels/create`|✅ 识别|
|主页 Reels 浏览页|`www.facebook.com/profile.php?...\&sk=reels\_tab`|❌ 自动过滤|

## 权限说明

|权限|用途|
|-|-|
|`bookmarks`|扫描书签，精准识别 Reels Composer 链接|
|`tabs`|批量创建新标签页|
|`host\_permissions`|访问 GitHub API 检测版本更新|

## 版本记录

|版本|说明|
|-|-|
|1.1|精准书签识别（过滤浏览页链接）、新增主页头像显示、ID 一键复制、拟人/极速双模式（默认极速）、多书签滚动、版本自动检测|
|1.0|初始发布|

## License

MIT

\---

## 如何发布新版本

本项目使用 GitHub Actions 自动构建和发布。每次发布新版本只需要创建一个 Git Tag 并推送即可。

### 发布步骤

#### 1\. 确保代码已提交并推送

```bash
git status
git add .
git commit -m "你的改动说明"
git push origin main
```

#### 2\. 创建版本 Tag

```bash
git tag -a v1.1 -m "Release version 1.1"
```

#### 3\. 推送 Tag 触发自动构建

```bash
git push origin v1.1
```

推送后，GitHub Actions 会自动：

1. 打包扩展为 zip 文件
2. 生成安全签名（Attestation）
3. 创建 Release 并上传 zip

#### 4\. 查看构建结果

* 构建进度：访问项目的 **Actions** 页面查看
* 发布结果：访问项目的 **Releases** 页面查看已发布的文件

### 版本号说明

|版本号格式|什么时候用|示例|
|-|-|-|
|`vX.0`|重大更新|`v2.0`|
|`vX.Y`|新增功能、优化改进|`v1.1`|

### 如果构建失败怎么办

1. 访问项目的 **Actions** 页面查看错误日志
2. 修复代码问题
3. 删除失败的 tag 并重新创建：

```bash
git tag -d v1.1
git push origin :refs/tags/v1.1
git tag -a v1.1 -m "Release version 1.1"
git push origin v1.1
```

