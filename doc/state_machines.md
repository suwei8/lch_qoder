# 《订单&设备状态机与时序图》

## 1. 订单状态机
```
INIT -> PAY_PENDING -> PAID -> STARTING -> IN_USE -> SETTLING -> DONE
                               └-> REFUNDING -> CLOSED
INIT -> CLOSED (支付失败/取消)
```
- **INIT**：创建订单（预下单）
- **PAY_PENDING**：待支付（生成支付参数）
- **PAID**：已支付待启动（支付回调成功）
- **STARTING**：已下发启动指令，等待 `cmd=09` 上报
- **IN_USE**：收到 `cmd=09` 启动成功，计时
- **SETTLING**：使用结束，等待 `cmd=10` 结算
- **DONE**：结算完成
- **REFUNDING**：异常退款中
- **CLOSED**：已关闭（失败/撤销/全额退款）

### 1.1 状态迁移规则
- `PAY_PENDING` 超时（15min）→ `CLOSED`
- `STARTING` 超时（30s 未收到 09）→ `REFUNDING`
- `IN_USE` 最长时长阈值（设备配置 p10/p11 等）→ 强制结束 → `SETTLING`
- `SETTLING` 超时（60s 未收到 10）→ 人工审核/兜底

## 2. 设备状态机
```
offline -> online -> busy -> online
   ^                  |
   |------------------|
```
- `online/offline`：由上报 `cmd=online|offline` 驱动
- `busy`：平台判定（订单处于 `IN_USE`）

## 3. 关键时序
### 3.1 正常流程
```
User -> H5 -> API: 创建订单(预下单)
API -> Pay: 生成支付参数(JSAPI)
User -> Pay: 完成支付
Pay -> API: 支付成功回调 -> 订单=PAID
API -> ZhiLian: /AC/Cmd 下发启动(09)
ZhiLian -> API: 回调 09 启动成功 -> 订单=IN_USE
User 使用中...
ZhiLian -> API: 回调 10 结算 -> 订单=DONE, 分润入账
```

### 3.2 异常-未启动成功
```
... -> 订单=STARTING
(30s 无 09) -> 订单=REFUNDING -> 原路退款 -> 订单=CLOSED
```

### 3.3 异常-结算未到
```
订单=IN_USE (超出最长使用阈值)
API: 结束会话/写兜底单 -> 订单=SETTLING(超时) -> 人工处理
```

## 4. 超时与补偿策略
- 定时任务扫描：`STARTING` 30s、`PAY_PENDING` 15min、`SETTLING` 60s；
- 重试：指令下发 30s 超时，最多 2 次；
- 幂等：以 `order_no` 为唯一键；
- 账务：退款必须写入 `balance_ledger` 原子流水。

