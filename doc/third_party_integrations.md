# 《第三方组件集成说明》

> 本文定义本项目中 *短信通知* 与 *微信公众号模板消息* 的对接方案、环境变量、发送策略与事件映射，确保前后端/运维/测试对齐。

---

## 一、短信接口（腾讯云 SMS SDK）

### 1.1 环境变量
```
TENCENT_SMS_SECRET_ID=
TENCENT_SMS_SECRET_KEY=
TENCENT_SMS_SDK_APP_ID=
TENCENT_SMS_SIGN_NAME=亮车惠
# 业务模板（示例，可按需扩展）
TENCENT_SMS_TMPL_DEVICE_ALARM=123456   # 设备缺水/缺液/离线
TENCENT_SMS_TMPL_ORDER_REFUND=123457   # 订单退款通知
TENCENT_SMS_TMPL_SETTLEMENT=123458     # 商户结算到账
```
> 建议：不同场景用不同模板，便于统计与文案优化。

### 1.2 发送规范
- **SDK**：`tencentcloud-sdk-python` / `tencentcloud-sdk-nodejs`（后端选其一）；
- **并发与限速**：按腾讯云配额限制 QPS；本地使用**令牌桶**限流（如 20 req/s）；
- **重试**：网络错误重试 2 次，退避 200ms/500ms；
- **模板变量**：保持顺序与类型（字符串）一致，示例：
  - 设备告警：`[门店名, 设备号, 告警类型, 时间]`
  - 退款通知：`[订单号, 金额元, 原因, 时间]`
- **合规**：用户手机号须经过授权存储；敏感字段脱敏存储（日志屏蔽中间四位）。

### 1.3 服务接口（内部）
```
POST /internal/notify/sms
Body: { template_key:"DEVICE_ALARM", mobiles:["13800000000"], params:["XX门店","61029077","缺液","08-22 11:23"] }
Resp: { code:0, requestId:"..." }
```
- 幂等：`mobiles+template_key+params+5min` 去重；
- 失败入队重试（DLQ）。

---

## 二、微信公众号模板消息（按角色差异化发送）

### 2.1 环境变量
```
# 公众平台基础
WECHAT_APP_ID=wx...
WECHAT_APP_SECRET=...

# 模板ID（示例）
WECHAT_TMPL_DEVICE_ALARM=TMPL_xxx1    # 设备异常（商户/平台运维）
WECHAT_TMPL_ORDER_PAID=TMPL_xxx2      # 订单支付成功（用户）
WECHAT_TMPL_ORDER_DONE=TMPL_xxx3      # 订单完成/结算（用户）
WECHAT_TMPL_REFUND=TMPL_xxx4          # 退款进度（用户）
WECHAT_TMPL_WITHDRAW=TMPL_xxx5        # 提现/结算到账（商户）
WECHAT_TMPL_DEVICE_OFFLINE=TMPL_xxx6  # 批量离线/恢复（平台运维/商户）
```
> 建议按**角色**与**事件**划分模板，避免一模板多义造成字段拥挤。

### 2.2 事件→角色→模板 映射矩阵
| 事件 | 触发时机 | 角色 | 模板 | 主要字段(keys) |
|---|---|---|---|---|
| 设备缺水/缺液 | cmd=19 | 商户店长/店员、平台运维 | DEVICE_ALARM | 门店、设备号、告警类型、时间、处理入口URL |
| 设备离线/上线 | online/offline | 商户店长/店员、平台运维 | DEVICE_OFFLINE | 门店、设备号、状态、时间、运维入口URL |
| 订单支付成功 | 支付回调 | 用户 | ORDER_PAID | 订单号、门店、预计金额、开始使用入口URL |
| 订单已完成 | cmd=10 结算 | 用户 | ORDER_DONE | 订单号、金额、时间、订单详情URL |
| 退款进度 | 退款受理/完成 | 用户 | REFUND | 订单号、退款金额、状态、预计到账时间 |
| 商户结算到账 | 财务结算 | 商户老板/财务 | WITHDRAW | 结算周期、金额、到账账户、对账单链接 |

### 2.3 发送规范
- **用户同意**：确保用户已关注/授权；模板消息需遵循公众号模板消息新规（改为“订阅消息”则需改走订阅路径）。
- **频率控制**：同事件同人 10 分钟去重；批量告警合并（例如 30 分钟窗口内离线设备合并成一条）。
- **可达性兜底**：若用户未关注/发送失败 → 退化为短信（如商户关键告警）。
- **跳转URL**：统一走 H5 页面带 `scene` 参数，便于埋点与定位。

### 2.4 服务接口（内部）
```
POST /internal/notify/wechat
Body: { template_key:"ORDER_DONE", openid:"o_xxx", data:{ order_no:"NO123", amount:"12.30", time:"08-22 21:33" }, url:"https://m.lch.com/order/NO123" }
Resp: { code:0, msgId:"..." }
```
- 幂等：`openid+template_key+data.hash+5min` 去重；
- 失败重试：2 次，退避 1s/3s。

---

## 三、统一通知网关（推荐）

为前端与业务模块提供统一触发入口，由网关路由到“微信/短信”，并完成**模板渲染、限流、去重、队列、审计**：
```
POST /api/notify/trigger
{
  "scene": "DEVICE_ALARM",
  "audiences": [
    {"type":"merchant","merchant_id":1001,"roles":["owner","manager"]},
    {"type":"platform","roles":["ops"]}
  ],
  "payload": {"store":"XX门店","devid":"61029077","alarm":"缺液","time":"08-22 11:23"},
  "channels": ["wechat","sms"],
  "callback_url": null
}
```
- 场景配置化：`scene`→`模板Key集合(+优先级)`；
- 受众解析：由服务根据角色查 `openid / mobile`；
- 审计：`notify_log` 存储（scene, channel, to, status, request/response, requestId）。

---

## 四、数据表建议
- `notify_log(id, scene, channel, to_user, role, status, request, response, error, created_at)`
- `user_contact(user_id, openid, mobile, allow_marketing:boolean, allow_alarm:boolean, updated_at)`
- `template_registry(template_key, channel, template_id, title, vars, status)`

---

## 五、测试与回归
- 准备**沙箱模板**与**灰度手机号**；
- 用例覆盖：
  1) 设备缺液→商户店长收到微信；未关注→转短信；
  2) 订单完成→用户微信模板跳转订单详情；
  3) 30 分钟内重复离线→仅一次通知；
  4) 批量合并告警（≥5 台离线）→一条汇总；
  5) 队列阻塞/失败→DLQ 告警；

---

## 六、落地建议
- 以“统一通知网关”封装，前台与业务层只关心 `scene + payload`；
- 模板变量与文案统一登记在 `template_registry`；
- 建立可观测指标：发送QPS、失败率、到达率（可用点击率近似）。



---

## 七、第三方通知配置（腾讯云短信 + 微信模板消息）

### 7.1 腾讯云短信（SMS）
```
TENCENT_SMS_SECRET_ID=
TENCENT_SMS_SECRET_KEY=
TENCENT_SMS_SDK_APP_ID=
TENCENT_SMS_SIGN_NAME=亮车惠
# 业务模板（示例）
TENCENT_SMS_TMPL_DEVICE_ALARM=123456   # 设备缺水/缺液/离线
TENCENT_SMS_TMPL_ORDER_REFUND=123457   # 订单退款通知
TENCENT_SMS_TMPL_SETTLEMENT=123458     # 商户结算到账
```
**建议**：按场景拆分模板ID，便于统计与文案维护；本地令牌桶限流，网络错误重试2次。

### 7.2 微信公众号模板消息
```
# 模板ID示例（按事件/角色拆分）
WECHAT_TMPL_DEVICE_ALARM=TMPL_xxx1    # 设备异常（商户/平台运维）
WECHAT_TMPL_ORDER_PAID=TMPL_xxx2      # 订单支付成功（用户）
WECHAT_TMPL_ORDER_DONE=TMPL_xxx3      # 订单完成/结算（用户）
WECHAT_TMPL_REFUND=TMPL_xxx4          # 退款进度（用户）
WECHAT_TMPL_WITHDRAW=TMPL_xxx5        # 提现/结算到账（商户）
WECHAT_TMPL_DEVICE_OFFLINE=TMPL_xxx6  # 批量离线/恢复（运维/商户）
```
**说明**：模板消息需确保用户关注或订阅；失败时可回退到短信通道（关键告警）。



---

## 9. 通知网关与通道接口（新增）

### 9.1 统一通知触发（推荐给业务方调用）
`POST /api/notify/trigger`
- Header：`Authorization: Bearer <JWT>`
- Body：
```json
{
  "scene": "DEVICE_ALARM",                     
  "audiences": [                                
    {"type":"merchant","merchant_id":1001,"roles":["owner","manager"]},
    {"type":"platform","roles":["ops"]},
    {"type":"user","user_id": 2001}
  ],
  "payload": {"store":"XX门店","devid":"61029077","alarm":"缺液","time":"08-22 11:23"},
  "channels": ["wechat","sms"],              
  "callback_url": null                          
}
```
- 200：`{ code:0, data:{ requestId, accepted: true } }`
- 400：`scene 未注册 / payload 缺关键字段`
- 429：频控触发（同人同场景 10 分钟去重）
- 说明：由服务内部路由到对应通道（微信/短信），完成模板渲染、限流、去重、队列与审计。

### 9.2 微信模板消息（内部通道）
`POST /internal/notify/wechat`
- Body：`{ template_key:"ORDER_DONE", openid:"o_xxx", data:{ order_no:"NO123", amount:"12.30", time:"08-22 21:33" }, url:"https://m.lch.com/order/NO123" }`
- 200：`{ code:0, msgId:"..." }`
- 幂等：`openid+template_key+data.hash+5min` 去重；失败重试2次（退避1s/3s）。

### 9.3 短信（内部通道，腾讯云SMS）
`POST /internal/notify/sms`
- Body：`{ template_key:"DEVICE_ALARM", mobiles:["13800000000"], params:["XX门店","61029077","缺液","08-22 11:23"] }`
- 200：`{ code:0, requestId:"..." }`
- 幂等：`mobiles+template_key+params.hash+5min` 去重；本地限流（令牌桶），网络错误重试2次。

### 9.4 错误码（新增通知相关）
- `37001 NotifySceneNotFound`（未注册的 `scene`）
- `37002 AudienceResolveFailed`（受众解析失败，缺 openid/mobile）
- `37003 ChannelRejected`（第三方通道拒绝/模板非法）
- `37004 NotifyThrottled`（频控触发）

### 9.5 审计与观测
- `notify_log(id, scene, channel, to_user, role, status, request, response, error, created_at)`
- 指标：发送QPS、失败率、到达率（可用点击率近似）。

