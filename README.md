# MyFarm（纯文字农场）

Vue 3 农场前端：种植、收获、商店、仓库、集市任务。默认界面为 **3.0 森林绿**（`v3`），另有 1.0 纯文字、2.0 深蓝玻璃，可在设置页切换。

技术栈：Vue 3、Vite 6、Pinia、Vue Router（Hash）、Axios、Vant 4。

## 环境要求

- Node.js 18+（建议 20）
- npm
- 已启动的农场后端（接口前缀见下文）

## 本地运行

```sh
npm install
```

复制并编辑环境变量（仓库里已有示例文件，按本机后端改即可）：

- 开发：`.env.development`
- 生产构建：`.env.production`

```sh
npm run dev
```

开发服务默认：

- 地址：`http://localhost:4568/`（`vite.config.js` 中 `port: 4568`，`host: 0.0.0.0`，局域网可访问）
- 路由为 Hash，首页即 `/#/`，登录 `/#/login`

其他命令：

```sh
npm run build      # 产出 dist/
npm run preview    # 预览构建结果
npm run lint       # ESLint + oxlint
npm run format     # Prettier（src/）
```

## 配置后端

前端**没有** Vite 反向代理。请求直接打到 `VITE_API_URL`，由 Axios `baseURL` 拼接接口路径。

### 1. 环境变量

| 变量 | 作用 | 示例 |
| --- | --- | --- |
| `VITE_API_URL` | 后端根地址，不要带末尾 `/` | 本地 `http://127.0.0.1:9999`，线上 `https://api.example.com` |
| `VITE_APP_ENV` | 环境标识 | `development` / `production` |
| `VITE_APP_NAME` | 展示用中文名 | `纯文字农场` |
| `VITE_APP_NAME_EN` | 请求头 `app_name`，后端用来区分应用 | `MyFarm` |
| `VITE_UI_VERSION` | 可选，默认皮肤 `v1` / `v2` / `v3`。设置页选择会写入 localStorage，优先级更高 | `v3` |

改完 `.env.*` 后需要**重启** `npm run dev`。Vite 只在启动时注入 `VITE_` 变量。

本地开发建议 `.env.development`：

```env
VITE_API_URL=http://127.0.0.1:9999
VITE_APP_ENV=development
VITE_APP_NAME=纯文字农场
VITE_APP_NAME_EN=MyFarm
```

`0.0.0.0` 不能作为浏览器里的 API 主机名，请写成后端实际监听的 `127.0.0.1` 或局域网 IP。

### 2. 后端需要配合的点

1. **CORS**  
   允许前端来源（如 `http://localhost:4568`、`http://你的电脑IP:4568`），方法含 POST/GET，并允许自定义头：`Authorization`、`device_type`、`app_name`。

2. **鉴权**  
   登录成功后前端把 token 放在 localStorage，请求头为：

   ```http
   Authorization: Bearer <token>
   app_name: MyFarm
   device_type: <web 等>
   ```

   HTTP `401` 会清登录态并提示重新登录。

3. **响应格式**  
   业务体需包含 `res_code`：

   - `0`：成功，前端使用 `data` 字段
   - `6200`：需要绑定邮箱/地址
   - 其他非 0：当作错误，展示 `res_msg`

4. **接口路径**  
   相对 `VITE_API_URL`，例如：

   - `/api/farmUser/initFarm`、`getLandList`、`plant`、`harvest` 等
   - `/api/farmWarehouse/getList`（需传 `type`：`seed` 背包 / `fruit` 仓库）
   - `/api/farmShop/getList`、`buy`
   - `/api/farmTask/getList`、`submit`

   完整列表见 `src/api/farm.js`、`src/api/user.js`、`src/api/global.js`。

5. **登录**  
   支持邮箱验证码、邮箱密码、Web3。未登录访问农场会跳到 `/login`。访客可用 `visitor_id`（与 token 二选一即可进首页）。

## 界面版本

| 版本 | 说明 |
| --- | --- |
| `v1` | 1.0 纯文字 |
| `v2` | 2.0 深蓝玻璃 |
| `v3` | 3.0 森林绿（默认） |

优先级：设置页（`localStorage` 键 `farm_ui_version`）> `VITE_UI_VERSION` > `v3`。切换会刷新页面。页面代码在 `src/views/v1|v2|v3/`。

## 目录（主要部分）

```
src/
  api/           接口封装
  components/    登录表单、FarmIcon、UI 切换等
  config/ui.js   界面版本
  stores/        Pinia（farm / user / global）
  utils/         请求、作物/NPC 图标
  views/v1|v2|v3  农场、登录、设置
public/images/farm/icons/   作物 SVG，NPC 在 icons/npc/
```

## 开发提示

- 推荐 VS Code + Volar（关闭 Vetur）。
- 图标：作物与 NPC 的 `icon` 字段对应 `public/images/farm/icons/` 下的文件名（NPC 在 `npc/` 子目录）。
