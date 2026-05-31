# FB Reels 批量开启 · Chrome Extension

自动识别 Facebook 专业主页，一键批量打开 Reels 创建页。

## 功能特性

* **自动识别专业主页**（v2.0 新增）：自动检测当前 Facebook 登录的专业主页，获取名称和主页 ID，直接生成 Reels 创建链接——无需手动收藏书签
* **真实公共主页编号精准识别**（v2.0 新增）：严格从页面内嵌 JSON 数据中提取真实公共主页编号，绝不使用网址中的链接数字，宁缺毋滥
* **智能缓存机制**：首次打开 Facebook 页面后，专业名称和主页 ID 自动缓存，之后即使未打开 Facebook 也能直接使用
* **书签兜底**：自动检测失败时，回退到书签识别模式，保持向下兼容
* **多书签选择**：检测到多个 Reels 书签时，可手动选择要使用的链接
* **主页头像显示**：通过 Graph API 显示对应的 Facebook 主页头像
* **公共主页ID 一键复制**：hover 查看完整编号，点击即可复制到剪贴板
* **偏好设置面板**（v2.0 新增）：右上角齿轮按钮进入设置，所有配置带记忆，下次直接生效

  * 默认打开数量、默认速度模式
  * 自动打开 FB 主页 / 日程本开关
  * 自动添加日程本书签（检测到专业主页后自动保存，已有则跳过）
  * 启动时检测更新开关
* **灵活数量控制**：支持 1\~20 个标签页，提供快捷按钮（3 / 5 / 8 / 10 / 15）
* **双速模式**

  * 拟人模式：每隔 1\~1.5 秒打开一个，模拟真人操作
  * 极速模式（默认）：所有标签页瞬间同时打开
* **版本自动检测**：启动时自动检测 GitHub 最新版本，有新版本时弹出更新提示

## 安装方法

1. 前往 [Releases](https://github.com/secure-artifacts/fb-reels-bulk-opener/releases/latest) 下载最新版 ZIP
2. 解压到本地文件夹
3. 打开 Chrome，地址栏输入 `chrome://extensions/`
4. 右上角开启**开发者模式**
5. 点击**加载已解压的扩展程序**，选择解压后的文件夹
6. 扩展图标出现在工具栏，点击即可使用

## 使用方法

1. 打开 Facebook 页面，确保已切换到专业模式（公共主页）
2. 插件自动检测专业主页并生成 Reels 创建链接
3. 点击扩展图标，确认检测到的主页信息
4. 选择打开数量和速度模式
5. 点击**极速批量打开**

> 💡 首次使用需打开一次 Facebook 页面，之后插件会自动缓存主页信息，无需重复操作。

## 检测优先级

| 优先级 | 模式 | 说明 |
|-|-|-|
| 1 | 自动检测 | 从 Facebook 页面自动获取真实公共主页编号，生成 Reels 链接 |
| 2 | 书签识别 | 自动检测失败时，扫描书签中的 Reels 链接作为兜底 |

## 支持识别的链接格式

| 链接类型 | 示例 | 是否识别 |
|-|-|-|
| Business Suite Reels Composer | `business.facebook.com/latest/reels_composer/...` | ✅ 识别 |
| Reels 创建页 | `www.facebook.com/reels/create` | ✅ 识别 |
| 主页 Reels 浏览页 | `www.facebook.com/profile.php?...&sk=reels_tab` | ❌ 自动过滤 |

## 权限说明

| 权限 | 用途 |
|-|-|
| `bookmarks` | 扫描书签，识别 Reels Composer 链接（兜底模式）；自动添加日程本书签 |
| `tabs` | 批量创建新标签页 |
| `storage` | 缓存当前登录的专业主页名称和 ID；保存偏好设置 |
| `activeTab` / `scripting` | 向 Facebook 页面注入检测脚本，读取主页信息 |
| `host_permissions` | 访问 Facebook 页面检测登录状态、访问 GitHub API 检测版本更新 |

## 版本记录

| 版本 | 说明 |
|-|-|
| 2.0 | 自动识别专业主页并精准提取真实公共主页编号（宁缺毋滥）、偏好设置面板（默认数量/速度/前置任务/自动书签/更新检测，全部带记忆）、智能降级逻辑（有编号→自动模式，无编号→书签模式）、主页头像修复 |
| 1.1 | 精准书签识别（过滤浏览页链接）、新增主页头像显示、ID 一键复制、拟人/极速双模式（默认极速）、多书签滚动、版本自动检测 |
| 1.0 | 初始发布 |

## License

MIT

---

## 如何发布新版本

本项目使用 GitHub Actions 自动构建和发布。每次发布新版本只需要创建一个 Git Tag 并推送即可。

### 发布步骤

#### 1\. 确保代码已提交并推送

```bash
git status
git add .
git commit -m "v2.0: 自动识别专业主页，无需书签"
git push origin main
```

#### 2\. 创建版本 Tag

```bash
git tag -a v2.0 -m "Release version 2.0"
```

#### 3\. 推送 Tag 触发自动构建

```bash
git push origin v2.0
```

推送后，GitHub Actions 会自动：

1. 打包扩展为 zip 文件
2. 生成安全签名（Attestation）
3. 创建 Release 并上传 zip

#### 4\. 查看构建结果

* 构建进度：访问项目的 **Actions** 页面查看
* 发布结果：访问项目的 **Releases** 页面查看已发布的文件

### 版本号说明

| 版本号格式 | 什么时候用 | 示例 |
|-|-|-|
| `vX.0` | 重大更新 | `v2.0` |
| `vX.Y` | 新增功能、优化改进 | `v2.1` |

### 如果构建失败怎么办

1. 访问项目的 **Actions** 页面查看错误日志
2. 修复代码问题
3. 删除失败的 tag 并重新创建：

```bash
git tag -d v2.0
git push origin :refs/tags/v2.0
git tag -a v2.0 -m "Release version 2.0"
git push origin v2.0
```
