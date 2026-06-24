# 休闲游戏资源管理 API 文档

## 概述

- **管理端**：需 JWT 登录，权限与短剧管理端一致（`@PreAuthorize` + `PermissionConstants`）
- **客户端 SDK**：路径前缀 `/sdk/game`，鉴权与短剧 SDK 一致（Header 签名 + Token）
- **数据库脚本**：`sql/game_category.sql`、`sql/game_info.sql`、`sql/game_user_action.sql`

---

## 一、管理端 API

统一响应格式：`ApiResponse<T>`

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {},
  "timestamp": 1710000000000,
  "version": "x.x.x"
}
```

请求头：`Authorization: Bearer <JWT_TOKEN>`

### 1. 游戏分类管理

| 接口 | 方法 | 路径 | 权限 |
|------|------|------|------|
| 新增分类 | POST | `/api/gameCategory/add` | `system:gameCat:add` |
| 更新分类 | PUT | `/api/gameCategory/update` | `system:gameCat:edit` |
| 删除分类 | DELETE | `/api/gameCategory/delete/{id}` | `system:gameCat:delete` |
| 分页查询 | POST | `/api/gameCategory/page` | `system:gameCat:list` |
| 全量列表 | GET | `/api/gameCategory/list` | `system:gameCat:list` |

**分类字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Long | 主键 |
| categoryCode | String | 分类编码（自动生成） |
| categoryName | String | 分类名称 |
| descCn | String | 中文描述（可选） |
| descEn | String | 英文描述（可选） |
| imageUrl | String | 分类图片（可选） |

**分页请求示例**

```json
{
  "current": 1,
  "size": 10,
  "categoryName": "休闲"
}
```

### 2. 游戏资源管理

| 接口 | 方法 | 路径 | 权限 |
|------|------|------|------|
| 分页查询 | POST | `/api/gameInfo/page` | `system:game:list` |
| 详情 | GET | `/api/gameInfo/{id}` | `system:game:list` |
| 新增 | POST | `/api/gameInfo/add` | `system:game:add` |
| 更新 | PUT | `/api/gameInfo/update` | `system:game:edit` |
| 删除 | DELETE | `/api/gameInfo/delete/{id}` | `system:game:delete` |

**游戏字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| gameId | String | 8位唯一标识（新增时自动生成） |
| gameName | String | 游戏名称 |
| categoryCode | String | 分类编码 |
| description | String | 描述（可选） |
| iconUrl | String | 图标地址 |
| status | Integer | 0下线，1上线 |
| bannerUrl | String | Banner图（可选） |
| videoUrl | String | 介绍视频（可选） |
| detailImages | String | 详情图列表，逗号分隔 |
| languageCode | String | 语言编码 |
| rating | Integer | 管理端评分 1-5 |
| downloadCount | Long | 下载量 |
| version | Integer | 版本号，默认1 |
| resourceUrl | String | zip资源地址 |
| resourceSize | Long | 资源大小（字节） |
| orientation | Integer | 0横屏，1竖屏 |
| bannerPin | Integer | Banner置顶 0/1 |
| hotPosition | Integer | 热门位置 0/1 |
| popularityScore | Integer | 热度值 |
| avgRating | Decimal | 平均评分 |
| favoriteCount | Long | 收藏数 |

**分页搜索请求**

```json
{
  "current": 1,
  "size": 10,
  "gameName": "消除",
  "categoryCode": "GC123456",
  "languageCode": "zh",
  "status": 1
}
```

默认按 `createdAt` 降序排序。

### 3. 游戏资源文件管理

| 接口 | 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|------|
| 获取上传地址 | POST | `/api/gameFile/uploadUrl` | `system:game:edit` | COS 预签名直传 |
| 替换资源 | POST | `/api/gameFile/replace` | `system:game:edit` | 先删旧文件再更新 |
| 下载资源 | GET | `/api/gameFile/download/{id}` | `system:game:list` | 返回预签名下载URL |
| 资源列表 | POST | `/api/gameFile/list` | `system:game:list` | 同游戏分页 |
| 资源详情 | GET | `/api/gameFile/detail/{id}` | `system:game:list` | 游戏详情 |
| 删除资源文件 | DELETE | `/api/gameFile/delete/{id}` | `system:game:edit` | 仅删COS文件 |

**获取上传地址请求**

```json
{
  "fileType": "resource",
  "fileExtension": ".zip",
  "fileContentType": "application/zip"
}
```

`fileType` 可选：`resource` / `icon` / `banner` / `detail` / `video`

**响应**

```json
{
  "preSignedUrl": "https://...",
  "fileUrl": "https://...",
  "key": "dev/games/resource/xxx.zip"
}
```

**替换资源请求**

```json
{
  "id": 1,
  "resourceUrl": "https://cdn.example.com/xxx.zip",
  "resourceSize": 1048576
}
```

---

## 二、客户端 SDK API

统一路径前缀：`/sdk/game`

统一响应格式：`SdkResponse<T>`

### 公共请求头

| Header | 说明 |
|--------|------|
| appId | 应用ID |
| uid | 用户ID |
| apiSignature | AES 签名 |
| timestamp | 时间戳 |
| nonce | 32位随机串 |
| token | Access Token（注册接口除外） |

### 请求体包装

```json
{
  "baseInfo": {},
  "data": { }
}
```

### 1. 用户认证

| 接口 | 方法 | 路径 | 需Token |
|------|------|------|---------|
| 注册/获取Token | POST | `/sdk/game/register` | 否 |
| Google登录 | POST | `/sdk/game/login` | 是 |
| 退出登录 | POST | `/sdk/game/logout` | 是 |

**注册请求 data**

```json
{
  "paramMd5": "MD5(uid+appId+appSecret+appPkg)"
}
```

**登录请求 data**

```json
{
  "idToken": "Google ID Token"
}
```

### 2. 行为统计

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 下载统计 | POST | `/sdk/game/download` | 记录 uid、gameId、IP、时间 |
| 评分统计 | POST | `/sdk/game/rating` | 记录 uid、gameId、IP、评分、时间 |
| 收藏统计 | POST | `/sdk/game/favorite` | 支持取消收藏 |

**下载统计**

```json
{
  "data": { "gameId": "12345678" }
}
```

**评分统计**

```json
{
  "data": { "gameId": "12345678", "rating": 5 }
}
```

**收藏统计**

```json
{
  "data": { "gameId": "12345678", "isFavorite": 1 }
}
```

`isFavorite`：0取消，1收藏

### 3. 游戏查询

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 分类游戏列表 | POST | `/sdk/game/getGameList` | 分页，仅上线游戏 |
| 游戏详情 | POST | `/sdk/game/getGameDetail` | 按 gameId 查询 |
| 名称搜索 | POST | `/sdk/game/searchGames` | 分页模糊搜索 |

**分类列表请求**

```json
{
  "data": {
    "current": 1,
    "size": 10,
    "categoryCode": "GC123456",
    "sortType": 0
  }
}
```

**sortType 排序**

| 值 | 排序字段 |
|----|----------|
| 0 | 热度值 popularityScore（默认） |
| 1 | 下载量 downloadCount |
| 2 | 评分 avgRating |

**游戏详情请求**

```json
{
  "data": { "gameId": "12345678" }
}
```

**搜索请求**

```json
{
  "data": {
    "current": 1,
    "size": 10,
    "gameName": "消除",
    "sortType": 1
  }
}
```

**列表响应 data 示例**

```json
{
  "dataCode": 0,
  "dataMsg": "成功",
  "total": 100,
  "size": 10,
  "current": 1,
  "pages": 10,
  "records": [
    {
      "gameId": "12345678",
      "gameName": "开心消消乐",
      "categoryCode": "GC123456",
      "iconUrl": "https://...",
      "downloadCount": 1000,
      "popularityScore": 88,
      "avgRating": 4.50
    }
  ]
}
```

---

## 三、权限常量（需在 menu 表配置）

| 权限标识 | 说明 |
|----------|------|
| system:gameCat:list | 游戏分类列表 |
| system:gameCat:add | 新增分类 |
| system:gameCat:edit | 编辑分类 |
| system:gameCat:delete | 删除分类 |
| system:game:list | 游戏列表/详情 |
| system:game:add | 新增游戏 |
| system:game:edit | 编辑游戏/文件 |
| system:game:delete | 删除游戏 |

---

## 四、部署说明

1. 执行 SQL 脚本创建表
2. 在 `menu` 表添加游戏管理菜单及上述权限标识
3. 为角色绑定对应权限
4. 客户端使用已注册的 `appId` / `appSecret` 调用 SDK 接口
