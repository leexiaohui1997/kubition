# M4: 制造系统

## 📋 里程碑目标

实现铁匠铺和炼金台，玩家可以制作工具和装备。

**工期:** 2 天  
**前置:** M3 资源采集  
**输出:** 铁匠铺 + 炼金台 Demo  
**状态:** ✅ 已完成（2026-03-18）

---

## ✅ 核心功能

### 1. 制造队列系统

```typescript
// useCrafting Hook 核心逻辑
const totalTicks = Math.max(50, Math.round(50 * recipe.timeCost))
// 基准：50 ticks = 1 游戏小时（与采集系统对齐）
```

### 2. 制造检查
- 互斥状态检查（isCrafting / isTraveling / isGathering）
- 背包容量检查
- 科技解锁检查（requiredScience）
- 材料数量检查

### 3. 场景
- **铁匠铺**（SmithScene）: 制作武器、工具、装备
- **炼金台**（AlchemyScene）: 制作药水、食物

### 4. 配方列表（RecipeList + RecipeItem）
- 三态分组排序：可制作 → 材料不足 → 未解锁
- 每条配方展示：名称（ItemName）、耗时、材料需求（ItemName）、缺少材料提示、科技锁定提示（ItemName）
- 独立的【制作】按钮，可制作时主题色高亮，不可制作时灰色禁用
- 调试模式（`DEBUG_MODE = true`）下额外显示橙色【获得材料】按钮

### 5. 互斥行动工具函数（actionGuard.ts）
- 提取 `isActionBusy()` 工具函数，供 useTravel / useGathering / useCrafting 复用

---

## ✅ 已完成任务清单

| 任务 | 文件 | 说明 |
|------|------|------|
| 制造核心 Hook | `src/hooks/useCrafting.ts` | 前置检查 + 进度条定时器 + 材料扣除 |
| 配方列表组件 | `src/components/ui/RecipeList.tsx` | 三态分组 + 状态计算 |
| 配方条目组件 | `src/components/ui/RecipeItem.tsx` | 单条配方展示 + 制作按钮 + 调试按钮 |
| 铁匠铺场景 | `src/components/scenes/SmithScene.tsx` | 锻造类配方 |
| 炼金台场景 | `src/components/scenes/AlchemyScene.tsx` | 炼金类配方 |
| 互斥检查工具 | `src/utils/actionGuard.ts` | `isActionBusy()` 函数 |
| 调试模式常量 | `src/constants/game.ts` | `DEBUG_MODE = true` |
| 物品类型标签 | `src/constants/labels.ts` | `ITEM_TYPE_LABEL: Record<ItemType, string>`，覆盖全部类型 |
| ItemName 组件 | `src/components/ItemName.tsx` | 通用物品名称展示，带 ItemTooltip 浮窗 |
| ItemTooltip 增强 | `src/components/ItemTooltip.tsx` | 名称 + 类型同行展示（浮窗顶部） |
| Store 扩展 | `src/stores/gameStore.ts` | `isCrafting`、`craftProgress`、`unlockedSciences`、4 个 action |
| 场景路由扩展 | `src/components/scenes/SceneRouter.tsx` | 制造进度条覆盖层 + smith/alchemy 路由注册 |
| 城镇场景扩展 | `src/components/scenes/TownScene.tsx` | 新增铁匠铺/炼金台入口按钮 |
| 互斥检查扩展 | `src/hooks/useTravel.ts` | 出发前增加 `isCrafting` 检查 |
| 互斥检查扩展 | `src/hooks/useGathering.ts` | 采集前增加 `isCrafting` 检查 |
| 物品数据重构 | `src/data/items.ts` | 物品 `type` 字段全量迁移为 `ItemType` 枚举 |
| 类型扩展 | `src/types/game.ts` | 新增科技树相关 `ItemType` 枚举值（20 个科技节点） |

---

## ✅ 验收标准

- [x] 能查看配方列表（三态分组：可制作 / 材料不足 / 未解锁）
- [x] 能开始制作物品（点击【制作】按钮）
- [x] 制作时有进度显示（进度条覆盖层）
- [x] 制作完成后自动放入背包
- [x] 材料不足时提示（列出缺少的材料和数量）
- [x] 科技锁定时提示（显示所需科技名称）
- [x] 制造/移动/采集三者完全互斥
- [x] 调试模式下可一键获得配方所需材料

---

## 🔧 遗留问题 / 后续计划

| 问题 | 说明 | 优先级 |
|------|------|--------|
| 科技台未实现 | `unlockedSciences` 始终为空，所有 `requiredScience` 配方均被锁定 | M4 后续 |
| 魔法台未实现 | `magic` 类配方暂无对应场景 | M4 后续 |
| 制造取消功能 | 进度条期间无法中途取消制造 | 待评估 |

---

**查看详细时间表:** [../timeline.md](../timeline.md)

*里程碑文档 v2.0 | M4 | 2026-03-18 更新*
