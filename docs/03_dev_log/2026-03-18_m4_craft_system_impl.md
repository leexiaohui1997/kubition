# M4 制造系统实现日志

**日期**：2026-03-18  
**里程碑**：M4 — 制造系统  
**状态**：✅ 已完成

---

## 一、本次实现内容

### 1. 新增文件

| 文件路径 | 说明 |
|----------|------|
| `src/hooks/useCrafting.ts` | 制造核心 Hook，含前置检查与进度条定时器逻辑 |
| `src/components/ui/RecipeList.tsx` | 配方列表组件，三态分组显示 |
| `src/components/scenes/SmithScene.tsx` | 铁匠铺场景 |
| `src/components/scenes/AlchemyScene.tsx` | 炼金台场景 |

### 2. 修改文件

| 文件路径 | 修改内容 |
|----------|----------|
| `src/stores/gameStore.ts` | 新增 `isCrafting`、`craftProgress`（运行时）、`unlockedSciences`（持久化）及 4 个 action |
| `src/hooks/useTravel.ts` | 出发前增加 `isCrafting` 互斥检查 |
| `src/hooks/useGathering.ts` | 采集前增加 `isCrafting` 互斥检查 |
| `src/components/scenes/SceneRouter.tsx` | 添加制造进度条覆盖层 + 注册 `smith`/`alchemy` 场景路由 |
| `src/components/scenes/TownScene.tsx` | 新增"进入铁匠铺"和"进入炼金台"入口按钮 |

---

## 二、核心设计决策

### 2.1 互斥状态机制

制造、采集、移动三者完全互斥。任一进行中时，其余操作的触发函数均在入口处提前返回：

```typescript
// useTravel.ts / useGathering.ts / useCrafting.ts 均有此检查
if (
  useGameStore.getState().isTraveling ||
  useGameStore.getState().isGathering ||
  useGameStore.getState().isCrafting
) return
```

### 2.2 进度条时长换算

制造进度条复用采集系统的 `GATHER_TICK_INTERVAL` 常量，根据配方 `timeCost` 等比换算总 tick 数：

```typescript
// 基准：50 ticks = 1 游戏小时（与采集系统对齐）
const totalTicks = Math.max(50, Math.round(50 * recipe.timeCost))
const increment = 100 / totalTicks
```

### 2.3 材料扣除时机

点击制造时**立即扣除**材料，防止进度条期间重复点击导致材料被多次消耗。

### 2.4 配方三态分组

`RecipeList` 组件将配方按以下优先级排序展示：

1. **可制作**（蓝色可点击）
2. **材料不足**（暗灰色，列出缺少材料）
3. **未解锁**（带 🔒 图标，提示所需科技名称）

### 2.5 持久化扩展

`unlockedSciences: string[]` 加入 `partialize` 白名单，科技解锁状态随存档持久化。M4 阶段初始值为空数组，科技台（M4 后续）实现后可直接调用 `unlockScience(id)` 解锁。

---

## 三、数据流

```
玩家点击配方
    ↓
useCrafting.startCraft(recipe)
    ↓
canCraft() 前置检查
  ├─ 互斥状态检查（isCrafting / isTraveling / isGathering）
  ├─ 背包容量检查
  ├─ 科技解锁检查（requiredScience）
  └─ 材料数量检查
    ↓（通过）
立即扣除材料 → startCrafting() → setInterval 启动
    ↓（每 tick）
setCraftProgress(progress)
    ↓（progress >= 100）
finishCrafting() → addItem(产出) → advanceTime(timeCost) → addLog(成功)
```

---

## 四、遗留问题 / 后续计划

| 问题 | 说明 | 优先级 |
|------|------|--------|
| 科技台未实现 | `unlockedSciences` 始终为空，所有 `requiredScience` 配方均被锁定 | M4 后续 |
| 魔法台未实现 | `magic` 类配方暂无对应场景 | M4 后续 |
| 制造取消功能 | 进度条期间无法中途取消制造 | 待评估 |
| 进度条 UI 重复 | SceneRouter 中移动/采集/制造三段进度条代码结构相同，可提取为组件 | 已提出建议 |
| 互斥检查重复 | useTravel/useGathering/useCrafting 中互斥检查代码重复，可提取为工具函数 | 已提出建议 |

---

## 五、构建验证

```
✅ npm run build 通过（63 个模块）
✅ 无 lint 错误
✅ 无 TypeScript 类型错误
```

---

## 六、M4 后续迭代改动（同日追加）

### 6.1 ItemName 通用组件

**新增文件**：`src/components/ItemName.tsx`

提取物品名称展示为独立组件，统一处理"物品 ID → 中文名称 + 类型颜色"的渲染逻辑，供 `RecipeList`、`RecipeItem`、`Inventory` 等多处复用。

- 接收 `item: { id: string }` 或完整 `Item` 对象
- 自动从 `ITEMS` 数据中查找名称，找不到时降级显示 `id`
- 支持 `truncate` 属性控制是否截断溢出
- 名称文字颜色跟随物品类型（来自 `ITEM_TYPE_COLOR` 常量）

### 6.2 ItemTooltip 展示物品类型 + 名称

**修改文件**：`src/components/ItemTooltip.tsx`

- 浮窗顶部新增物品名称与类型同行展示：
  - 左侧：物品名称（`text-sm font-bold text-mud-text`）
  - 右侧：类型标签 `[食材]` / `[武器]` 等（`text-[10px]`，颜色来自 `ITEM_TYPE_COLOR`，文字来自 `ITEM_TYPE_LABEL`）
- 导入 `ITEM_TYPE_LABEL`（来自 `constants/labels.ts`）和 `ITEM_TYPE_COLOR`（来自 `constants/styles.ts`）

### 6.3 ITEM_TYPE_LABEL 补全

**修改文件**：`src/constants/labels.ts`

- 类型从 `Record<string, string>` 改为 `Record<ItemType, string>`，获得完整的枚举类型检查
- 补充所有科技树节点类型的中文映射（共 20 个科技类型），格式统一为 `科技·XXX`

### 6.4 RecipeList → RecipeItem 拆分

**新增文件**：`src/components/ui/RecipeItem.tsx`  
**修改文件**：`src/components/ui/RecipeList.tsx`

将单个配方条目从 `RecipeList` 中抽离为独立组件 `RecipeItem`：

- `RecipeList` 只保留数据计算（三态分组排序）和列表渲染，不再包含条目 UI 细节
- `RecipeItem` 负责单条配方的完整展示：
  - 配方名称（`ItemName`）+ 耗时
  - 材料需求列表（每个材料名称使用 `ItemName`）
  - 缺少材料提示（材料名称使用 `ItemName`）
  - 科技锁定提示（科技名称使用 `ItemName`）
  - 专用【制作】按钮（主题色高亮，禁用时灰色）
  - 调试模式下的【获得材料】按钮（见 6.5）
- `RecipeStatus` 类型迁移到 `RecipeItem.tsx` 并由 `RecipeList.tsx` 重新导入

### 6.5 DEBUG_MODE 调试模式

**修改文件**：`src/constants/game.ts`

新增常量：
```typescript
/** 是否为调试模式，调试模式下会显示额外的调试按钮和日志 */
export const DEBUG_MODE = true
```

**调试功能**：`RecipeItem` 中当 `DEBUG_MODE = true` 时，配方主行右侧显示橙色【获得材料】按钮：
- 点击后遍历 `recipe.materials`，逐个调用 `addItem(itemId, amount)` 将所需材料加入背包
- 同时写入 `warning` 类型日志：`获得材料：xxx x2、yyy x1`

### 6.6 互斥检查工具函数提取

**新增文件**：`src/utils/actionGuard.ts`

将三个 Hook 中重复的互斥状态检查提取为工具函数：

```typescript
export function isActionBusy(): boolean {
  const state = useGameStore.getState()
  return state.isTraveling || state.isGathering || state.isCrafting
}
```

`useTravel`、`useGathering`、`useCrafting` 统一调用此函数，消除重复代码。

### 6.7 ItemType 枚举补全

**修改文件**：`src/types/game.ts`

补充科技树相关的 `ItemType` 枚举值（共 20 个），包括：
`UnknownBonus`、`BigBoxSizeBonus`、`BagSizeBonus`、`FarmSizeBonus`、`AlcoSizeBonus`、`TrapSizeBonus`、`WellBonus`、`MakeSpeed`、`CookerUpdate`、`DurableUpdate`、`MagicDurableUpdate`、`CollectDec`、`TrapChance`、`TrapGet`、`LockUpdate`、`SecurityBox`、`MapBonus`、`BeaconMax`、`SleepPlace`、`ShowerPlace`

同时将 `items.ts` 中原先使用字符串字面量（如 `'equip'`）的 `type` 字段全部替换为 `ItemType.Equip` 等枚举引用，消除类型不一致问题。

---

*日志记录时间：2026-03-18 13:24（初版）/ 2026-03-18 14:57（追加迭代记录）*
