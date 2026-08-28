# B06 J6A 重点 Topic 完整链路与实车测试设计

## 1. 审计范围

对象：`ASTRA-B06-W3`、`HDC_A`、`J6A` 的 normal/debug 与 production
两套候选部署。

本报告同时检查了仓库中的 `j6a_target` 和 `j6a_target_production`，但
“当前 active”不能只由目录名决定。B06 启动脚本读取设备实际
`/adapter/vehicle_param/config/build_param.json`：当
`ro.sw.debug_type == release` 时选择 production target，否则选择普通
`j6a_target`。当前 checkout 中的适配器示例值为 `debug`，因此不能把
`j6a_target_production` 自动当成当前实车已经运行的 target；最终以设备
上的 `systemctl` 状态、实际 `/app/service` 文件和 `ros2 topic info -v`
为准。

证据：

- [`basic_configuration.sh`](/home/mingfei.zheng/app/construction/scripts/saturnv/package_scripts/systemd_b06_w3/basic_configuration.sh:614-642)
- [`build_param.json`](/home/mingfei.zheng/app/src/adapter/vehicle_param_adapter/ASTRA-B06-W3/config/build_param.json:1-8)

本文件只评审以下 9 个 topic，并严格保持用户给出的顺序：

1. `/functions/hmi/driving_status`
2. `/functions/hmi/driving_tips`
3. `/functions/hmi/parking_custom`
4. `/functions/hmi/vehicle_status`
5. `/functions/parking_pnc/arrive_fix_slot`
6. `/functions/parking_pnc/map_control_cmd`
7. `/perception/calib/calib_onl_result_info`
8. `/software/faultmgr/upload_hmi`
9. `/software/faultmgr/upload_hviz_type`

### 判定说明

- **trigger event 身份**：只有 `/software/trigger/trigger_event` 本身才是
  trigger event；下面 9 个 topic 都不能因为出现在采集配置中就被称为
  trigger event。
- **直接触发关系**：只有源码明确出现从该 topic 到
  `/software/trigger/trigger_event` 的调用或业务因果链，才能判定存在直接
  触发关系；仅被同一 recorder 采集不算。若没有找到，应写“未确认直接
  触发关系”。在线标定结果 topic 与标定 trigger event 在同一个结束处理
  函数内按顺序相邻输出，也不等于结果 topic 订阅后触发了 event。
- **源码发布能力**：找到 publisher 只证明代码具备发布能力；还要结合
  active target、service、运行配置和设备状态判断当前实车是否可观测。
- **可观测帧**：描述 active service 运行时是否可能收到消息，包括默认帧、
  空内容周期帧和条件帧；它不等于有效业务已经发生。
- **有效业务输出**：要求消息字段、业务前置条件和真实下游含义能够闭合，
  不能仅凭配置声明或 topic 名称判定。
- “怎样触发”描述业务或算法真正满足的条件，不把 recorder/trigger 配置
  当成业务触发链。
- topic 出现在 trigger/record 清单中，只说明它被配置为录包候选或采集
  范围；不证明运行时存在 publisher、一定有帧、一定有有效业务，也不证明
  它是 trigger event 的条件或必要输入。是否值得保留仍以 active publisher、
  真实上下游和具体事件的取证价值为准。
- 本文所说“证据采集建议”是指把该 topic 作为
  `/software/trigger/trigger_event` 发生前后的证据纳入录包，不表示该
  topic 是 trigger event 的必要输入，也不表示该 topic 会触发
  `/software/trigger/trigger_event`。
- 以下测试均假设在封闭测试场地、由测试负责人批准，并优先使用正常 HMI
  操作或软件注入；不建议通过拔线、断电或制造不可恢复故障来触发。

## 2. 总览结论

| 顺序 | Topic | 源码 publisher 能力 | 行车可观测帧 | 行车有效业务 | 泊车可观测帧 | 泊车有效业务 | 与 `trigger_event` 直接关系 | 证据采集建议 |
| :--: | :-- | :--: | :-- | :-- | :-- | :-- | :-- | :-- |
| 1 | `/functions/hmi/driving_status` | 是 | 条件性；需新鲜 `/functions/pnc/to_hmi` | 条件性 | 条件性；需新鲜 `/functions/pnc/to_hmi` | 条件性 | 未确认该 topic 直接触发 event | HMI/PNC 状态类事件通用候选，按事件保留 |
| 2 | `/functions/hmi/driving_tips` | 是 | 条件性；HDE active 时周期帧可为空 `tips` | 条件性 | 条件性；HDE active 时周期帧可为空 `tips` | 条件性 | 未确认该 topic 直接触发 event | HMI/接管/故障/泊车提示事件候选 |
| 3 | `/functions/hmi/parking_custom` | 是 | 条件性；HDE active 时可见 `slot_id == 0` 初始化默认帧 | 否；无有效自定义车位业务 | 条件性 | 条件性；需 custom/page active 且车位数据合法 | 未确认该 topic 直接触发 event | 仅自定义泊车、拖动、退出或融合异常事件 |
| 4 | `/functions/hmi/vehicle_status` | 是 | 条件性；需新鲜底盘输入 | 条件性 | 条件性；需新鲜底盘输入 | 条件性 | 未确认该 topic 直接触发 event | 涉及车辆状态的 HMI/PNC 事件候选 |
| 5 | `/functions/parking_pnc/arrive_fix_slot` | 是 | 否；无正常行车业务帧 | 否 | 条件性；HPA 场景且正剩余距离时可能有帧 | 条件性；正距离帧不等于匹配/到达成功 | 未确认该 topic 直接触发 event | 仅 HPA 固定目标/距离/到达匹配事件 |
| 6 | `/functions/parking_pnc/map_control_cmd` | 是 | 否 | 否 | 条件性；状态机事件时发离散命令 | 条件性；已建立 BUT 会话才有完整业务含义 | 未确认该 topic 直接触发 event | 仅 BUT START/ABORT/COMPLETE 时序事件 |
| 7 | `/perception/calib/calib_onl_result_info` | 条件性 | 条件性；非正式分支、pilot、输入有效且有新完成结果 | 条件性 | 通常无；非 pilot 时不应作为正常标定场景验收 | 否；不作为正常泊车标定业务 | 与标定 trigger event 同一处理函数内按顺序相邻输出，不是 topic-to-topic 触发 | 仅在线标定结果事件，且依赖 publisher active |
| 8 | `/software/faultmgr/upload_hmi` | 条件性 | 条件性；FaultMgr active、ready 且故障有有效 `hmi_id` | 条件性 HMI 故障业务 | 默认无；脚本停服时无 publisher，重启后才可能有帧 | 条件性；依赖 FaultMgr 重启和故障映射 | 未确认该 topic 直接触发 event | 仅故障发生/恢复及 HMI 影响事件 |
| 9 | `/software/faultmgr/upload_hviz_type` | 条件性 | 条件性；类型/DTC 映射或 DTC 状态变化满足条件 | 条件性 | 默认无；脚本停服时无 publisher，重启后才可能有帧 | 条件性；依赖 FaultMgr 重启、映射和状态变化 | 未确认该 topic 直接触发 event | 仅 FaultMgr 类型/DTC 事件，依赖映射和服务状态 |

当前配置将这 9 个 topic 列入多个 event profile 或 `general` list 的
录包范围，例如：

- `src/tros_record_backend/record_backend/config/saturnv_recorder_config_trigger_j6a_b06.json:26-125`
- `src/software_trigger_engine/src/trigger_forward/config/default_trigger_config_b06.json:135-203,275-320`

但这只是采集配置证据，不代表 9 个 topic 属于同一个 trigger event，
也不代表每次 event 都会采到有效业务帧。下面各节给出独立的 publisher、
输入、消费和实车触发证据。对于在线标定和 FaultMgr，表中的“行车/泊车
实车”还受正式版本、模式切换脚本和设备实际配置影响，必须现场用 service
状态和 `ros2 topic info -v` 复核。

## 3. `/functions/hmi/driving_status`

### 3.1 Topic 身份和 active 边界

以下以 `j6a_target_production` 候选链路说明；实际 active target 仍由
`ro.sw.debug_type` 选择：

```text
j6a_target_production/saturnv.target
  -> HmiFG_normal.target
  -> hmi_data_engine.service
  -> /app/saturnv_hmi/init_hde_gwm.sh
  -> HDENode
  -> PncMsgEntry
```

`hmi_data_engine_parking.service` 虽然存在于仓库，但没有被当前
`HmiFG_normal.target` 绑定，不能作为 B06 active 依据。泊车 HMI 代码是由
共用的 `hmi_data_engine.service` 在 `HDENode::Initialize()` 中启动的。

主要证据：

- [`saturnv.target`](/home/mingfei.zheng/app/construction/service_b06_w3/car/target/j6a_target_production/saturnv.target:3-10)
- [`HmiFG_normal.target`](/home/mingfei.zheng/app/construction/service_b06_w3/car/target/j6a_target_production/HmiFG_normal.target:1-6)
- [`hmi_data_engine.service`](/home/mingfei.zheng/app/construction/service_b06_w3/car/service_file/util/hmi_data_engine.service:1-25)
- [`main.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/main.cpp:70-80,192-197)

### 3.2 完整发布链路

直接触发源是 `/functions/pnc/to_hmi`，而不是
`/functions/pnc/to_hmi_state`：

```text
/functions/pnc/to_hmi
  -> OnlineTopicSubjects::pnc2hmi_subscription_
  -> Pnc2HmiSubject::NotifyObservers()
  -> PncMsgEntry::TopicCallBack(Pnc2Hmi)
  -> pnc_msg_.Set(msg)
  -> 20 ms TimerCallback()
  -> SafeROSContextCallback()
  -> ProcessPnc2Hmi()
  -> HandleDrivingStatus()
  -> PubDrivingStatus()
     ├─> SomeipGatewayNode::PubDrivingStatus()
     └─> driving_status_publisher_->publish()
             -> /functions/hmi/driving_status
```

publisher 创建和 ROS/SomeIP 并行输出：

- [`pnc_msg_entry.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/topic/pnc_msg_entry.cpp:80-102,158-196,677-683,735-784)
- [`pnc_msg_entry.h`](/home/mingfei.zheng/app/src/hmi/src/hde/include/topic/pnc_msg_entry.h:189-197)

因此 SomeIP 上行不是 ROS topic 的上游；两者是同一个
`PubDrivingStatus()` 调用中的两个输出分支。

### 3.3 上游输入和实际作用

| 上游输入 | 是否直接决定本 topic 是否产生新帧 | 对消息的作用 |
| :-- | :--: | :-- |
| `/functions/pnc/to_hmi` | 是 | `ProcessPnc2Hmi()` 的直接触发输入 |
| `/functions/pnc/to_hmi_state` | 否 | 更新 `pnc_state_msg_`，影响功能状态、泊车状态和失败原因 |
| `/sensor/chassis/vehicle_status` | 否 | 更新车辆状态缓存，并单独触发 `vehicle_status` 输出；也影响 `vehicle_state` 等字段 |
| `/functions/perception/static_env` | 否 | 仅在 `is_vpa_enable_` 或室内停车日志开关等条件下影响部分环境字段 |
| `/sensor/ins_raw_gnss` | 否 | 主要在场景识别路径中辅助地下停车场判断 |
| `/debug/perception/map_engine_debug` | 否 | 仅在 NOA active 且非泊车等条件下参与 FRC 字段计算 |

订阅注册证据：

- [`online_topic_subjects.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/stream/online_topic_subjects.cpp:99-115,196-227,278-301)
- [`main.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/main.cpp:114-125,147-162)

没有新的 `/functions/pnc/to_hmi` 时，不能把本 topic 视为独立无条件
心跳；即使 `/functions/pnc/to_hmi_state` 发生变化，也不保证立即出现一帧新的
`driving_status`。

### 3.4 消息字段和严格触发条件

`HandleDrivingStatus()` / `PackHmiDrivingStatus()` 会生成：

- `function_state`
- `function_parking_state`
- `target_slot_id`
- `vehicle_state`
- `function_status`
- `road_speed_limit`
- `set_speed_limit`
- `pass_light`
- `is_underground`
- `underground_direction`
- `is_parking_mrm`
- `noa_active_failed_reason`

状态映射：

- PNC `OFF/IDLE/ICA_STANDBY/NOA_STANDBY/ICA_ACTIVE/NOA_ACTIVE`
  映射为对应 HMI `function_state`；
- 只有当前已经是 ICA/NOA active，且
  `is_lon_override || is_lat_override` 为真时，才映射为
  `ICA_PAUSE`/`NOA_PAUSE`；
- `target_slot_id` 来自用户选中的车位缓存，进入泊车本身不保证该字段
  立即变化；
- `function_parking_state` 来自 PNC 泊车状态；
- `vehicle_state` 根据泊车状态或 K-turn 状态映射为
  `PARKING`、`KTURN` 或 `DRIVING`。

证据：

- [`pnc_msg_entry.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/topic/pnc_msg_entry.cpp:786-826)
- [`pnc_msg_entry.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/topic/pnc_msg_entry.cpp:828-903)

`NOA_ACTIVE_FAILED` 也不是“有 inhibit reason 就必然出现”，还要求：

```text
function_active_request_ == true
&& 当前状态不是 ICA_ACTIVE/NOA_ACTIVE
&& off_inhibit_reason_vec 中至少一个原因能被 ConvertReason() 映射
```

证据：[`pnc_msg_entry.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/topic/pnc_msg_entry.cpp:698-733)。

### 3.5 实车测试设计

**A. 基线和发布分支**

1. 确认 `hmi_data_engine.service` active，且 HDE 节点已启动。
2. 执行：
   ```bash
   ros2 topic info -v /functions/hmi/driving_status
   ros2 topic type /functions/hmi/driving_status
   ros2 topic hz /functions/hmi/driving_status
   ```
3. 同时观察 `/functions/pnc/to_hmi`，确认本 topic 的输出与新的
   `to_hmi` 输入在时间上对应。
4. 若需要验证外部 HMI，再独立确认 SomeIP gateway 收到同一帧；
   不要把 SomeIP 输出当成 ROS publisher。

**B. 可达状态覆盖**

1. 按实际功能分别覆盖 `OFF`、`IDLE`、ICA/NOA standby、ICA/NOA
   active、退出等可达状态。
2. 不强制要求每辆车都经历
   `OFF -> IDLE -> STANDBY -> ACTIVE -> PAUSE -> OFF` 的固定序列。
3. 对每个状态，记录 `/functions/pnc/to_hmi`、
   `/functions/pnc/to_hmi_state` 和本 topic 的时间戳与字段。

**C. 接管和激活失败**

1. 在功能已处于 ICA/NOA active 时执行经批准的人工接管，验证
   `ICA_PAUSE` 或 `NOA_PAUSE`。
2. 单独设计激活失败用例：先形成有效激活请求，再保持非 active 状态，
   并使至少一个 inhibit reason 可映射。
3. 检查 `noa_active_failed_reason`，恢复或取消请求后检查状态是否清除。

**D. 泊车字段**

1. 进入 APA/HPA，先验证 `function_parking_state` 和
   `vehicle_state`。
2. 用户实际选中车位后再验证 `target_slot_id`，不要把“进入泊车”和
   “目标车位已选中”混为一个触发条件。
3. 同步记录 `apa_state`、`parking_scene`、`arrive_fix_slot` 和
   `/functions/hmi/vehicle_status`。

### 3.6 验收标准

- topic type 为 `hmi_msgs/msg/DrivingStatus`；
- `function_state`、`function_parking_state` 等枚举值合法；
- 新的 `driving_status` 帧能与新的 `/functions/pnc/to_hmi` 输入关联；
- `pipeline_start_ts` 保留并可与上游输入对齐；
- 状态字段按当前 PNC 状态和门控条件变化，不要求不存在的状态强行出现；
- 只检查 topic 是否存在不算完成，必须检查字段值、时间戳和状态时序。

### 3.7 Topic 结论

```text
源码 publisher 能力：是
当前 active publisher：仓库静态无法确认，需结合实际 target、systemctl
                  状态和 ros2 topic info -v 确认
publisher 直接输入/发布门控：/functions/pnc/to_hmi 新消息
默认回传：有正常 PNC HMI 输入时条件性持续回传
行车可观测帧：条件性；行车有效业务：条件性
泊车可观测帧：条件性；泊车有效业务：条件性
与 trigger_event 直接关系：未确认
证据采集建议：HMI/PNC 状态类事件通用候选，按事件保留
```

## 4. `/functions/hmi/driving_tips`

### 4.1 Topic 身份和 active publisher

该 topic 与 `driving_status` 共用 B06 HDE 进程：

```text
j6a_target_production/saturnv.target
  -> HmiFG_normal.target
  -> hmi_data_engine.service
  -> HDENode
  -> PncMsgEntry
  -> DrivingTipComponent
  -> driving_tips_publisher_
  -> /functions/hmi/driving_tips
```

`DrivingTipComponent` 构造时创建 publisher，并启动 33 ms wall timer。
发布时 ROS publisher 与 SomeIP 上行是并行分支：

```text
PublishTips()
  -> SafeROSContextPublishTips()
     -> UpdatePubTip()
     -> PackPubTips()
        ├─> SomeipGatewayNode::PubDrivingTips()
        └─> driving_tips_publisher_->publish()
                -> /functions/hmi/driving_tips
```

证据：

- [`driving_tips.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/topic/driving_tips.cpp:31-56)
- [`driving_tips.hpp`](/home/mingfei.zheng/app/src/hmi/src/hde/include/topic/driving_tips.hpp:953-974)

正常运行且未进入 HDE shutdown 时，消息帧默认约每 33 ms 一次，
即约 30 Hz；这不代表每帧都包含有效提示。

### 4.2 已确认的输入链路

| 输入 | active 链路和作用 | 触发类型 |
| :-- | :-- | :-- |
| `/functions/pnc/to_hmi_state` | `PncMsgEntry -> DrivingTipComponent::ParsePncState()` | 状态类提示 |
| `/functions/pnc/to_hmi` | `PncMsgEntry -> ParsePncMsg()` | 功能、路径、偏航类提示 |
| `/sensor/chassis/vehicle_status` | `UpdateChassisVehicleStatus()` | 速度、档位、门、盖、安全带、驾驶员操作 |
| `/functions/perception/static_env` | `SetStaticEnvMsg()` 缓存；当前 B06 GWM 功能提示主链未确认实际消费 | 配置输入/非 GWM 主线提示 |
| `/functions/perception/obstacle` | `ObstacleList -> HandleObstacleTips() -> PncMsgEntry::UpdateObstacleAssociateTips()` | 等待车辆、礼让行人/车辆、切入减速、FCW |
| `/software/faultmgr/upload_hmi` | `FaultHmiSubject -> SetFaultHmiMsg() -> active_fault_ids_` | 特定故障驱动的提示 |
| raw SD map callback | SomeIP raw SD map callback -> `SetRawSdMapMsg()` | 导航到达、收费站、施工等 |

证据：

- [`online_topic_subjects.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/stream/online_topic_subjects.cpp:99-115,196-235,278-301)
- [`main.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/main.cpp:114-125,144-162,168-174)
- [`obstalce_list.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/topic/obstalce_list.cpp:118-130,453-464,581-638)
- [`online_topic_subjects.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/stream/online_topic_subjects.cpp:180-188,278-301)
- [`pnc_msg_entry.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/topic/pnc_msg_entry.cpp:684-696)

`/functions/hmi/sd_map` 在 `OnlineTopicSubjects` 中有订阅，并且当前
`main.cpp` 明确将 `SDMapInfoObserver` 注册给 `PncMsgEntry`；其回调会
进入 `DrivingTipComponent::SetSdMapMsg()`，在独立线程中处理导航状态和
汇入提示。因此普通 ROS SD map 链路已闭合。raw SD map
(`/functions/hmi/raw/sd_map`) 是另一条 SomeIP/Raw observer 链路，不能
与普通 `sd_map` 混为同一 topic。

需要单独限定 `/functions/perception/static_env`：它确实被订阅并缓存，
但当前 B06 GWM 的 `ParsePncMsg()` 在调用
`GwmDrivingTipsExtension::OnPncMsg()` 后直接返回，普通主线
`HandleFunctionTips()`（其中包含 `HandleLaneTypeAndOnOffRampTips()`）
不会执行。因此不能把 static_env 的存在直接写成当前 GWM 行车提示的
有效触发链；它对非 GWM 主线或其他消费者仍可能有价值。

### 4.3 B06 GWM 实际执行分支

B06 flavor 打开 `enable_driving_tips_to_vio`，所以当前实际调用不是
普通 flavor 的简单主线：

```text
ParsePncState()
  -> GwmDrivingTipsExtension::OnPncState()
     -> OnDrivingStateTips()
  -> HandleParkingTips()

ParsePncMsg()
  -> GwmDrivingTipsExtension::OnPncMsg()
     -> OnFunctionTips()
     -> OnOffRouteStatus()（非泊车且满足条件时）
```

GWM 分支还会根据 whitelist、接管能力、故障缓存和状态边沿决定
是否进入提示缓存；普通主线在 GWM 分支中会早返回，不应拿普通
flavor 的调用路径代替 B06 证据。

证据：

- [`product_flavor.yaml`](/home/mingfei.zheng/app/src/hmi/src/hde/config/gwm/product_flavor.yaml:14-20)
- [`driving_tips.hpp`](/home/mingfei.zheng/app/src/hmi/src/hde/include/topic/driving_tips.hpp:282-350)
- [`driving_tips_gwm.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/topic/driving_tips_gwm.cpp:4015-4100)

提示生成的共同后处理是：

```text
状态/输入处理
  -> UpdateCurTipInfo()
  -> current_unique_tips_ / current_banner_tips_
  -> UpdatePubTip()
  -> PackPubTips()
  -> 33 ms timer publish
```

### 4.4 触发条件

当前工程能够覆盖的提示类别包括：

- NOA/ICA 激活、退出、模式切换；
- 激活失败、接管、脱手/脱眼、MRM；
- 泊车选位、准备条件不满足、执行方向和剩余距离；
- 泊车暂停、恢复、完成和退出；
- 障碍物关联提示；
- 特定 FaultMgr 故障驱动的传感器脏污/遮挡/功能抑制提示；
- 已闭合的 raw SD map 导航提示。

这些都是条件性提示，不是每个动作都必然产生一条新 tip：

- 接管提示要求当前功能 active、接管开关/原因映射和相应 GWM
  条件满足；
- 激活失败要求有效激活请求、当前尚未 active，且 inhibit reason
  能映射成有效 HMI 原因；
- FaultMgr 消息先更新 `active_fault_ids_`，后续还要有 PNC state
  处理和对应故障码映射，才可能进入 tips 缓存；
- 提示可能受 whitelist、优先级、上升沿、持续时间和 RESTORE
  逻辑影响。

典型实现证据：

- [`driving_tips.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/topic/driving_tips.cpp:958-1117,1248-1444,1502-1575,1973-2239,3086-3117)
- [`driving_tips_gwm.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/topic/driving_tips_gwm.cpp:2130-2145,2274-2290,3390-3445)

### 4.5 实车测试设计

**A. 周期基线**

1. 启动 HDE 且确认未处于 shutdown。
2. 执行：
   ```bash
   ros2 topic type /functions/hmi/driving_tips
   ros2 topic hz /functions/hmi/driving_tips
   ```
3. 无提示时记录 30 s，确认仍有周期帧，并检查消息字段合法；
   不要求 `tips` 数组必须非空。

**B. 行车状态提示**

1. 按实际可达路径分别覆盖 standby、active、退出和失败状态。
2. active 状态下执行经批准的接管动作，确认前置状态确实为
   ICA/NOA active。
3. 通过有效激活请求叠加可映射 inhibit reason，验证激活失败提示。
4. 对每个动作记录 `/functions/pnc/to_hmi_state`、
   `/functions/pnc/to_hmi` 和本 topic，确认 tip 是在后续周期帧
   出现，而不是把动作本身当作输出。

**C. 障碍物提示**

1. 在封闭场地准备经批准的车辆、行人或切入场景。
2. 同步记录 `/functions/perception/obstacle`、相关 PNC 轨迹输入、
   `/functions/hmi/driving_tips`。
3. 验证 `OCCUR -> RESTORE`，并确认障碍物 ID 与提示类别对应。

**D. 泊车提示**

1. 覆盖搜索、选位、active、pause、continue、complete/abort。
2. 准备条件类测试一次只改变一个变量：速度、方向盘、安全带、
   车门、机盖或尾门。
3. 联合观察 `driving_status`、`apa_state` 和车辆状态。

**E. FaultMgr 关联提示**

1. 先确认 FaultMgr 故障已进入 `/software/faultmgr/upload_hmi`。
2. 再确认后续 `/functions/pnc/to_hmi_state` 处理和对应故障码映射。
3. 观察本 topic 中 `tips[].tip_id` 的条件性 OCCUR/RESTORE。

### 4.6 消息和验收标准

- topic type 为 `hmi_msgs/msg/DrivingTips`；
- 逐项检查 `tips[].tip_id`、`tips[].tip_status`、
  `tips[].tip_type`、`tips[].tip_location` 和扩展字段；
- HDE 正常运行时接近 30 Hz，但允许调度抖动、shutdown 和进程
  状态影响；
- 只有满足前置条件、状态边沿和映射规则时，才判定对应 OCCUR；
- RESTORE 也必须以恢复条件和历史提示状态为前提，不是所有场景
  的必然输出；
- 无提示时的合法空周期帧与 topic 完全无数据要区分。

### 4.7 Topic 结论

```text
源码 publisher 能力：是
当前 active publisher：仓库静态无法确认，需结合实际 target、systemctl
                  状态和 ros2 topic info -v 确认
默认回传：条件性是；HDE active 且未 shutdown 时约 33 ms 周期回传
提示内容：条件性
行车可观测帧：是（周期帧可为空）；行车有效提示：条件性
泊车可观测帧：是（周期帧可为空）；泊车有效提示：条件性
与 trigger_event 直接关系：未确认
证据采集建议：HMI/接管/故障/泊车提示事件候选，按事件保留
特别说明：B06 实际走 GWM 扩展分支；普通 ROS SD map 已接入
          PncMsgEntry，static_env 仅能确认订阅/缓存，不能直接当作
          当前 GWM 功能提示的有效触发输入；raw SD map 另行处理。
```

## 5. `/functions/hmi/parking_custom`

### 5.1 Topic 身份和两段 active 链路

以下以 `j6a_target_production` 候选链路说明；实际 active target 仍由
`ro.sw.debug_type` 选择：

```text
j6a_target_production/saturnv.target
  -> HmiFG_normal.target
  -> hmi_data_engine.service
  -> HDENode::Initialize()
  -> parking_hmi::Engine::startParking()
  -> ParkingInputState::init()
  -> ParkingHmiCommu publisher
  -> /functions/hmi/parking_custom
```

仓库中的 `hmi_data_engine_parking.service` 没有被当前
`HmiFG_normal.target` 绑定，不能作为 active 依据。

必须把下游消费单独看待，topic 发布并不是 HDE 直接调用 freespace：

```text
parking_perc_freespace.service
  -> FreespaceFusion subscriber(CUSTOM_PARKING)
  -> input_msg->custom_parking
  -> SelfSelectParkingSlot
  -> GridMapFusion::SetSelfSelectParkingSlot()
```

HDE publisher 证据：

- [`saturnv.target`](/home/mingfei.zheng/app/construction/service_b06_w3/car/target/j6a_target_production/saturnv.target:3-10)
- [`HmiFG_normal.target`](/home/mingfei.zheng/app/construction/service_b06_w3/car/target/j6a_target_production/HmiFG_normal.target:1-6)
- [`main.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/main.cpp:192-197)
- [`parking_state_input.cc`](/home/mingfei.zheng/app/src/hmi/src/hde/src/parking/parking_state/parking_state_input.cc:31-50)
- [`parking_hmi_com.cc`](/home/mingfei.zheng/app/src/hmi/src/hde/src/parking/parking_hmi_com.cc:263-284)

下游消费证据：

- [`PercFG_normal.target`](/home/mingfei.zheng/app/construction/service_b06_w3/car/target/j6a_target_production/PercFG_normal.target:9-13)
- [`parking_perc_freespace.service`](/home/mingfei.zheng/app/construction/service_b06_w3/car/service_file/perc/parking_perc_freespace.service:12)
- [`start_freespace.sh`](/home/mingfei.zheng/app/src/perception_parking/script/start_freespace.sh:36-41)
- [`node_list.json`](/home/mingfei.zheng/app/src/perception_parking/config/freespace/node_list.json:4-15)
- [`freespace_node.json`](/home/mingfei.zheng/app/src/perception_parking/config/freespace/freespace_node/freespace_node.json:48-97)
- [`task_freespace_fusion.cpp`](/home/mingfei.zheng/app/src/perception_parking/freespace/task_freespace_fusion.cpp:25-53,275-286,450-467)

### 5.2 输入、状态和字段

HMI 用户输入：

```text
/functions/hmi/pub_control_to_hde
  -> ParkingHmiCommu subscription
  -> ParkingInputState
  -> StateApaProcessor::sendApaCtrlMsg()
```

输入字段包括：

- `function_ctrl`
- `slotid`
- `corner_points[]`
- `out_direction`
- `in_direction`

自定义模式状态来自：

```text
/functions/parking_pnc/apa_state
  -> StateApaProcessor::onReceiveApaStateMachine()
  -> custom_parking_mode_status_
```

证据：

- [`parking_hmi_com.cc`](/home/mingfei.zheng/app/src/hmi/src/hde/src/parking/parking_hmi_com.cc:124-136)
- [`state_apa_processor.cc`](/home/mingfei.zheng/app/src/hmi/src/hde/src/parking/parking_state/state_apa_processor.cc:157-169)

### 5.3 真实发布条件

`ensureCustomInfoSenderStarted()` 启动时会：

1. 构造默认消息：`msg_id = 0`、`slot_id = 0`、4 个默认角点；
2. 立即发布一次默认消息；
3. 启动 50 ms timer。

因此：

```text
slot_id == 0
```

只能解释为初始化或清空状态，不能证明进入了自定义泊车。

周期发送条件为：

```text
custom_parking_mode_status == TRUE
```

或 B06 配置打开页面保持，并且：

```text
KeepCustomInfoDuringPageActive() == true
&& custom parking page active
```

B06 flavor 已配置 `keep_custom_info_during_page_active: true`：

- [`product_flavor.yaml`](/home/mingfei.zheng/app/src/hmi/src/hde/config/gwm/product_flavor.yaml:31-36)
- [`state_apa_processor.cc`](/home/mingfei.zheng/app/src/hmi/src/hde/src/parking/parking_state/state_apa_processor.cc:1213-1242)

用户控制分支：

- `APA_FUNCTION_CTRL_CUSTOM`：向 PNC 发送自定义泊车事件，并尝试更新
  自定义车位缓存；
- `APA_FUNCTION_CTRL_CUSTOM_DRAG`：尝试更新车位 ID 和角点；
- `APA_FUNCTION_CTRL_EXIT_FREESLOT`：重置缓存并发送默认/清空消息。

代码：[`state_apa_processor.cc`](/home/mingfei.zheng/app/src/hmi/src/hde/src/parking/parking_state/state_apa_processor.cc:914-960,1004-1012,1020-1030,1244-1287)。

### 5.4 下游消费门控

FreespaceFusion 只有在以下条件满足时，才会把收到的消息放入输入：

```text
运行时收到有效 custom_parking 消息
&& 当前融合周期未 reset
```

随后还要满足：

```text
enable_parking_fusion_ == true
&& input_msg->custom_parking != nullptr
```

才调用 `GridMapFusion::SetSelfSelectParkingSlot()`。所以“存在
subscriber”不等于“每一帧都影响车位融合”。

消息字段转换为 `SelfSelectParkingSlot` 后，四个角点会参与形状、方向、
车位类型和坐标转换检查；角点数量不为 4 或几何不合法时会被拒绝：

- [`self_select_msg.h`](/home/mingfei.zheng/app/src/perception_parking/freespace/freespace_msgs/data_structure/self_select_msg.h:15-65)
- [`gridmap_bridge.cpp`](/home/mingfei.zheng/app/src/perception_parking/freespace/gridmap_fusion/gridmap_bridge.cpp:1791-1821)

### 5.5 已知实现边界

当前缓存更新函数先比较 `slot_id`：

```cpp
if (custom_info_cache_.slot_id == apa_ctrl_msg.slotid) {
  return false;
}
```

所以同一个 `slot_id` 只修改 `corner_points` 时，当前实现可能不更新
缓存，也不会立即发布。这个场景应作为回归问题验证，不能把“拖动后
必然立即发布”写成现状验收标准。

### 5.6 实车测试设计

**A. 普通 APA 对照组**

1. HDE 启动后先记录是否出现 `slot_id == 0` 的初始化帧。
2. 执行普通 APA，不进入自定义泊车。
3. 对比 `apa_state.custom_parking_mode_status` 和本 topic。
4. 结论应拆成两层：行车或普通 APA 期间可以观测到初始化默认帧，
   但不应据此判定自定义泊车已触发，也不应期待有效自定义车位持续
   数据。

**B. 自定义车位正常组**

1. 进入自选/自定义泊车页面。
2. 通过 HMI 选择车位并发送 `CUSTOM` 控制。
3. 确认 `custom_parking_mode_status == TRUE`，并记录 page active 状态。
4. 观察本 topic 的 50 ms 周期消息，检查 `slot_id > 0` 和四个角点。
5. 同步观察 `/functions/perception/parking_slot_info`，确认自定义
   车位数据能进入 freespace 的车位处理链。

**C. 拖动回归组**

1. 先发送一个 `slot_id`，记录角点和输出。
2. 保持 `slot_id` 不变，只改变角点，记录是否更新。
3. 再同时改变 `slot_id` 和角点，确认缓存更新和周期发送。
4. 将“源码预期可能丢更新”的结果单独记录为实现边界，不以此否定
   publisher 链路。

**D. 退出和页面保持组**

1. custom mode 下退出自选车位，检查默认/清空消息。
2. PNC 状态切 FALSE 但 page active 仍为真时，观察是否按 50 ms 继续
   发送缓存。
3. page inactive 且 custom status 为 false 后，确认周期发送停止。
4. 所有观察必须同时记录 `custom_parking_mode_status`、page active、
   topic `slot_id` 和角点。

### 5.7 验收标准

- topic type 为 `foxglove_msgs/msg/HmiUserCustomInfo`；
- `slot_id == 0` 只按初始化/清空帧处理；
- `slot_id > 0` 时角点数量和几何合法；
- custom mode 下消息可被 active FreespaceFusion 接收，并在满足
  `enable_parking_fusion_` 时进入 `GridMapFusion`；
- 退出清空、页面保持和停止发送行为与状态条件一致；
- 同 slot 角点拖动必须单独验收，不要求源码当前一定能正确更新。

### 5.8 Topic 结论

```text
源码 publisher 能力：是
当前 active publisher：仓库静态无法确认，需结合实际 target、systemctl
                  状态和 ros2 topic info -v 确认
源码消费链路：存在（parking_perc_freespace）；当前设备 active subscriber 待现场确认
默认回传：启动默认帧；有效数据仅在 custom/page-active 条件下周期发送
行车可观测帧：条件性默认帧；行车有效业务：否
泊车可观测帧：条件性；泊车有效业务：条件性
与 trigger_event 直接关系：未确认
证据采集建议：仅自定义泊车、拖动、退出或融合异常事件
```

## 6. `/functions/hmi/vehicle_status`

### 6.1 Topic 身份和 active 边界

以下以 `j6a_target_production` 候选链路说明；实际 active target 仍由
`ro.sw.debug_type` 选择：

```text
j6a_target_production/saturnv.target
  -> HmiFG_normal.target
  -> hmi_data_engine.service
  -> /app/saturnv_hmi/init_hde_gwm.sh
  -> HDENode
  -> PncMsgEntry
```

HDE GWM flavor 打开车辆状态订阅：

```yaml
enable_vehicle_status_subscriber: true
```

证据：

- [`saturnv.target`](/home/mingfei.zheng/app/construction/service_b06_w3/car/target/j6a_target_production/saturnv.target:3-10)
- [`HmiFG_normal.target`](/home/mingfei.zheng/app/construction/service_b06_w3/car/target/j6a_target_production/HmiFG_normal.target:1-6)
- [`hmi_data_engine.service`](/home/mingfei.zheng/app/construction/service_b06_w3/car/service_file/util/hmi_data_engine.service:1-25)
- [`product_flavor.yaml`](/home/mingfei.zheng/app/src/hmi/src/hde/config/gwm/product_flavor.yaml:14-18)

### 6.2 完整发布链路

```text
/sensor/chassis/vehicle_status
  -> OnlineTopicSubjects::vehicle_status_subscription_
  -> VehicleStatusSubject::NotifyObservers()
  -> PncMsgEntry::TopicCallBack(VehicleStatus)
  -> vehciles_status_.Set(msg)
  -> 20 ms TimerCallback()
  -> SafeROSContextCallback()
  -> ProcessVehicleStatus()
     ├─> ParkingState::OnChassisVehicleStatus()
     ├─> DrivingTipComponent::UpdateChassisVehicleStatus()
     ├─> PackHmiVehicleStatus()
     └─> PubVehicleStatus()
          ├─> SomeipGatewayNode::PubVehicleStatus()
          └─> vehicle_status_publisher_->publish()
                  -> /functions/hmi/vehicle_status
```

证据：

- [`online_topic_subjects.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/stream/online_topic_subjects.cpp:196-210)
- [`pnc_msg_entry.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/topic/pnc_msg_entry.cpp:93-102,158-190,652-675)
- [`pnc_msg_entry.h`](/home/mingfei.zheng/app/src/hmi/src/hde/include/topic/pnc_msg_entry.h:179-187)

### 6.3 发布门控和字段转换

20 ms 是 HDE 的消费/处理调度周期，不是无条件发布周期。只有
`vehciles_status_.Pop()` 取到新鲜输入时才执行
`ProcessVehicleStatus()` 并发布：

```text
输出上限：约 50 Hz
实际频率：受底盘输入频率、队列和调度影响
无新底盘输入：不应产生新的 vehicle_status 帧
```

`PackHmiVehicleStatus()` 并非所有字段原样透传：

| 字段 | 实际规则 |
| :-- | :-- |
| `current_speed` | 经过取整和当前速度保持逻辑 |
| `yaw` | 来自 HDE 的 `FeatureVarib::SelfCarYaw()` |
| `gear_position` | 由底盘档位枚举转换 |
| `wheel_speed` | 倒车档时按当前代码做符号转换 |
| `soc_level`、雾灯、方向盘触发字段 | 依赖上游 `reserved` 数组长度和内容 |
| 四门状态 | 只有 door 数组长度大于 3 时才完整映射 |
| 时间头 | `pipeline_*` 保留上游值，module 时间由 HDE 重新生成 |

字段构造证据：

- [`pnc_msg_entry.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/topic/pnc_msg_entry.cpp:925-967)
- [`pnc_msg_entry.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/topic/pnc_msg_entry.cpp:969-1024)
- [`pnc_msg_entry.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/topic/pnc_msg_entry.cpp:1026-1062)

本 topic 是 HMI 格式的车辆状态输出；PNC 的直接底盘输入仍是
`/sensor/chassis/vehicle_status`。本 topic 的取证价值是把车辆速度、
档位、制动、方向盘、车门和灯光等状态与 HMI/PNC 状态按统一链路
时间对齐。

### 6.4 实车测试设计

**A. 静止档位组**

1. 车辆完全静止并满足安全条件时记录 P、D、R、N 各档状态。
2. 每次换挡单独操作，确认上游档位变化后再检查本 topic。
3. 不在车辆有明显运动时执行 D/R 互换。

**B. 运动字段组**

1. 封闭场地低速前进，只观察速度、加速度、方向盘和前进轮速。
2. 单独进行低速倒车，只观察 R 档和 `wheel_speed` 符号。
3. 不把换挡、开门、灯光和人工转向同时混在一个用例中。

**C. 车身输入组**

在车辆静止状态分别改变：

- 制动踏板；
- 安全带；
- 四门；
- 机盖、尾门；
- 左右灯、远近光和雾灯。

检查上游原始字段、HDE 转换字段和时间头。

**D. 泊车关联组**

1. 普通 APA/HPA 执行时继续录制本 topic。
2. 联合观察 `apa_state`、`parking_scene`、
   `arrive_fix_slot`、`driving_status` 和规划/控制输出。
3. 将车辆实际运动、档位和制动作为泊车状态切换的旁证。

**E. 输入中断验证**

输入中断应优先在台架、回灌或经批准的故障注入环境验证；实车上
不要人为关闭安全关键底盘链路。验证目标是确认没有新鲜上游消息时，
本 topic 不会被误判成仍在正常刷新。

### 6.5 验收标准

- topic type 为 `hmi_msgs/msg/VehicleStatus`；
- 有新鲜 `/sensor/chassis/vehicle_status` 时输出可连续产生；
- 档位按枚举规则映射；
- 速度允许取整/保持逻辑，不要求与上游浮点值逐字相等；
- 倒车轮速符号符合 `PackHmiVehicleStatus()` 逻辑；
- `reserved` 或 door 数组不足时，按代码默认/缺省行为验收；
- `pipeline_start_ts` 与上游可关联，module 时间是 HDE 新生成值；
- 只有当事件诊断目标涉及速度、档位、制动、车门等车辆状态时，才建议
  将该 topic 纳入该事件的证据采集；它不是所有 trigger event 的基础必需
  topic。

### 6.6 Topic 结论

```text
源码 publisher 能力：是
当前 active publisher：仓库静态无法确认，需结合实际 target、systemctl
                  状态和 ros2 topic info -v 确认
publisher 直接输入/发布门控：新鲜 /sensor/chassis/vehicle_status
默认回传：有上游底盘输入时条件性持续回传，最大约 50 Hz
行车可观测帧：条件性；行车有效业务：条件性
泊车可观测帧：条件性；泊车有效业务：条件性
与 trigger_event 直接关系：未确认
证据采集建议：涉及速度、档位、制动、车门等车辆状态的事件候选
```

## 7. `/functions/parking_pnc/arrive_fix_slot`

### 7.1 Topic 身份和 active 边界

这是 `parking_pnc` 中由 `SceneEngineNode` 发布、由
`ParkingStateMachineNode` 消费的 HPA 固定目标车位信息。它不是普通 APA
搜索车位结果，也不是由 trigger event 反向触发的 topic。

以下以 `j6a_target_production` 候选链路说明；实际 active target 仍由
`ro.sw.debug_type` 选择：

```text
PncFG_normal.target
  -> parking_pnc_init.service
  -> SceneEngineNode
  -> ParkingStateMachineNode
```

主要证据：

- [`PncFG_normal.target`](/home/mingfei.zheng/app/construction/service_b06_w3/car/target/j6a_target_production/PncFG_normal.target:2-8)
- [`parking_pnc_init.service`](/home/mingfei.zheng/app/construction/service_b06_w3/car/service_file/pnc/parking_pnc_init.service:5-12)
- [`node_list.yaml`](/home/mingfei.zheng/app/src/parking_pnc/config/node_list.yaml:41-58)
- [`SceneEngineNode.yaml`](/home/mingfei.zheng/app/src/parking_pnc/config/nodes/SceneEngineNode.yaml:1-14)

### 7.2 完整发布和消费链路

```text
/sensor/chassis/vehicle_status
/functions/perception/odometry
/functions/parking_pnc/parkable_slot
/functions/pnc_hpa/ssm_to_state
  -> TaskSceneEngine 条件表达式检查
  -> SceneEngine::Run()（按参数顺序处理）
     ├─> vehicle_status / odometry：当前实现只经过空处理函数
     ├─> ParkingFusion：执行 SceneJudge::JudgeArriveFixSlot()
     │    （使用此刻已有的 HPA 固定目标/距离缓存）
     └─> LocalRoad2State：更新本轮 HPA 固定车位、距离、到达标志
  -> TaskSceneEngine::PublishScene()
  -> PublishArriveFixSlot()
  -> /functions/parking_pnc/arrive_fix_slot
  -> ParkingStateMachineNode::MessageProcess(ArriveFixSlot)
  -> HPA/APA 状态机事件或 HPA 结束请求
```

SceneEngine 订阅、publisher 创建和条件表达式声明见：

- [`task_scene_engine.cpp`](/home/mingfei.zheng/app/src/parking_pnc/src/nodes/scene_engine/task_scene_engine.cpp:23-77)
- [`ParkingStateMachineNode.yaml`](/home/mingfei.zheng/app/src/parking_pnc/config/nodes/ParkingStateMachineNode.yaml:6-9)
- [`expression.h`](/home/mingfei.zheng/app/src/astra_common/base/expr/expression.h:168-197,261-267)
- [`conditional_task.h`](/home/mingfei.zheng/app/src/astra_common/base/task/conditional_task.h:617-721)

下游处理见：

- [`message_process.cpp`](/home/mingfei.zheng/app/src/parking_pnc/src/ad-common/src/parking_state_machine/message_process.cpp:2005-2064)

### 7.3 “判断成功”和“实际发布”是两套条件

**A. 固定目标和近距离判断**

`LocalRoad2State` 只有在以下条件下才为 SceneEngine 建立有效固定目标：

1. `hpa_status.is_hpa_mode == true`；
2. `target_parking_slot.border_virtual.points.size() == 4`；
3. 从 HPA 状态复制 `arrived_at_target_slot`、`distance_to_end`、
   `direction` 和 `offset_direction`。

不满足 HPA 或边界点数量不为 4 时，代码清空固定目标，并把
`remaining_distance` 置为 `0`，这会导致后续发布门控失败。

证据：[`scene_engine.cpp`](/home/mingfei.zheng/app/src/parking_pnc/src/ad-common/src/scene_engine/scene_engine.cpp:46-83)。

进入 `SceneJudge::JudgeArriveFixSlot()` 后，只有固定目标存在且
`remaining_distance <= 20.0 m` 才会进行匹配；感知车位与固定目标的重叠率
必须严格大于 `0.6` 才算候选匹配。匹配到认证车位时输出 `SLOT_TYPE_FIXED`；
未匹配到认证车位但认证列表非空时回退为第一个认证车位并输出
`SLOT_TYPE_RECOMMAND`；两者都没有时输出未知车位和 `id == -1`。

这里的 `remaining_distance` 不是自车到车位几何中心的距离。它来自
`hpa_status.distance_to_end`，通常是到 HPA 路线终点/目标停止线的
`s` 距离；没有有效参考线时还可能保留默认值。`arrived_at_target_slot`
则由 HPA 目标停止线距离和车辆速度阈值共同计算，具体阈值由 HPA 配置
决定（源码默认值为距离 6 m、速度 0.5 m/s），不能把本 topic 的
20 m 匹配阈值当成最终到达阈值。

证据：[`scene_judge.cpp`](/home/mingfei.zheng/app/src/parking_pnc/src/ad-common/src/scene_engine/scene_judge.cpp:26-96)。
距离字段和到达计算见：

- [`local_road.h`](/home/mingfei.zheng/app/src/pnc_hpa/src/ssm/structure/local_road.h:678-687)
- [`hpa_local_road_generate.cc`](/home/mingfei.zheng/app/src/pnc_hpa/src/ssm/road_generate/local_hpa/hpa_local_road_generate.cc:953-1000)

**B. 实际 publisher 门控**

`JudgeArriveFixSlot()` 的返回值只决定是否向 `scene_types` 加入
`PARKING_SCENE_ARRIVE_FIXSLOT`。但是普通的车位进出场景也会使
`scene_types` 非空，因此 `PublishScene()` 会调用
`PublishArriveFixSlot()`，而不是只在“固定车位匹配成功”时调用。

`TaskSceneEngine::Init()` 使用的是 `Expression::ReqAll(topic)` 的默认参数
`min_count = 0`。因此这段条件表达式的含义不是“四路队列都至少有一条
新消息”，而是主题名存在即可满足表达式；只有非空队列才会被放入
`valid_req_counts_`。异步执行路径随后把已记录的消息转移到执行队列，
缺失主题在 `Execute()` 中会变成空指针。

所以需要区分两种条件：

**代码实际进入 Execute 的条件**

```text
TaskSceneEngine 条件表达式通过
&& scene_types 非空
&& arrive_fix_slot 指针有效
&& arrive_fix_slot.remaining_distance > 0
```

**测试中可接受的“完整有效链路”条件**

```text
四个输入均在同一测试窗口内有可关联、足够新鲜的消息
&& 能解释本次 SceneEngine 输出字段
```

后者是测试取证要求，不是当前 `ReqAll` 实现真正保证的运行时门槛。

源码没有在这里再次检查“距离 <= 20 m”“重叠率 > 0.6”或
`arrived_at_target_slot == true`。因此当前实现下，HPA 固定目标有效且
`remaining_distance` 仍大于 0 时，即使距离大于 20 m、没有匹配车位，
也可能发布一帧。`remaining_distance <= 0` 时则明确跳过发布。

证据：[`scene_engine.cpp`](/home/mingfei.zheng/app/src/parking_pnc/src/ad-common/src/scene_engine/scene_engine.cpp:85-101)
和 [`task_scene_engine.cpp`](/home/mingfei.zheng/app/src/parking_pnc/src/nodes/scene_engine/task_scene_engine.cpp:107-152)。

由于 `SceneEngine::Run()` 先处理 `ParkingFusion`、后处理
`LocalRoad2State`，匹配判断可能使用上一轮缓存的 HPA 距离/目标，而发布
时读取本轮刚更新的 `remaining_distance` 和
`arrived_at_target_slot`。再加上距离大于 20 m 时
`JudgeArriveFixSlot()` 直接返回、不清除 `id`、`target_id`、
`slot_type`、`match_ratio`，发布帧可能出现跨帧字段组合或沿用旧匹配字段。
这属于当前实现风险，测试必须按时间戳逐字段对齐，不能只看一条帧。

因此该 topic 的“存在一帧”不能直接解释为“已经到达固定车位”。
反过来，最终到达帧也可能因为 `remaining_distance <= 0` 被 publisher
跳过。这是当前生产代码的发布门控语义，应在实车报告中单独标记，不能归因
于 recorder 丢包。

### 7.4 下游状态机触发条件

`MessageProcess::ProcessMessage(ArriveFixSlot)` 对收到的每一帧都会更新：

- `kHpaArrivedAtTargetSlot`
- `kHpaRemainingDistance`

只有 `arrived_at_target_slot == true` 时才进入后续到达处理，并有 1 秒防抖：

- `id != -1` 时写入方向/偏移方向；推荐车位还会写入 HPA nearby
  available slot 通知；
- APA 状态机只有在 HPA cruise state 为 `Cruising` 时才投递
  `VpaControlParkingInEvent`；
- HPA cruise 状态机则在实例存在时投递同名事件；
- `id == -1` 时，车辆停止且 HPA 仍为 `Cruising`，会请求 P 挡并结束
  HPA cruise。

证据：[`message_process.cpp`](/home/mingfei.zheng/app/src/parking_pnc/src/ad-common/src/parking_state_machine/message_process.cpp:2005-2064)。

HPA 产生 `arrived_at_target_slot` 还要求目标停止线距离在配置阈值内、车辆
速度低于配置阈值；这不是 `arrive_fix_slot` publisher 自己计算的条件。

证据：[`hpa_local_road_generate.cc`](/home/mingfei.zheng/app/src/pnc_hpa/src/ssm/road_generate/local_hpa/hpa_local_road_generate.cc:984-1000)。

### 7.5 实车触发测试

**主测试必须使用 HPA/记忆泊车，普通 APA 不能替代。**

所有用例同时记录：

- `/functions/pnc_hpa/ssm_to_state`
- `/functions/parking_pnc/parkable_slot`
- `/functions/parking_pnc/arrive_fix_slot`
- `/functions/parking_pnc/parking_scene`
- `/functions/parking_pnc/car_in_slot`
- `/functions/parking_pnc/apa_state`
- `/functions/perception/odometry`
- `/sensor/chassis/vehicle_status`

**用例 A：距离大于 20 m 的发布边界**

1. 建立有效 HPA 目标，保证目标边界点为 4 个。
2. 车辆保持在 HPA 目标停止线前、`remaining_distance > 20 m`。
3. 记录四路输入是否实际到达；不要只根据 `ReqAll` 通过就认定输入齐全。
4. 观察本 topic 是否仍有帧。
5. 若有帧，记录 `id`、`target_id`、`slot_type` 和
   `match_ratio`，验证它们是否沿用了前一帧状态；该用例用于确认当前
   “发布门控不等于匹配成功”的实现边界。

**用例 B：20 m 内认证车位匹配**

1. 进入 HPA 路线/目标停止线 `remaining_distance <= 20 m` 区间。
2. 让 `/functions/parking_pnc/parkable_slot` 提供与固定目标重叠率
   大于 `0.6` 的车位，并将其列在 `certified_slots` 中。
3. 验证 `slot_type == SLOT_TYPE_FIXED`、`id` 为匹配车位、
   `target_id` 为最高重叠率候选、`match_ratio > 0.6`。

**用例 C：非认证、无匹配和回退**

分别覆盖：

- 重叠率不超过 `0.6`、认证列表为空：应发布正距离帧，但车位字段为未知/
  `id == -1`；
- 有候选匹配但候选不在认证列表、认证列表非空：应回退到第一个认证
  车位，类型为 `SLOT_TYPE_RECOMMAND`，匹配率置为 `0`；
- 认证列表为空且没有合格候选：验证不会把旧车位误当成本帧匹配结果。

**用例 D：到达标志和停发边界**

1. 从 `arrived_at_target_slot == false`、正的 HPA 路线剩余距离开始记录。
2. 按 HPA 算法条件低速接近目标，观察标志变为 `true`。
3. 分别验证正的极小剩余距离仍可发布，以及
   `remaining_distance == 0` 或小于 0 时停止发布。
4. 同时检查 `MessageProcess` 是否收到最后一帧、是否投递状态机事件；
   不要因为 topic 在最终帧停发，就认定到达事件一定已被状态机处理。

**用例 E：服务和输入对照**

- HPA 关闭；
- 目标边界点不是 4 个；
- 缺少任一 SceneEngine 输入，验证任务仍可能因 `ReqAll(min_count=0)`
  通过但拿到空指针；
- HPA 服务退出或 `ssm_to_state` 不再更新；
- `parkable_slot` 无车位或感知输入中断。

这些用例用于区分“没有业务输出”“publisher 存在但门控不满足”和
“录包丢失”三种情况。

### 7.6 验收标准

- topic type 为 `pnc_msgs/msg/ArriveFixSlot`；
- 运行时 `ReqAll` 通过不等于四个输入均有消息；完整链路证据必须逐路
  检查输入新鲜度和时间关联；
- `remaining_distance > 0` 的帧不等价于“已匹配/已到达”；
- `remaining_distance` 应按 HPA 路线终点/目标停止线距离解释，不应当作
  车位几何距离；
- `arrived_at_target_slot`、`slot_type`、`id`、`target_id`、
  `match_ratio` 必须与对应 HPA 和 ParkingFusion 输入联合解释；
- 关注 `ParkingFusion` 先于 `LocalRoad2State` 处理造成的跨帧字段错配/
  旧匹配字段沿用；
- `remaining_distance <= 0` 停发是当前代码行为，需在测试结论中明确记录；
- 最终到位和状态机动作必须联合 `parking_scene`、`car_in_slot`、
  `apa_state` 及 HPA 状态判断；
- 行车模式不属于该 topic 的正常业务场景；仅在 HPA 场景下条件性可观测，
  且有效匹配/到达需单独验收。

### 7.7 Topic 结论

```text
源码 publisher 能力：是
当前 active publisher：仓库静态无法确认，需结合实际 target、systemctl
                  状态和 ros2 topic info -v 确认
publisher 直接输入/发布门控：TaskSceneEngine 条件表达式通过、scene_types 非空、
                  结果指针有效，且当前 arrive_fix_slot.remaining_distance > 0；
                  ReqAll 默认不保证四路消息非空
默认回传：HPA 有效目标和正剩余距离下可能持续回传；不是匹配/到达专用心跳
行车可观测帧：通常无正常业务帧；行车有效业务：否
泊车可观测帧：HPA 条件性；泊车有效业务：条件性
与 trigger_event 直接关系：未确认
证据采集建议：仅在需要解释 HPA 固定目标、距离或到达匹配时保留
```

## 8. `/functions/parking_pnc/map_control_cmd`

### 8.1 Topic 身份和 active 边界

该 topic 是泊车状态机向循迹倒车（BUT）/Navinet 下发的离散控制命令。
它不是 Navinet 的周期状态输出，也不是通用的 HPA 地图控制命令。

以下以 `j6a_target_production` 候选链路说明；实际 active target 仍由
`ro.sw.debug_type` 选择：

```text
PncFG_normal.target
  -> parking_pnc_init.service
  -> ParkingStateMachineNode
  -> /functions/parking_pnc/map_control_cmd

PercFG_normal.target
  -> navinet_parking.service
  -> ReverseTrackingComponentNode
  -> /functions/parking_pnc/map_control_cmd
```

配置证据：

- [`PncFG_normal.target`](/home/mingfei.zheng/app/construction/service_b06_w3/car/target/j6a_target_production/PncFG_normal.target:1-6)
- [`PercFG_normal.target`](/home/mingfei.zheng/app/construction/service_b06_w3/car/target/j6a_target_production/PercFG_normal.target:1-16)
- [`parking_pnc_init.service`](/home/mingfei.zheng/app/construction/service_b06_w3/car/service_file/pnc/parking_pnc_init.service:1-23)
- [`navinet_parking.service`](/home/mingfei.zheng/app/construction/service_b06_w3/car/service_file/perc/navinet_parking.service:1-25)

### 8.2 完整发布链路

```text
HMI/PNC 事件或 APA 状态转换
  -> APA state-machine transition/state callback/event recycle
  -> ApaSMTaskProxy::PubMapControlCmdMsg()
  -> 已注册的 TaskParkingStateMachine::PublishMapControlCmd()
  -> /functions/parking_pnc/map_control_cmd
  -> ReverseTrackingComponentNode subscription
  -> ReverseTrackingProcessor::HandleMapControlCmd()
  -> state_machine_cmd_ / BUT session state
  -> 400 ms 周期生成 map_event 和 reverse_tracking
```

publisher 的创建和 callback 注册：

- [`task_parking_state_machine.cpp`](/home/mingfei.zheng/app/src/parking_pnc/src/nodes/state_machine/task_parking_state_machine.cpp:321-339,868-886)
- [`task_parking_state_machine.cpp`](/home/mingfei.zheng/app/src/parking_pnc/src/nodes/state_machine/task_parking_state_machine.cpp:799-802)
- [`apa_sm_task_proxy.cpp`](/home/mingfei.zheng/app/src/parking_pnc/src/ad-common/src/parking_state_machine/apa_task_proxy/apa_sm_task_proxy.cpp:467-484)

下游订阅和回调：

- [`reverse_tracking_component.h`](/home/mingfei.zheng/app/src/navinet_parking/src/nodes/reverse_tracking_component.h:84-86,110-114,126-142)
- [`reverse_tracking_component_node.cpp`](/home/mingfei.zheng/app/src/navinet_parking/src/nodes/reverse_tracking_component_node.cpp:33-40,61-84)

### 8.3 命令来源和实现边界

当前仓库能确认的命令**枚举名**为：

| 枚举名 | 业务来源 | 代码位置 |
| :-- | :-- | :-- |
| `START_BUT` | B06 的 `SearchingButParking -> ButParking` 进入 BUT | [`transition_callback.cpp`](/home/mingfei.zheng/app/src/parking_pnc/src/ad-common/src/parking_state_machine/apa_state_machine/transition_callback.cpp:115-130,379-401)；[`SearchingButParking2ButParking.yaml`](/home/mingfei.zheng/app/src/parking_pnc/config/state_machine/GWM-B06/trans_config_path/SearchingButParking2ButParking.yaml:1-42) |
| `BUT_ABORT` | 公共 `Controling -> Abort` 的中止、以及 BUT 启动失败回收；`ButParkingAbort()` 函数存在但当前 B06 transition map 未确认绑定 | [`transition_callback.cpp`](/home/mingfei.zheng/app/src/parking_pnc/src/ad-common/src/parking_state_machine/apa_state_machine/transition_callback.cpp:74-87,456-464,503-530)；[`event_recycle.cpp`](/home/mingfei.zheng/app/src/parking_pnc/src/ad-common/src/parking_state_machine/apa_state_machine/event_recycle.cpp:243-253) |
| `BUT_COMPLETE` | `ButParking` 退出且匹配事件为 `ParkingCompletedEvent` | [`state_callback.cpp`](/home/mingfei.zheng/app/src/parking_pnc/src/ad-common/src/parking_state_machine/apa_state_machine/state_callback.cpp:682-694) |

消息定义不在当前源码树中，数值常量来自外部/生成依赖；因此本报告不把
`11/12/13` 当作已由当前工程源码完整证明的协议数字，实车验收应优先按
枚举语义或设备实际消息定义确认。

B06 的状态转换表明确包含：

```text
Stanby -> SearchingButParking
SearchingButParking -> ButParking
```

因此 BUT 开始分支在 B06 不是只存在于其他车型的死代码：

- [`transition_callback.cpp`](/home/mingfei.zheng/app/src/parking_pnc/src/ad-common/src/parking_state_machine/apa_state_machine/transition_callback.cpp:115-130)

需要特别标注一个潜在副作用：`Controling -> Abort` 属于公共转换，
`Controling2Abort()` 无条件发送 `BUT_ABORT`，并没有先判断当前
`ParkingType` 是否为 BUT。因此普通 APA/其他控制功能的中止也可能产生一帧
`BUT_ABORT`；但 Navinet 只有此前已经收到 `START_BUT` 时才会建立
BUT abort 宽限期，普通 APA 的这帧不等价于“结束了一个已建立的 BUT 会话”。

### 8.4 下游行为和发布频率

Navinet 收到消息后只缓存最新 `msg->val`，并记录接收时间：

```text
/functions/parking_pnc/map_control_cmd
  -> HandleMapControlCmd()
  -> state_machine_cmd_ = msg->val
  -> START_BUT / BUT_ABORT / BUT_COMPLETE 分支
```

证据：[`reverse_tracking_processor.cc`](/home/mingfei.zheng/app/src/navinet_parking/src/reverse_tracking/reverse_tracking_processor.cc:74-104)。

Navinet 节点是否启动 400 ms 周期线程由
`enable_reverse_tracking` 决定；B06 配置为 `true`：

- [`reverse_tracking_component_node.cpp`](/home/mingfei.zheng/app/src/navinet_parking/src/nodes/reverse_tracking_component_node.cpp:33-46,91-105)
- [`superparking.yaml`](/home/mingfei.zheng/app/src/navinet_parking/config/ASTRA-B06-W3/nodes/superparking.yaml:9-19)

400 ms 是 `/functions/navinet_parking/reverse_tracking` 和
`/functions/navinet_parking/map_event` 的下游周期，不是
`map_control_cmd` 的发布周期。后者只在上游事件/状态回调执行时发布。

下游 `map_event` 还要求：

- 轨迹记录已启用；
- 轨迹距离达到 B06 的 `min_publishable_track_distance`，当前配置为
  `1.0 m`；
- 驾驶模式保护允许；
- `START_BUT` 会话和 `tracking_enable` 条件一致。

证据：[`reverse_tracking_processor.cc`](/home/mingfei.zheng/app/src/navinet_parking/src/reverse_tracking/reverse_tracking_processor.cc:272-318)
和 [`superparking.yaml`](/home/mingfei.zheng/app/src/navinet_parking/config/ASTRA-B06-W3/nodes/superparking.yaml:14-19)。

### 8.5 实车触发测试

所有用例同时记录：

- `/functions/parking_pnc/map_control_cmd`
- `/functions/parking_pnc/apa_state`
- `/functions/hmi/parking`
- `/functions/navinet_parking/map_event`
- `/functions/navinet_parking/reverse_tracking`
- `/functions/perception/odometry`
- `/functions/pnc/to_hmi_state`

**用例 A：BUT 正常开始**

1. 确认 `parking_pnc_init.service` 和 `navinet_parking.service` 均 active，
   且设备加载 B06 `superparking.yaml`。
2. 在封闭场地按正常 HMI 流程进入
   `SearchingButParking`，满足 B06 状态转换配置中的
   `MapLocationState`、APA 决策/控制、零车速和自动驾驶模式条件，
   并准备一段足够长度的有效前向轨迹。
3. 触发进入 `ButParking`，验证本 topic 出现 `START_BUT`。
4. 继续提供有效 odometry，检查下游 `map_event` 在满足轨迹门槛后进入
   `BUT_RUNNING`，并核对 `reverse_tracking.last_control_info`。

**用例 B：BUT 中止**

1. BUT 运行中执行经批准的用户接管/中止动作，验证
   `Controling2Abort()` 对应的 `BUT_ABORT`。
2. 单独覆盖启动条件不满足导致的 `EventRecycle::StartButFailed()`；
   不把未确认绑定的 `ButParkingAbort()` 当作 B06 必经路径。
3. 观察 Navinet 的会话状态、轨迹保护和后续 `map_event`，不要只看命令
   topic 是否出现。

**用例 C：正常完成**

1. 使用有效且足够长的 BUT 轨迹完成循迹倒车。
2. 确认状态机退出事件为 `ParkingCompletedEvent`。
3. 验证只在该事件分支发送 `BUT_COMPLETE`，并对齐
   `map_event`、`reverse_tracking` 和 `apa_state` 的结束时序。

**用例 D：普通 APA 中止副作用**

1. 不进入 BUT，只启动普通 APA 并触发一次
   `Controling -> Abort`。
2. 观察本 topic 是否仍出现 `BUT_ABORT`。
3. 若出现，应在实车取证规则中把它标成公共中止副作用；同时检查
   Navinet 是否因为此前没有 `START_BUT` 而未建立 BUT abort 宽限期，不能
   把它解释为“BUT 已开始后中止”。

**用例 E：下游门控对照**

- 未收到 `START_BUT`；
- 轨迹距离低于 B06 的 `1.0 m` 门槛；
- 驾驶模式不在允许白名单；
- odometry 无效或中断；
- `enable_reverse_tracking: false`；
- `ApaSMTaskProxy::is_exit_` 已置位或 publisher callback 未注册。

这些对照用于区分“命令没有业务来源”“命令已发布但 Navinet 不进入
运行态”和“服务/回调边界未建立”。

### 8.6 验收标准

- topic type 为 `pnc_msgs/msg/MapControlCmd`；
- 消息按 `START_BUT`、`BUT_ABORT`、`BUT_COMPLETE` 的**枚举语义**解释；
- 命令是离散事件，不应要求固定高频或 400 ms 周期；
- 上游状态机事件、命令帧和 Navinet 下游状态必须按时间戳联合验收；
- 普通 APA 未进入 BUT 时，仍需专项确认公共 `Controling2Abort()` 是否
  产生 `BUT_ABORT`；
- 行车无正常业务场景；泊车仅在 BUT 状态机事件下条件性可观测，命令帧
  不等于已建立 BUT 会话。

### 8.7 Topic 结论

```text
源码 publisher 能力：是
当前 active publisher：仓库静态无法确认，需结合实际 target、systemctl
                  状态和 ros2 topic info -v 确认
publisher 直接输入/发布门控：APA 状态机/事件回调执行相应 MapControlCmd 发布分支
默认回传：无固定心跳，仅在离散状态/事件发生时发
行车可观测帧：否；行车有效业务：否
泊车可观测帧：BUT 事件条件性；泊车有效业务：仅已建立 BUT 会话时条件性
与 trigger_event 直接关系：未确认
证据采集建议：仅在 BUT START/ABORT/COMPLETE 时序事件中保留
```

## 9. `/perception/calib/calib_onl_result_info`

### 9.1 Topic 身份、active 边界和下游性质

这是在线相机背景标定的**结果证据 topic**，不是标定算法的输入，也不是
普通行车/泊车状态心跳。B06 J6A 的候选启动边界包括
`j6a_target` 和 `j6a_target_production`；实际选择由
`ro.sw.debug_type` 决定，不能只按目录名把 production 写成当前 active：

```text
saturnv.target
  -> PercFG_normal.target
  -> perc_calib_cam_onl.service
  -> /app/hct_parking/calib/init.sh bg_onl_v
  -> calib_onl
  -> CameraOnlNode
```

标定结果服务由 MachineFG 的 `sw_calib_srv.service` 提供，属于初始化硬前置：

```text
MachineFG_normal.target
  -> sw_calib_srv.service
  -> calibservice
  -> calib_result service
  -> CameraOnlNode calib_result_client_
```

主要证据：

- [`saturnv.target`](/home/mingfei.zheng/app/construction/service_b06_w3/car/target/j6a_target_production/saturnv.target:1-13)
- [`PercFG_normal.target`](/home/mingfei.zheng/app/construction/service_b06_w3/car/target/j6a_target_production/PercFG_normal.target:1-16)
- [`MachineFG_normal.target`](/home/mingfei.zheng/app/construction/service_b06_w3/car/target/j6a_target_production/MachineFG_normal.target:1-22)
- [`perc_calib_cam_onl.service`](/home/mingfei.zheng/app/construction/service_b06_w3/car/service_file/perc/perc_calib_cam_onl.service:1-27)
- [`sw_calib_srv.service`](/home/mingfei.zheng/app/construction/service_b06_w3/car/service_file/sw/sw_calib_srv.service:1-26)
- [`init.sh`](/home/mingfei.zheng/app/src/calib_parking/scripts/init.sh:33-60)
- [`service_node.cpp`](/home/mingfei.zheng/app/src/calibservice_parking/src/node/service_node.cpp:399-415)
- [`camera_onl_node.cpp`](/home/mingfei.zheng/app/src/calib_parking/src/framework/online/node/camera_onl_node.cpp:586-600)

当前源码搜索到的 `/perception/calib/calib_onl_result_info` 引用主要是：

- `CameraOnlNode` 的 publisher；
- recorder/trigger 的采集配置。

没有找到当前 B06 业务组件对该结果 topic 的明确 subscriber。因而它的价值是
标定专项诊断、回放和 trigger 取证；不能把“被采集”描述成“有业务消费”。

### 9.2 完整结果发布链路

```text
相机图像 /functions/perception/odometry
  -> CameraOnlInput
     ├─> 内部 DSP/模型特征处理
     ├─> lane/feature observers
     └─> OnlineCaliber
  -> 算法内部更新 TotalCalibResult
  -> ResultGetTimer()（配置为 10 s）
  -> CheckCalibResult()
  -> CheckCalibEndFlag()
  -> HandleAllBgCalib()
  -> HandleBgCalib()
     ├─> PublishAllOnlineResult()
     │   -> /perception/calib/calib_onl_result_info
     ├─> PublishTriggerEvent()
     │   -> /software/trigger/trigger_event
     └─> AsyncRequest()
         -> calib_result service
```

右侧三个动作没有 topic-to-topic 订阅关系，但在同一个
`HandleBgCalib()` 调用内按源码顺序执行：

```text
PublishAllOnlineResult()
  -> PublishTriggerEvent()
  -> AsyncRequest()（异步发送 calib_result service 请求）
```

因此结果 topic 与标定 trigger event 是同源的相邻输出，不是结果 topic
触发了 event；service 请求的发送本身是异步的。

定时器、查询和背景结果处理：

- [`camera_onl_node.cpp`](/home/mingfei.zheng/app/src/calib_parking/src/framework/online/node/camera_onl_node.cpp:567-584,1697-1708,1845-1885)
- [`camera_onl_node.cpp`](/home/mingfei.zheng/app/src/calib_parking/src/framework/online/node/camera_onl_node.cpp:1036-1122)

### 9.3 publisher 创建门控和消息条件

publisher 只在 `!IsFormalVersion()` 分支创建：

```cpp
online_calib_publisher_ =
    create_publisher<calib_msgs::msg::DebugAllSensorResult>(
        calib_result_topic, rclcpp::SensorDataQoS());
```

结果 topic 名称由 B06 side/surround 两套 node 配置共同声明：

- [`camera_onl_node.yaml`](/home/mingfei.zheng/app/src/calib_parking/config/b06/online/config_side_narr_v/camera_onl_node.yaml:50-65)
- [`camera_onl_node.yaml`](/home/mingfei.zheng/app/src/calib_parking/config/b06/online/config_surr_v/camera_onl_node.yaml:51-66)
- publisher 创建：[`camera_onl_node.cpp`](/home/mingfei.zheng/app/src/calib_parking/src/framework/online/node/camera_onl_node.cpp:612-649)

`IsFormalVersion()` 由设备属性 `ro.package_type`、`ro.trigger_type` 与
配置中的 `global.formal_cfg` 匹配决定：

- [`onl_main.cpp`](/home/mingfei.zheng/app/src/calib_parking/src/framework/online/onl_main.cpp:97-127,180-194)
- [`tools.cpp`](/home/mingfei.zheng/app/src/calib_parking/src/calib_common/utils/tools.cpp:210-228)

B06 仓库 node 配置没有 `formal_cfg`：

- [`build_param.json`](/home/mingfei.zheng/app/src/adapter/vehicle_param_adapter/ASTRA-B06-W3/config/build_param.json:53-67)

因此按仓库配置推断，`formal_cfg` 为空，正式版本匹配通常会失败，
publisher 预期创建；这只是仓库配置推断，不是设备 active 事实，必须以
启动日志中的 `IsFormalVersion` 和 `ros2 topic info -v` 为准。
此外，在走到 publisher 创建前，节点还必须成功完成 `param_service` 参数
请求并等待 `calib_result` service；实际安装配置、启动日志和
`ros2 topic info -v` 仍是最终证据。

结果 topic 仅在背景相机在线标定结果路径发布，不是周期心跳。背景路径至少要求：

1. `calib_data->calib_end_ == true`；
2. 算法返回的 `calib_result.calib_end == CALIB_END`；
3. 当前 `calib_time` 与上次已经发布的时间不同；
4. `online_calib_publisher_` 非空。

`HandleBgCalib()` 对每个 `CalibResultData`/标定组，在新结果上按上述顺序
发布结果、发布标定 trigger event，再异步调用 `calib_result` service；
同一组相同 `calib_time` 不会再次发布。publisher 未创建时也不会自动补发。
证据：

- [`camera_onl_node.cpp`](/home/mingfei.zheng/app/src/calib_parking/src/framework/online/node/camera_onl_node.cpp:1040-1051,1102-1117)
- [`camera_onl_node.cpp`](/home/mingfei.zheng/app/src/calib_parking/src/framework/online/node/camera_onl_node.cpp:1887-1908,2058-2065)
- [`camera_onl_node.cpp`](/home/mingfei.zheng/app/src/calib_parking/src/framework/online/node/camera_onl_node.cpp:1161-1166)

这里的“完成”是算法结束结果，不应直接等同于“所有传感器标定成功”。
`PublishAllOnlineResult()` 本身不再单独检查 `new_converage`，但上游
side wrapper 会用新的 `calib_time` 计算 `new_converage`，并参与背景结果
是否返回的判断；因此应同时看 `calib_end`、`new_converage`、
`total_state` 和 `sensors_result[].error_code`。

- [`side_calib_wrapper.cpp`](/home/mingfei.zheng/app/src/calib_parking/src/calib_processing/core/online/side_cam/side_calib_wrapper.cpp:601-614,697-722,894-930)

背景结果发布后会停止输入 executor，并取消后续图像/里程计等回调：

- [`camera_onl_node.cpp`](/home/mingfei.zheng/app/src/calib_parking/src/framework/online/node/camera_onl_node.cpp:1118-1122)
- [`camera_onl_input.cpp`](/home/mingfei.zheng/app/src/calib_parking/src/framework/online/component/camera_onl_input.cpp:1448-1462)

### 9.4 实车输入、运行模式和算法触发条件

**Side 背景配置**

- 实车图像：相机 `0,1,2,3,4,5,10`；
- 里程计：`/functions/perception/odometry`；
- side 算法注册 lane contour、lane parsing、里程计以及前/后视
  feature observer。

证据：

- [`camera_onl_node.yaml`](/home/mingfei.zheng/app/src/calib_parking/config/b06/online/config_side_narr_v/camera_onl_node.yaml:76-171)
- [`camera_onl_node.cpp`](/home/mingfei.zheng/app/src/calib_parking/src/framework/online/node/camera_onl_node.cpp:1383-1443)

**Surround 背景配置**

- 实车图像：相机 `5,6,7,8,9`；
- 里程计：`/functions/perception/odometry`；
- surround 算法使用配置的 DSP 特征类型，并注册各相机 feature
  observer。

证据：

- [`camera_onl_node.yaml`](/home/mingfei.zheng/app/src/calib_parking/config/b06/online/config_surr_v/camera_onl_node.yaml:77-132)
- [`camera_onl_node.cpp`](/home/mingfei.zheng/app/src/calib_parking/src/framework/online/node/camera_onl_node.cpp:1454-1497)

`CameraOnlInput` 在 `run_type == reality` 时创建图像订阅；状态回调允许
`pilot` 处理图像，进入 `parking` 或 `pilot_searching` 后会关闭图像/回灌
图像回调：

- [`camera_onl_input.cpp`](/home/mingfei.zheng/app/src/calib_parking/src/framework/online/component/camera_onl_input.cpp:440-456,471-483,1042-1057)

但该 `enable_input_` 检查并不覆盖 contour、lane parsing、feature point
和 odometry 回调，不能据此断言所有标定输入都会被关闭。因此“服务在泊车
target 中绑定”不等于“泊车期间一定能完成在线标定”，也不能绝对断言
泊车期间永远不会产生结果；主测试仍应放在行车/pilot 状态，泊车只做
边界对照并现场核验实际输入。

**外部 contour/feature 与内部 DSP 的区别**

- 配置中声明的 contour/feature topic，若被实际打包配置展开，会由
  `CameraOnlInput` 创建 subscriber，并经 callback 投递给
  `OnlineCaliber`；
- J6 B06 同时存在从相机图像进入内部 `DspRun` 的路径，DSP 产出的特征
  通过内部 `DataObserver` 交给算法；
- 这些输入 topic 都不是结果 topic 的 publisher，也不能单独证明结果
  会发布。

证据：

- 外部输入 subscriber：[`camera_onl_input.cpp`](/home/mingfei.zheng/app/src/calib_parking/src/framework/online/component/camera_onl_input.cpp:508-553,685-713,784-810)
- 内部 DSP 初始化：[`camera_onl_node.cpp`](/home/mingfei.zheng/app/src/calib_parking/src/framework/online/node/camera_onl_node.cpp:665-680)
- DSP observer 注册：[`camera_onl_node.cpp`](/home/mingfei.zheng/app/src/calib_parking/src/framework/online/node/camera_onl_node.cpp:1416-1440,1480-1489)

**算法条件**

以 B06 side 配置为例，side 算法在有效里程计、速度不低于
`1.38 m/s`、绝对 yaw rate 不超过加载配置的 `yaw_rate_th` 时才接受
同步数据；静止、低速、异常里程计或急转会被拒绝。

- [`side_online_calib_bg.yaml`](/home/mingfei.zheng/app/src/calib_parking/config/b06/online/config_side_narr_v/side_online_calib_bg.yaml:52-61)
- [`side_cam_online_calib.cpp`](/home/mingfei.zheng/app/src/calib_parking/src/calib_processing/core/online/side_cam/side_cam_online_calib.cpp:962-988)

此外，B06 背景标定配置关闭 `enable_continuous_calib`；每次服务启动
由 `/app_param/bg_calib_cnt.info` 选择 side 或 surround，算法返回的
`next_calib_mode` 还会写入 `persist.bg_calib_mode`：

- [`side_online_calib_bg.yaml`](/home/mingfei.zheng/app/src/calib_parking/config/b06/online/config_side_narr_v/side_online_calib_bg.yaml:58-61)
- [`init.sh`](/home/mingfei.zheng/app/src/calib_parking/scripts/init.sh:36-60)
- [`camera_onl_node.cpp`](/home/mingfei.zheng/app/src/calib_parking/src/framework/online/node/camera_onl_node.cpp:1052-1061)

### 9.5 实车测试设计

**测试前置**

1. 先确认设备实际选择的是 `j6a_target` 还是
   `j6a_target_production`，再确认只保留一个 `calib_onl` 进程：
   ```bash
   systemctl is-active perc_normal.target
   systemctl is-active perc_calib_cam_onl.service
   ps -ef | grep calib_onl
   ```
2. 确认 `sw_calib_srv.service` active，并能看到 `calib_result` service；
   同时检查 `param_service` 请求成功、参数转换成功，以及日志中的
   `CameraOnlNode init success`。
3. 检查 publisher 是否真的创建：
   ```bash
   ros2 topic type /perception/calib/calib_onl_result_info
   ros2 topic info -v /perception/calib/calib_onl_result_info
   ```
4. 检查实际输入 producer，特别是 target 未明确绑定的
   `perc_odom.service`：
   ```bash
   systemctl is-active perc_odom.service
   ros2 topic hz /functions/perception/odometry
   ```

`perc_odom.service` 在仓库中存在并具备 publisher，但没有出现在 B06
`PercFG_normal.target` 绑定列表中；当前 active odometry producer 不能仅凭
仓库 target 闭合，需现场确认是否由其他启动路径拉起：

- [`perc_odom.service`](/home/mingfei.zheng/app/construction/service_b06_w3/car/service_file/perc/perc_odom.service:1-21)
- [`PercFG_normal.target`](/home/mingfei.zheng/app/construction/service_b06_w3/car/target/j6a_target_production/PercFG_normal.target:3-13)

**测试 1：Side 背景标定新结果**

1. 记录 `bg_calib_cnt.info`，确认本次实际选择 side。
2. 在 pilot/行车状态启动或重启 `perc_calib_cam_onl.service`。
3. 确认相机 `0,1,2,3,4,5,10` 图像连续、时间戳正常，
   `/functions/perception/odometry` 有效。
4. 在封闭道路做连续、稳定、满足算法速度和角速度条件的行驶，
   避免频繁急停和急转。
5. 监听本 topic 至少覆盖多个 10 s 轮询周期，同时记录：
   - `/software/trigger/trigger_event`
   - `calib_result` service 调用日志
   - 标定日志中的 `Bg calib converged` 和
     `Publish online calib result`
6. 收到结果后保存完整消息，因为背景标定收敛后输入 executor 会停止。

**测试 2：Surround 背景标定**

1. 记录 `bg_calib_cnt.info`，确认本次实际选择 surround。
2. 重启服务，不在同一进程中强行切换 side/surround 配置。
3. 确认五路环视图像、odometry 和 DSP 特征链有效。
4. 等待至少一个完整的 10 s 结果轮询窗口，检查新的 `calib_time`。
5. 验收 `sensors_result[]` 的相机 ID、错误码、进度和收敛时间。

**测试 3：不收敛和无发布对照**

分别覆盖：

- 车辆静止或低于速度阈值；
- yaw rate 超过当前加载配置；
- odometry 状态异常或没有 producer；
- 图像低帧、时间戳不对齐或缺少相机；
- 特征不足；
- 进入 `parking`/`pilot_searching` 后图像主链停止，但继续检查 contour、
  lane parsing、feature point、feature map 和 odometry 等未统一门控的
  输入是否仍在推动算法；
- `IsFormalVersion()` 为 true 导致 publisher 不创建；
- 同一进程重复轮询旧 `calib_time`。

这些对照用于区分算法未完成、输入未建立、publisher 被正式版本门控、
结果去重和 recorder 未采集，不能把所有“无消息”归为同一个原因。

### 9.6 验收标准

- topic type 为 `calib_msgs/msg/DebugAllSensorResult`；
- publisher 节点和实际配置可在 `ros2 topic info -v` 中确认；
- 新结果须有 `calib_end == CALIB_END`、新的 `calib_time` 和可解释的
  `sensors_result[]`；
- `total_state`、`calib_rate`、各相机 `error_code` 必须联合判断，
  不能只看 `calib_end`；
- 结果 topic、标定 trigger event 和 `calib_result` service 调用应能在
  同一次 `HandleBgCalib()` 处理窗口内按源码顺序对应，但三者不是
  topic-to-topic 的 subscriber 链；
- 无新收敛结果时不应期待周期心跳；
- 行车可观测帧：条件性；行车有效业务：非正式分支、pilot、odometry/
  图像/算法条件和新收敛结果均满足时才成立；
- 泊车可观测帧：通常不作为正常场景验收；泊车有效业务：不作为正常有效
  标定触发场景。图像主链被关闭，但源码不能绝对断言所有外部输入和所有
  情况下永不产生结果，如需确认必须现场检查实际输入 producer 和结果消息；
- 证据采集建议：条件性保留，仅用于在线标定结果事件；不是普通泊车事件
  的基础 topic。

### 9.7 Topic 结论

```text
源码 publisher 能力：是
当前 active publisher：仓库静态无法确认；需确认非正式版本分支、
param_service/calib_result service、实际 target 和设备配置均满足
publisher 直接输入/发布门控：背景标定结束且 calib_time 为新值
默认回传：否，不是周期心跳
新在线标定结果：条件满足时发布一次
业务 subscriber：当前 B06 未找到明确 subscriber
与 trigger_event 直接关系：同一 HandleBgCalib() 内按顺序相邻输出，未确认
                          结果 topic 直接触发 event
行车可观测帧：条件性；行车有效业务：pilot + 有效输入 + 新完成结果
泊车可观测帧：通常无正常结果帧；泊车有效业务：不作为正常有效场景，
          图像主链关闭但不能从该门控推断所有外部输入都停止
证据采集建议：仅用于在线标定结果事件，且依赖 publisher active
```

## 10. `/software/faultmgr/upload_hmi`

### 10.1 Topic 身份、active 边界和下游消费

该 topic 是 FaultMgr 面向 HMI 的故障快照输出。B06 debug/release 的
`MachineFG_normal.target` 都静态绑定 `sw_faultmgr.service`；但实际
泊车期间是否 active，还受模式切换脚本控制：

```text
saturnv.target
  -> MachineFG_normal.target
  -> sw_faultmgr.service
  -> /app/saturnv_sw/script/faultmgr/init.sh
  -> sw_faultmgr_service / FaultManager
```

FaultMgr 创建 HMI reporter；HDE 在当前共用 HMI 进程中订阅并分发给两个
真实 observer：

```text
/software/faultmgr/upload_hmi
  -> HDE OnlineTopicSubjects::fault_hmi_subscription_
  -> FaultHmiSubject
     ├─> PncMsgEntry
     │   -> DrivingTipComponent::SetFaultHmiMsg()
     └─> VehicleStatusCache::SetFaultHmiMsg()
```

主要证据：

- [`MachineFG_normal.target`](/home/mingfei.zheng/app/construction/service_b06_w3/car/target/j6a_target_production/MachineFG_normal.target:1-22)
- [`sw_faultmgr.service`](/home/mingfei.zheng/app/construction/service_b06_w3/car/service_file/sw/sw_faultmgr.service:1-24)
- [`init.sh`](/home/mingfei.zheng/app/src/software_faultmgr/scripts/init.sh:1-6)
- [`report_manager.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/fault_mgr/reporter/report_manager.cpp:23-49)
- [`online_topic_subjects.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/stream/online_topic_subjects.cpp:220-227)
- [`main.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/main.cpp:120-126)
- [`pnc_msg_entry.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/topic/pnc_msg_entry.cpp:230-233)
- [`vehicle_status_cache.h`](/home/mingfei.zheng/app/src/hmi/src/hde/include/cache/vehicle_status_cache.h:461-466)

### 10.2 完整输入到发布链路

软件注入和外部故障输入最终汇入同一条处理链：

```text
report_monitor_action service
  -> Ros2Receiver::HandleServiceRequest()
  -> FaultManager::InputFaults()
  -> request_faults_
  -> FaultManager::WorkLoop()
  -> ReportManager::ReportToAllNodes()
  -> AsyncFaultHandler::AsyncHandleFault()
  -> AsyncFaultHandler worker
  -> DataManager::UpdateDynamicData()
  -> HmiReporter::PeriodReportHmi()（800 ms timer）
  -> /software/faultmgr/upload_hmi
```

外部 receiver 也会在 `FaultManager` 内调用 `InputFaults()`，所以不能把
`report_monitor_action` 当作唯一生产入口：

```text
ExternalFaultReceiver
  -> FaultManager::InputFaults()
```

关键证据：

- [`ros2_receiver.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/fault_mgr/receiver/ros2_receiver.cpp:15-80)
- [`fault_manager.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/fault_mgr/fault_manager.cpp:26-70,85-170,172-291)
- [`report_manager.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/fault_mgr/reporter/report_manager.cpp:64-94)
- [`async_handler.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/fault_mgr/handler/async_handler.cpp:14-66)
- [`fault_data.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/data/fault_data.cpp:83-96,193-234)
- [`hmi_reporter.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/fault_mgr/reporter/hmi_reporter.cpp:19-100)

因此必须纠正一个常见误读：

> `ReportManager::ReportToAllNodes()` 不直接调用 `HmiReporter` 的 publish。
> 它把故障交给异步处理器写入 `DataManager`，HMI reporter 再由自己的
> 800 ms 定时器读取快照并发布。

### 10.3 发布门控、故障映射和时序

**系统就绪门控**

- FaultMgr 启动时 reporter、publisher 和 timer 已创建；
- `WorkLoop()` 先等待 Machine 状态为 `Normal`，最长时间取实际
  `fm_cfg.json`；
- 等待期间故障会先缓存，不能据此要求立即出现 HMI topic。

B06 仓库 adapter 配置的等待时间为 60 s，但设备实际
`/adapter/config/faultmgr/fm_cfg.json` 可能被覆盖：

- [`fm_cfg.json`](/home/mingfei.zheng/app/src/adapter/software_faultmgr_adapter/ASTRA-B06-W3/config/fm_cfg.json:1-10)
- [`fault_manager.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/fault_mgr/fault_manager.cpp:85-115,262-291)

**输入有效性过滤**

`InputFaults()` 依次检查：

```text
prepare-off
  -> fault_id 是否在已加载静态配置
  -> FilterAdapter::FilterFault()
  -> 写入 request_faults_
```

未知 ID 返回错误；对被 `FilterFault` 拒绝的 `OCCUR` 输入，该故障不会
进入正常上报链。`RESTORE` 输入和进程自动恢复分支需按各自代码路径单独
判断，不能把“被 filter 屏蔽”泛化到所有状态：

- [`fault_manager.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/fault_mgr/fault_manager.cpp:172-259)
- [`config_parser.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/config/config_parser.cpp:36-107,125-127)
- [`filter_adapter_impl.cpp`](/home/mingfei.zheng/app/src/adapter/software_faultmgr_adapter/ASTRA-B06-W3/src/filter_adapter_impl.cpp:18-22)

**HMI ID 门控**

`HmiReporter` 初始化时只建立 `fault_id -> hmi_id` 非无效映射。每个
800 ms 周期：

1. 读取各 fault 的最新状态；
2. 没有 `hmi_id` 的 fault 跳过；
3. `OCCUR` 故障持续进入 HMI 快照；
4. `RESTORE` 故障最多连续报告 10 次；
5. `all_faults_info` 为空时不 publish。

证据：[`hmi_reporter.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/fault_mgr/reporter/hmi_reporter.cpp:19-100)
和 [`hmi_reporter.h`](/home/mingfei.zheng/app/src/software_faultmgr/include/fault_mgr/reporter/hmi_reporter.h:31-39)。

B06 配置中可用于测试的故障示例：

| 故障语义 | `hmi_id` | DTC | 配置位置 |
| :-- | :--: | :-- | :-- |
| 前视图像质量模糊 | `40050` | `B1E2497` | [`faults_config_astra.json`](/home/mingfei.zheng/app/src/adapter/software_faultmgr_adapter/ASTRA-B06-W3/config/faults_config_astra.json:801-818) |
| 前左图像严重遮挡 | `40064` | `B1E2097` | [`faults_config_astra.json`](/home/mingfei.zheng/app/src/adapter/software_faultmgr_adapter/ASTRA-B06-W3/config/faults_config_astra.json:1072-1099) |
| 前右图像严重遮挡 | `40066` | `B1E2297` | [`faults_config_astra.json`](/home/mingfei.zheng/app/src/adapter/software_faultmgr_adapter/ASTRA-B06-W3/config/faults_config_astra.json:1142-1169) |

这些故障的 `happen_desc` 文本写有约 10 s debounce，但结构化
`debounce_type` 为 `None`，且当前 FaultMgr reporter 代码没有读取该文本
字段实现 debounce。因此不能把 10 s 当作本 topic 的代码发布延迟或周期；
实车应实测故障输入到 topic 帧的实际时延，并以设备加载配置和故障源行为
为准。

### 10.4 HDE 下游实际作用

`upload_hmi` 不是只被 recorder 采集。HDE 的两个 observer 会把消息作为
当前故障快照使用：

- `PncMsgEntry` 转发到 `DrivingTipComponent`，影响故障相关 HMI tips；
- `VehicleStatusCache` 维护 `active_fault_ids_`，供泊车/行车相关映射查询。

证据：

- [`driving_tips.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/topic/driving_tips.cpp:3086-3117)
- [`vehicle_status_cache.cpp`](/home/mingfei.zheng/app/src/hmi/src/hde/src/cache/vehicle_status_cache.cpp:1599-1618)
- [`parking_but_text_display.cc`](/home/mingfei.zheng/app/src/hmi/src/hde/src/parking/parking_state/parking_but_text_display.cc:752-869)

因此该 topic 在当前 HDE 链路中具备明确业务消费，不是单纯的遗留采集
配置。

### 10.5 实车测试设计

**测试前置**

1. 默认在行车模式执行，确认：
   ```bash
   systemctl is-active sw_faultmgr.service
   ros2 service list | grep report_monitor_action
   ros2 topic type /software/faultmgr/upload_hmi
   ros2 topic info -v /software/faultmgr/upload_hmi
   ```
2. 等待 Machine 状态完成正常启动窗口。
3. 核对设备实际 `/adapter/config/faultmgr/` 中的 fault ID、
   `hmi_id`、filter、shield、故障源自身时序配置和加载日志；不要把
   `happen_desc` 中的“debounce:10s”直接当作 FaultMgr topic 的发布延迟。

**用例 A：软件注入 OCCUR/RESTORE**

1. 选择设备实际配置中存在、且 `hmi_id` 非空的 fault。
2. 通过批准的 `report_monitor_action` 客户端发送 `OCCUR`。
3. 关联检查 service 返回、FaultMgr 日志、`upload_hmi` 消息和 HDE
   `driving_tips`/缓存变化。
4. 发送同一 fault 的 `RESTORE`。
5. 观察约 800 ms 周期，验证恢复状态最多约 10 次，随后停止。

示例客户端：[`faultmgr_client_example.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/example/faultmgr_client_example.cpp:19-105)。

**用例 B：真实图像质量故障**

1. 车辆静止，封闭场地。
2. 使用测试负责人批准、可快速移除的软质遮挡物，只覆盖指定相机。
3. 记录故障源从输入到 `OCCUR` 快照的实际时延，确认
   `upload_hmi` 帧及 HMI 下游反应；不要预设该时延一定为 10 s。
4. 移除遮挡，确认 `RESTORE` 快照和恢复计数窗口。
5. 不使用拔线、断电或不可逆硬件破坏替代该用例。

**用例 C：负向过滤**

分别覆盖：

- 未知 fault ID；
- `hmi_id == null` 的已知 fault；
- `FilterFault` 屏蔽；
- prepare-off 阶段；
- system-ready 等待阶段；
- FaultMgr 服务停止。

预期分别是拒绝、无 HMI 输出、被过滤、跳过/延迟、服务边界无
publisher；不能统称为 recorder 丢包。

**用例 D：泊车模式边界**

当前 `switch_mode_1j6.sh` 在切入泊车时显式停止
`sw_faultmgr.service`，行车模式则最后启动它；这属于运行时策略，不是
所有泊车 target 的固有结论：

- [`switch_mode_1j6.sh`](/home/mingfei.zheng/app/src/script/switch_mode_1j6.sh:3-25,254-280,390-481)

所以：

- 行车是该 topic 的主验证场景，但是否可观测仍需确认 FaultMgr service
  active；
- 按当前脚本切入泊车并确认 `sw_faultmgr.service` 为 `inactive` 时，
  泊车阶段默认无该 publisher；若现场重新启动 FaultMgr，则泊车也可能
  条件性存在输出；
- trigger 清单中存在该 topic，不能推出泊车时一定有回传。

### 10.6 验收标准

- topic type 为 `foxglove_msgs/msg/FaultHmiAllInfo`；
- 源码 publisher 来自 FaultMgr，HDE subscriber/observer 的消费链路可在
  源码中确认；当前设备是否 active 仍需 `ros2 topic info -v` 验证；
- `OCCUR` 消息包含预期 `hmi_id`、fault ID、状态和输入时间戳；
- `RESTORE` 最多报告 10 次是当前实现行为；
- 无有效 HMI 故障时没有空心跳；
- service 返回、FaultMgr 日志、topic 帧和 HDE 下游状态能够按时间对齐；
- 行车可观测帧：条件性；行车有效业务：FaultMgr active、ready 且存在
  有效 `hmi_id` 故障；
- 泊车可观测帧：默认无（仅限执行模式切换脚本并确认服务已停止）；泊车
  有效业务：重新启动 FaultMgr 后才可条件性观测；
- 证据采集建议：条件性保留，仅在故障发生/恢复或 HMI 影响属于分析目标
  时采集。

### 10.7 Topic 结论

```text
源码 publisher 能力：是
当前 active publisher：仓库静态无法确认，normal target 虽静态绑定，
                  仍需结合实际 service 状态和 ros2 topic info -v 确认
源码消费链路：存在（HDE FaultHmiSubject -> PncMsgEntry/VehicleStatusCache）；
              当前设备 active subscriber 待现场确认
publisher 直接输入/发布门控：report_monitor_action 或 ExternalFaultReceiver
发布周期：HmiReporter 800 ms timer；无有效内容时不发空帧
故障发生：持续报告最新 OCCUR 状态
故障恢复：按 fault_id 最多报告 10 次
与 trigger_event 直接关系：未确认
行车可观测帧：条件性；行车有效业务：切入行车后脚本启动 FaultMgr 且故障映射有效
泊车可观测帧：默认无（脚本停服时）；泊车有效业务：服务恢复后条件性存在
证据采集建议：仅在故障发生/恢复或 HMI 影响属于分析目标时保留
```

## 11. `/software/faultmgr/upload_hviz_type`

### 11.1 Topic 身份、active 边界和消费者

该 topic 是 FaultMgr 输出给 HVIZ/诊断侧的类型和 DTC 聚合结果。它与
`upload_hmi` 共用 FaultMgr，但消息类型不同；其 publisher 是否 active
同样受 FaultMgr service 的运行状态影响：

```text
sw_faultmgr.service
  -> FaultManager
  -> ReportManager
  -> HvizReporter
  -> /software/faultmgr/upload_hviz_type
```

`HvizReporter` 同时创建 monitor topic 和本 topic 的 publisher，使用
`diagnostic_msgs/msg/DiagnosticArray`，工程代码别名为 `RosDiagStatusArray`。

仓库中存在 `software_vehicle_toolkit` 的明确 subscriber，但该工具是否随
当前 B06 normal target 一起启动没有被 target 绑定关系证明。debug target
的 `Append_Service.target` 绑定了 `sw_tool_vehicle_status.service`，
production target 当前未绑定；因此它只能作为“仓库级 consumer”，不能
直接写成当前 production 实车必然 active 的业务下游：

- publisher：[`report_manager.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/fault_mgr/reporter/report_manager.cpp:23-49)
- reporter：[`hviz_reporter.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/fault_mgr/reporter/hviz_reporter.cpp:20-32)
- 仓库 consumer：[`status_collection.cpp`](/home/mingfei.zheng/app/src/software_vehicle_toolkit/vehicle_status/src/server/status_collection.cpp:127-150)
- active FaultMgr 边界：[`MachineFG_normal.target`](/home/mingfei.zheng/app/construction/service_b06_w3/car/target/j6a_target_production/MachineFG_normal.target:1-22)；
  debug/release 的附加服务差异：[`Append_Service.target`](/home/mingfei.zheng/app/construction/service_b06_w3/car/target/j6a_target/Append_Service.target:1-13)、[`Append_Service.target`](/home/mingfei.zheng/app/construction/service_b06_w3/car/target/j6a_target_production/Append_Service.target:1-8)

### 11.2 完整输入和两条发布路径

FaultMgr 的输入前半段与 `upload_hmi` 相同：

```text
report_monitor_action / ExternalFaultReceiver
  -> FaultManager::InputFaults()
  -> WorkLoop()
  -> ReportManager::ReportToAllNodes()
```

从这里分成两条独立路径。

**路径 A：5 s 周期聚合**

```text
ReportManager::ReportToAllNodes()
  -> AsyncFaultHandler::AsyncHandleFault()（入队）
     -> worker -> DataManager::UpdateDynamicData()

HvizReporter 构造
  -> 独立 5 s timer -> HvizReporter::PeriodReport()
     -> DataManager::GetCurrentOccurData()
     -> TypeHandler::MappingType2Faults()
     -> TypeHandler::MappingDtc2Faults()
     -> HvizReporter::ReportHvizTypeAndDtc()
     -> /software/faultmgr/upload_hviz_type
```

`AsyncHandleFault()` 的 worker 和 5 s timer 是独立执行路径，首次周期可能
与动态数据更新发生竞态；故障输入不是 5 s 发布的直接触发器，不能把故障
注入后“固定 5 s 内必有消息”当作源码保证。

**路径 B：DTC 状态变化即时输出**

```text
FilterFault（输入阶段）
  -> ReportManager::ReportToAllNodes()
  -> ReportDtc()
  -> TypeHandler::CheckNeedReportDtc()（更新即时状态判定缓存）
  -> HvizReporter::ReportHvizDtc()（ROS publish）
  -> FilterDtc
     ├─> DataManager::UpdateDtcData()
     │   -> changed_dtcs_ -> AsyncFaultHandler -> AgentReporter::ImmediateReport()
     └─> RcoreAdapter::SendDtcReport()（异步 pending 队列）
          -> 独立发送线程 -> UDS proxy
```

源码依据：

- [`report_manager.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/fault_mgr/reporter/report_manager.cpp:64-94,116-134)
- [`fault_manager.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/fault_mgr/fault_manager.cpp:85-170,172-291)
- [`async_handler.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/fault_mgr/handler/async_handler.cpp:28-66)
- [`fault_data.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/data/fault_data.cpp:83-96,193-234)
- [`hviz_reporter.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/fault_mgr/reporter/hviz_reporter.cpp:40-48,106-179)

### 11.3 周期聚合的真实发布条件

周期函数只读取当前仍为 `OCCUR` 的故障：

```text
当前 OCCUR fault
  -> 映射到 fault_type 或 DTC
  -> type_msg.status 非空
  -> publish
```

具体门控为：

1. `DataManager::GetCurrentOccurData()` 能取到至少一个当前发生故障；
2. 该 fault 在 `TypeHandler` 中有 `fault_type` 或 DTC 映射；
3. 故障已通过输入阶段的 ID、`FilterFault`、shield 等处理；
4. `ReportHvizTypeAndDtc()` 组装出的 `status` 非空。

只有没有当前 `OCCUR`、只有无类型/DTC 映射，或对应 `OCCUR` 在输入阶段被
`FilterFault` 拒绝时，才可据此判断对应 5 s 聚合没有输出。`FilterDtc`
拒绝和 `rcore_report_enabled=false` 不会单独阻断 5 s 聚合，因为该路径
读取的是当前动态 `OCCUR` 数据。类型和 DTC 映射的初始化来自静态配置：

- [`type_handler.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/fault_mgr/handler/type_handler.cpp:15-24,149-187)
- [`hviz_reporter.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/fault_mgr/reporter/hviz_reporter.cpp:106-153)

周期消息的典型字段语义：

- `hardware_id = "sw_faultmgr_center"`；
- 类型消息 `name` 来自 fault type 描述；
- DTC 消息 `name` 来自 DTC 名称；
- `level` 对当前发生故障为 `ERROR`；
- `values[].key` 为 `fault_id + SOC`，`values[].value` 为故障描述。

### 11.4 DTC 即时路径和恢复语义

`CheckNeedReportDtc()` 会比较每个 DTC 下 fault 的发生/移除状态：

- 首次发生或 DTC 下新增 fault：生成 `OCCUR` DTC 数据；
- DTC 下最后一个 fault 恢复：生成 `RESTORE` DTC 数据；
- 没有状态变化：不生成即时消息。

该路径还要求：

```text
DTC 配置存在
&& rcore_report_enabled == true
```

需要区分两个过滤器：

- `FilterFault` 发生在 FaultMgr 输入阶段。对被它拒绝的 `OCCUR` 输入，
  该故障不会进入 `ReportManager`，因此不会产生对应的即时或 5 s 周期
  `upload_hviz_type` 数据；`RESTORE` 和进程自动恢复分支需按各自代码
  路径单独判断；
- `FilterDtc` 发生在 `ReportHvizDtc()` 的 ROS publish 之后，不能写成该
  topic 的直接发布门控。它决定哪些 DTC 写入 `DataManager` 的 DTC 缓存、
  进入 Agent DTC 周期快照、Agent 即时上报以及 RCore pending 队列。

`rcore_report_enabled=false` 时，`ReportDtc()` 会在
`CheckNeedReportDtc()` 前直接返回，因此不会产生 DTC 状态变化的即时
OCCUR/RESTORE ROS 消息；但它不关闭 publisher，也不阻止
`HvizReporter::PeriodReport()` 依据当前 OCCUR fault 发布 5 s 类型/DTC
聚合消息。

`ReportHvizDtc()` 对恢复状态设置 `level = OK`，但它只在即时变化路径中
发送。周期聚合路径读取 `GetCurrentOccurData()`，所以不能要求
`FAULT_RESTORE` 必然出现在下一条 5 s 周期消息中。同一 DTC 下如果仍有
其他 fault 为 OCCUR，恢复其中一个不会产生最终 `OK`；只有该 DTC 下最后
一个 fault 恢复时才应验收 `RESTORE/OK`。

这里的三类“缓存”不是同一个对象：`TypeHandler` 保存即时状态判定所需的
状态，`DataManager` 保存经 `FilterDtc` 后供 Agent 使用的数据，
RCore 维护 pending/失败重试队列。`SendDtcReport()` 是异步排队，不是
同步完成 UDS 上报。

证据：

- [`type_handler.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/fault_mgr/handler/type_handler.cpp:87-145)
- [`report_manager.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/fault_mgr/reporter/report_manager.cpp:116-134)
- [`async_handler.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/fault_mgr/handler/async_handler.cpp:58-65)
- [`hviz_reporter.cpp`](/home/mingfei.zheng/app/src/software_faultmgr/src/fault_mgr/reporter/hviz_reporter.cpp:156-179)
- [`fm_cfg.json`](/home/mingfei.zheng/app/src/adapter/software_faultmgr_adapter/ASTRA-B06-W3/config/fm_cfg.json:1-10)

### 11.5 实车测试设计

测试前置沿用 `upload_hmi`，并额外核对：

```bash
systemctl is-active sw_faultmgr.service
ros2 topic type /software/faultmgr/upload_hviz_type
ros2 topic info -v /software/faultmgr/upload_hviz_type
```

**用例 A：fault type 周期聚合**

1. 选择设备实际配置中有 `fault_type` 的故障。
2. 在行车模式、FaultMgr 已完成 system-ready 后发送 `OCCUR`。
3. 监听至少 6-10 s，覆盖一个以上 5 s 周期。
4. 验证 `status[]` 非空、类型名称、`ERROR` 等级和
   `values[].key/value`。

**用例 B：DTC 发生和恢复即时路径**

1. 选择配置了 DTC 且 `rcore_report_enabled` 为真的故障。
2. 发送 `OCCUR`，记录发送时刻和本 topic 的即时消息。
3. 发送同一故障 `RESTORE`，检查是否出现 DTC `OK` 消息。
4. 再等待一个 5 s 周期，确认恢复状态不被误判为周期聚合必然输出；
   若多个 fault 共用同一 DTC，则逐个恢复并验证中间仍为 `ERROR`，最后
   一个恢复后才为 `OK`。
5. 检查 `upload_hmi` 的恢复消息，与本 topic 的 DTC 恢复消息分开验收。

**用例 C：类型/DTC 组合**

选择同时配置 `fault_type` 和 DTC 的故障，确认一次输入可能在同一
FaultMgr 处理中产生类型聚合和 DTC 变化输出；两者时间接近不代表它们
来自同一个 publisher 调用。

**用例 D：负向覆盖**

分别覆盖：

- 已知 fault，但无 `fault_type`、无 DTC；
- 只有 DTC；
- 只有 `fault_type`；
- 未知 fault ID；
- `FilterFault` 或 `FilterDtc` 屏蔽；
- `rcore_report_enabled: false`；
- prepare-off；
- system-ready 等待；
- FaultMgr 服务停止；
- 泊车模式按脚本停止 FaultMgr。

预期是：无映射故障可能完全无本 topic；`FilterFault` 过滤的故障不进入
任何后续 Hviz 路径；`rcore_report_enabled` 关闭只阻止
`ReportDtc()` 的即时路径，不关闭 publisher 或 5 s 聚合；当前实现中
`FilterDtc` 位于 ROS 即时 publish 之后，主要影响 DataManager、Agent
和 RCore DTC 后续链路，需把 ROS topic 与这些下游分别验收；服务停止时
没有 publisher 属于运行边界。

### 11.6 验收标准

- topic type 为 `diagnostic_msgs/msg/DiagnosticArray`；
- 周期路径按 5 s 观察，但不把 5 s 当成每次必发保证；
- 即时 DTC 路径能区分发生和恢复，恢复等级应为 `OK`；
- `hardware_id`、`name`、`level`、`values[]` 能与实际故障配置对应；
- 无类型/DTC映射时无消息是预期行为，不判为 recorder 丢包；
- 当前 B06 仓库 consumer 不能替代设备上 `ros2 topic info -v` 的 active
  subscriber 检查；production 附加 target 未静态绑定该 consumer；
- 行车可观测帧：条件性；行车有效业务：FaultMgr active，且类型/DTC
  映射或状态变化满足；
- 泊车可观测帧：默认无（当前模式切换脚本停服时）；泊车有效业务：重新
  启动 FaultMgr 后条件性存在，不能把“无”理解为所有泊车 target 的固有
  结论；
- 证据采集建议：条件性保留，仅在 FaultMgr 类型/DTC 诊断属于分析目标
  且映射、服务状态满足时采集。

### 11.7 Topic 结论

```text
源码 publisher 能力：是
当前 active publisher：仓库静态无法确认；normal target 虽静态绑定，
                  仍需结合实际 service 状态和 ros2 topic info -v 确认
发布类型：diagnostic_msgs/msg/DiagnosticArray（RosDiagStatusArray）
周期路径：独立 5 s timer；当前 OCCUR fault + type/DTC 映射，首次周期
          与异步动态数据更新存在时序竞争
即时路径：DTC 状态变化，受 rcore_report_enabled 控制；ROS publish 先于
          FilterDtc，后者影响 DataManager/Agent/RCore 后续分支
空闲行为：不发空消息
当前 B06 active subscriber：仓库有 consumer；debug 附加 target 有绑定，
production 附加 target 未绑定，设备需现场确认
与 trigger_event 直接关系：未确认
行车可观测帧：条件性；行车有效业务：条件性
泊车可观测帧：默认无（脚本停服时）；泊车有效业务：服务恢复后条件性存在
证据采集建议：仅在 FaultMgr 类型/DTC 事件中保留，依赖映射和服务状态
```

## 12. 推荐实车录包与观测命令

### 12.1 启动前

```bash
ros2 node list
ros2 topic list

ros2 topic type /functions/hmi/driving_status
ros2 topic type /functions/hmi/driving_tips
ros2 topic type /functions/hmi/parking_custom
ros2 topic type /functions/hmi/vehicle_status
ros2 topic type /functions/parking_pnc/arrive_fix_slot
ros2 topic type /functions/parking_pnc/map_control_cmd
ros2 topic type /perception/calib/calib_onl_result_info
ros2 topic type /software/faultmgr/upload_hmi
ros2 topic type /software/faultmgr/upload_hviz_type
```

逐项确认 publisher：

```bash
ros2 topic info -v <topic>
```

重点看 publisher 节点、类型和 QoS；不能只看 `topic list`。

### 12.2 行车/HMI 最小录包

```bash
ros2 bag record -o hmi_chain_check \
  /functions/hmi/driving_status \
  /functions/hmi/driving_tips \
  /functions/hmi/vehicle_status \
  /functions/pnc/to_hmi \
  /functions/pnc/to_hmi_state \
  /sensor/chassis/vehicle_status \
  /software/faultmgr/upload_hmi \
  /software/faultmgr/upload_hviz_type \
  /software/trigger/trigger_event
```

### 12.3 泊车最小录包

```bash
ros2 bag record -o parking_chain_check \
  /functions/hmi/driving_status \
  /functions/hmi/driving_tips \
  /functions/hmi/parking_custom \
  /functions/hmi/vehicle_status \
  /functions/parking_pnc/arrive_fix_slot \
  /functions/parking_pnc/map_control_cmd \
  /functions/parking_pnc/apa_state \
  /functions/parking_pnc/parking_scene \
  /functions/parking_pnc/car_in_slot \
  /functions/parking_pnc/parkable_slot \
  /functions/perception/parking_slot_info \
  /functions/pnc_hpa/ssm_to_state \
  /functions/perception/odometry \
  /functions/navinet_parking/map_event \
  /functions/navinet_parking/reverse_tracking \
  /software/trigger/trigger_event
```

### 12.4 标定专项最小录包

```bash
ros2 bag record -o calib_chain_check \
  /perception/calib/calib_onl_result_info \
  /functions/perception/odometry \
  /software/trigger/trigger_event
```

图像输入量很大，建议使用 recorder 的正式 profile 采集，不要随意在 ROS shell 中复制所有原始图像。

### 12.5 逐事件确认是否真正被 trigger 采集

当前 B06 的 trigger 不是“9 个 topic 反向触发一个事件”，而是以下顺序：

```text
业务模块
  -> /software/trigger/trigger_event
  -> trigger_forward
     -> 按事件类型覆盖 topics（topics_src = 1）
  -> /software/trigger/trigger_event_forward
  -> trigger_sink
     -> 消息自带 topics 非空：使用消息 topics
     -> 否则：回退 general_topic_lists
  -> recorder TriggerRecord
  -> MCAP
```

源码依据：

- [`forward_module.cpp`](/home/mingfei.zheng/app/src/software_trigger_engine/src/trigger_forward/src/forward_module.cpp:20-75)
- [`trigger_node.cpp`](/home/mingfei.zheng/app/src/ros2_trigger/trigger_sink/src/trigger_node.cpp:1190-1232,1355-1369)
- [`mcap_writer.cpp`](/home/mingfei.zheng/app/src/tros_record_backend/record_backend/src/mcap_writer.cpp:286-299)

要判断某个 topic 是否**对某个具体事件**真正有用，不能只查
`general_topic_lists` 或事件 JSON。每个事件至少要核对：

1. 业务动作确实产生了一条 `/software/trigger/trigger_event`；
2. `/software/trigger/trigger_event_forward` 中的事件类型、时间戳、
   `topics` 和 `topics_src`；
3. trigger info JSON 中记录的 `topics`、`topics_src`、`before_ts` 和
   `after_ts`；
4. 最终 MCAP 是否包含该 topic；
5. 该 topic 在事件窗口内是否有有效、可解释的业务帧，而不是只有默认帧、
   空周期帧或无关历史帧。

建议将上述五步作为每个事件类型的验收闭环。这样才能区分“配置上会采集”
和“当前项目对该事件确实需要”，也能识别 cloud config 或 active target
变化造成的实际差异。

## 13. 最终测试矩阵

| 测试编号 | 场景 | 重点 topic | 预期可观测帧 | 预期有效业务 | 建议联合观察项（用于解释和验收，不是默认发布前置） | 实车边界 |
| :--: | :-- | :-- | :-- | :-- | :-- | :-- |
| HMI-01 | 上电、待机、ICA/NOA 状态切换 | `driving_status`、`driving_tips` | status 条件性有帧；tips 约 33 ms 周期，可为空 | 状态切换和提示字段与 PNC 输入对应 | `/functions/pnc/to_hmi*`、`trigger_event` | 行车/泊车 |
| HMI-02 | 人工接管、激活失败、MRM | `driving_status`、`driving_tips` | 事件后出现对应状态/提示帧 | 仅在 active、原因映射和状态边沿满足时判定有效 | `/functions/pnc/to_hmi_state`、FaultMgr | 行车为主 |
| HMI-03 | 底盘状态和换挡 | `vehicle_status`、`driving_tips` | 有新鲜底盘输入时有帧 | 速度、档位、制动、车门等字段转换正确 | `/sensor/chassis/vehicle_status` | 行车/泊车 |
| PK-01 | 普通 APA 泊入 | `driving_status`、`driving_tips`、`vehicle_status` | HMI topic 条件性有帧 | 泊车状态、准备条件和执行状态可解释 | `apa_state`、规划、车位、odometry | 泊车 |
| PK-02 | 自定义车位/拖动 | `parking_custom` | 默认帧或 custom/page-active 周期帧 | 仅合法自定义车位数据判为有效业务 | `apa_state`、`parking_slot_info`、freespace 输出 | 泊车 |
| PK-03 | HPA 距离/匹配/到达边界 | `arrive_fix_slot` | 正剩余距离时可能有帧；距离小于等于 0 时可能停发 | 不把正距离帧直接解释为匹配或到达成功 | `ssm_to_state`、`parkable_slot`、`parking_scene`、`car_in_slot`、`apa_state` | HPA 泊车 |
| PK-04 | BUT 开始/中止/完成 | `map_control_cmd` | 状态机事件时出现离散命令帧 | START/ABORT/COMPLETE 必须与 BUT 会话和 Navinet 状态一致 | `map_event`、`reverse_tracking`、`apa_state` | BUT 泊车 |
| PK-05 | 普通 APA 中止副作用 | `map_control_cmd` | 可能出现 `BUT_ABORT`，也可能没有 | 若无 START_BUT，不得解释为 BUT 会话中止 | `Controling -> Abort` 日志、`apa_state`、Navinet 状态 | 泊车对照 |
| CAL-01 | 在线相机标定正常收敛 | `calib_onl_result_info` | 非正式分支且新收敛时有一次结果帧 | `calib_end`、`total_state`、相机错误码联合解释 | `calib_result` service、图像、odometry、标定日志、trigger event | 行车/pilot |
| CAL-02 | 静止/低速/特征不足不收敛 | `calib_onl_result_info` | 预期无新结果帧，不判为 recorder 丢包 | 验证算法拒绝条件和 publisher/输入边界 | 输入有效性、`IsFormalVersion`、服务日志 | 行车/对照 |
| CAL-03 | side/surround 轮换和重复结果去重 | `calib_onl_result_info` | 新 `calib_time` 一次一帧；重复时间不重复发 | 轮换模式和 `next_calib_mode` 可解释 | `bg_calib_cnt.info`、`persist.bg_calib_mode`、`calib_time` | 行车/pilot |
| FM-01 | FaultMgr 软件 OCCUR/RESTORE | `upload_hmi`、`upload_hviz_type` | 依赖 service active、映射和异步更新；不保证固定时延 | 分开验收 HMI 快照、类型聚合和 DTC 即时路径 | `report_monitor_action` 返回、FaultMgr 日志、HDE 下游、RCore | 行车 |
| FM-02 | 图像质量故障和恢复 | 两个 FaultMgr topic | 记录实际输入到各 topic 的时延；hviz 可能无映射则无帧 | HMI `hmi_id`、类型/DTC 映射、恢复语义分别验收 | 故障源、HMI tips、DTC 变化、trigger event | 行车 |
| FM-03 | FaultMgr 泊车服务边界 | 两个 FaultMgr topic | 脚本停服后无 publisher；重启服务后条件性有帧 | 验证运行策略，不把它当作泊车业务必然输出 | `systemctl is-active sw_faultmgr.service`、模式切换日志 | 泊车对照 |

## 14. 核心结论

1. 这 9 个 topic 均能在当前工程中找到源码 publisher 能力或明确的生产/
   消费链路，但这不等于当前设备上的 publisher 一定 active，也不等于
   它们是 `/software/trigger/trigger_event` 的条件或必要输入。
2. 当前 trigger 流程是：业务模块先发布独立的
   `/software/trigger/trigger_event`，再由 `trigger_forward` 和
   `trigger_sink` 按事件 topics 或 `general_topic_lists` 选择录包 topic。
   9 个 topic 出现在这些配置中，只说明采集策略，不能证明对每个事件都
   必要。
3. 采集建议应按事件诊断目标划分：
   - `driving_status`、`driving_tips`、`vehicle_status`：涉及 HMI/PNC/
     车辆状态的事件通用候选，仍需按具体事件保留；
   - `parking_custom`：自定义泊车、拖动、退出或融合异常事件候选；
   - `arrive_fix_slot`：HPA 固定目标、距离和到达匹配事件候选；
   - `map_control_cmd`：BUT START/ABORT/COMPLETE 时序事件候选；
   - `calib_onl_result_info`：在线标定结果事件候选，依赖 publisher active；
   - 两个 FaultMgr topic：故障发生/恢复、HMI 影响或类型/DTC 事件候选，
     依赖 FaultMgr service、映射和运行模式。
4. “topic 有 publisher”不等于“测试时一定有消息”。默认帧、空周期帧、
   条件帧、算法未收敛、输入不新鲜、过滤器、异步时序和模式停服都必须
   分别解释。
5. 实车验证必须闭合五步：业务动作产生 `trigger_event`、核对
   `trigger_event_forward` 的 topics/topics_src、核对 trigger info、检查
   MCAP 是否包含目标 topic、最后确认事件窗口内存在可解释的有效业务帧。
   单纯 `ros2 topic list`、只看 recorder 配置或只看到一条默认/空帧都不
   能替代该闭环。
