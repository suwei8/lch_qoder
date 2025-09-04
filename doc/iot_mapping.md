# 《智链物联对接映射表（设备→平台）》

> 目标：将**每个上报/下发**的语义、样例报文、字段解释、平台处理、幂等与重放规则**表格化固化**，便于实现与回放测试。

## 1. 概览
- 统一回调入口：`POST /api/device/callback`（平台侧）
- 下发统一出口：平台调用智链 `POST https://cloud.hbzhilian.com/AC/Cmd`（带 `X-App-ID`/`X-Token`）

## 2. 上报映射表
| 方向 | 触发 | 标识/ cmd | 示例（精简） | 关键字段 | 平台处理 | 幂等/去重 |
|---|---|---|---|---|---|---|
| 上报 | 上线 | `online` | `{cmd:"online",devid}` | devid | 置设备`online`、更新`last_seen_at` | `devid+timeWindow(60s)` |
| 上报 | 下线 | `offline` | `{cmd:"offline",devid}` | devid | 置设备`offline`、触发告警（可选） | 同上 |
| 上报 | 启动成功 | `09` | `CMD:09;NO:...;RESULT:1;` | NO(订单号), RESULT | 订单→`IN_USE`，记录`start_at` | `order_no` 唯一 |
| 上报 | 结算 | `10` | `CMD:10;NO:...;MONEY:100` | NO, MONEY, detailed | 订单→`DONE`，写分润、账务 | `order_no` 唯一 |
| 上报 | 配置/ICCID | `13` | 含 `config{p1..p18}, iccid` | config, iccid | 更新设备参数快照 | 覆盖最新 |
| 上报 | 缺水/缺液 | `19` | `CMD:19;ERR:1;RESULT:1` | ERR | 记录`alarm`，推送通知 | `devid+ERR+24h` 去重 |

> 注：`data` 字段为设备原文，平台需**同时保存原文**以便审计。

## 3. 下发映射表
| 方向 | 行为 | 智链API | payload | 说明 | 重试 |
|---|---|---|---|---|---|
| 下发 | 启动 | `/AC/Cmd` | `{devid, cmd:"09", data:"CMD:09;NO:<order_no>;MONEY:<cents>;"}` | `MONEY`为分；`NO`为平台订单号 | 超时30s，最多重试2次 |
| 下发 | 停止 | `/AC/Cmd` | `{devid, cmd:"action", data:"stop"}` | 预留 | 同上 |

## 4. 解析规范
- `data` 示例：`CMD:10;NO:00017241225401116;MONEY:1` → 解析为 `cmd=10, order_no, money`。
- 解析策略：`KV;` 分割；未知键入 `extra`。
- 字段校验：`devid` 必填；`NO` 必须能匹配平台订单号格式。

## 5. 安全与校验
- 平台回调需校验来源 IP 白名单/签名；
- 去重：按 `order_no` 执行幂等；
- 重放防护：timestamp + nonce + 签名（建议）。

## 6. 失败与补偿
- 启动成功未到：`STARTING` 超过 30s → 触发**自动退款**与**设备释放**；
- 结算未到：到达使用最长时长阈值 → 人工介入/超时兜底单；
- 回调失败：入队重试（DLQ，指数退避）。

