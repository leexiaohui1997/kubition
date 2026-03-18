# M3: 资源采集 MVP

## 📋 里程碑目标

实现资源采集系统和背包系统，玩家可以探索不同地点采集资源。

**工期:** 2 天
**前置:** M2 核心机制
**输出:** 可采集资源 + 背包系统 Demo

---

## ✅ 任务清单

### 1. 场景切换系统

> **实际实现说明：** 场景切换没有使用独立的 sceneStore，而是整合进了 `gameStore.ts`。
> 地点状态（`currentPlace`、`isTraveling`、`travelProgress`、`travelTarget`）统一在 `stores/gameStore.ts` 中管理。
> 移动进度条逻辑封装在 `hooks/useTravel.ts` Hook 中，TICK 参数集中在 `constants/game.ts`。

**设计参考 (src/store/sceneStore.ts):**
```typescript
import { create } from 'zustand';
import { PLACES } from '@/data/places';
import type { Place } from '@/types/game';

interface SceneState {
  currentPlace: string;
  isTraveling: boolean;
  travelProgress: number;
}

interface SceneActions {
  travelTo: (placeId: string) => Promise<void>;
  getCurrentPlace: () => Place;
}

export const useSceneStore = create<SceneState & SceneActions>()(
  (set, get) => ({
    currentPlace: 'town',
    isTraveling: false,
    travelProgress: 0,
    
    travelTo: async (placeId) => {
      if (get().isTraveling) return;
      
      const targetPlace = PLACES[placeId];
      if (!targetPlace) return;
      
      set({ isTraveling: true, travelProgress: 0 });
      
      // 模拟移动过程
      const travelTime = targetPlace.travelTime * 100; // 加速测试
      const steps = 10;
      
      for (let i = 1; i <= steps; i++) {
        await new Promise(r => setTimeout(r, travelTime / steps));
        set({ travelProgress: (i / steps) * 100 });
      }
      
      set({ 
        currentPlace: placeId, 
        isTraveling: false,
        travelProgress: 0 
      });
    },
    
    getCurrentPlace: () => PLACES[get().currentPlace],
  })
);
```

### 2. 采集系统实现

> **实际实现说明：** 采集系统使用纯函数 + Hook 模式实现，而非 Class 模式。
> - `systems/GatheringSystem.ts` — 纯函数：`checkGatherRequirements`、`executeGather`、`useItem`
> - `hooks/useGathering.ts` — 采集进度 Hook，TICK 参数从 `constants/game.ts` 导入
> - 常量抽离：`GATHER_TICK_INTERVAL`、`GATHER_TICK_INCREMENT` → `constants/game.ts`

**设计参考 (src/systems/GatheringSystem.ts):**
```typescript
import { useGameStore } from '@/store/gameStore';
import { useSceneStore } from '@/store/sceneStore';
import type { ResourceNode } from '@/types/game';

export class GatheringSystem {
  static async gather(resource: ResourceNode): Promise<boolean> {
    const gameStore = useGameStore.getState();
    const { addLog, consumeState, addItem, hasItem } = gameStore;
    
    // 检查体力
    if (gameStore.player.ps.current < resource.psCost) {
      addLog('体力不足，无法采集！', 'error');
      return false;
    }
    
    // 检查工具
    if (resource.requiredTool && !hasItem(resource.requiredTool)) {
      addLog(`需要 ${resource.requiredTool} 才能采集`, 'warning');
      return false;
    }
    
    // 消耗体力
    consumeState('ps', resource.psCost);
    addLog(`开始${resource.actionName}...`, 'info');
    
    // 模拟采集时间
    await new Promise(r => setTimeout(r, resource.timeCost * 200)); // 加速
    
    // 计算掉落
    const drops: Array<{ item: string; amount: number }> = [];
    for (const drop of resource.drops) {
      if (Math.random() < drop.chance) {
        const amount = Math.floor(
          Math.random() * (drop.amount[1] - drop.amount[0] + 1)
        ) + drop.amount[0];
        
        if (amount > 0) {
          drops.push({ item: drop.item, amount });
          addItem(drop.item, amount);
        }
      }
    }
    
    // 显示结果
    if (drops.length > 0) {
      const items = drops.map(d => `${d.item}x${d.amount}`).join(', ');
      addLog(`获得了: ${items}`, 'success');
    } else {
      addLog('运气不好，什么都没有找到...', 'warning');
    }
    
    return true;
  }
}
```

### 3. 背包组件

> **实际实现说明：** 背包系统实际实现与设计有以下差异：
> - 背包使用 `Modal` 通用弹层组件包裹（而非内嵌在侧边栏中），点击 `[I] 背包` 按钮弹出
> - `components/Inventory.tsx` — 纯内容组件 + `InventoryExtra` 标题栏额外信息组件
> - `components/Modal.tsx` — 通用弹层（遮罩层、ESC 关闭、入场动画）
> - `components/ItemTooltip.tsx` — 物品信息浮窗（hover 触发，手动计算定位 + Portal）
> - 使用 BetterScroll 提供列表滚动
> - 常量抽离：`ITEM_TYPE_LABEL` → `constants/labels.ts`，`ITEM_TYPE_COLOR` → `constants/styles.ts`

**设计参考 (src/components/ui/Inventory.tsx):**
```tsx
import { useGameStore } from '@/store/gameStore';
import { ITEMS } from '@/data/items';

export function Inventory() {
  const { inventory, maxInventory, removeItem, addLog } = useGameStore();
  
  const totalItems = Object.values(inventory).reduce((a, b) => a + b, 0);
  const usage = Math.round((totalItems / maxInventory) * 100);
  
  const handleUse = (itemId: string) => {
    const item = ITEMS[itemId];
    if (!item) return;
    
    // 使用食物
    if (item.type === 'food' || item.type === 'cooked') {
      if (item.hungerRestore) {
        useGameStore.getState().restoreState('full', item.hungerRestore);
      }
      if (item.psRestore) {
        useGameStore.getState().restoreState('ps', item.psRestore);
      }
      if (item.hpRestore) {
        useGameStore.getState().restoreState('hp', item.hpRestore);
      }
      
      removeItem(itemId, 1);
      useGameStore.getState().addLog(`使用了 ${item.name}`, 'success');
    }
  };
  
  return (
    <div className="border border-mud-bg-tertiary bg-mud-bg-secondary">
      <div className="p-2 border-b border-mud-bg-tertiary flex justify-between">
        <span className="text-sm text-mud-text-dim">背包</span>
        <span className={`text-sm ${usage > 90 ? 'text-red-500' : 'text-mud-text-dim'}`}>
          {totalItems}/{maxInventory}
        </span>
      </div>
      
      <div className="p-2 h-64 overflow-y-auto">
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(inventory).map(([itemId, amount]) => {
            const item = ITEMS[itemId];
            if (!item) return null;
            
            return (
              <button
                key={itemId}
                onClick={() => handleUse(itemId)}
                className="p-2 bg-mud-bg-tertiary hover:bg-mud-bg text-left text-sm transition-colors"
                title={item.name}
              >
                <div className="truncate">{item.name}</div>
                <div className="text-mud-text-dim">x{amount}</div>
                {(item.type === 'food' || item.type === 'cooked') && (
                  <span className="text-xs text-mud-success">[使用]</span>
                )}
              </button>
            );
          })}
        </div>
        
        {Object.keys(inventory).length === 0 && (
          <div className="text-center text-mud-text-dim py-10">
            背包是空的...
          </div>
        )}
      </div>
    </div>
  );
}
```

### 4. 森林场景

> **实际实现说明：** 森林场景使用 `useGathering` 和 `useTravel` Hook，
> 并增加了 `GenericScene` 通用场景组件，用于未注册的地点自动渲染。

**设计参考 (src/components/scenes/ForestScene.tsx):**
```tsx
import { GatheringSystem } from '@/systems/GatheringSystem';
import { useSceneStore } from '@/store/sceneStore';
import { PLACES } from '@/data/places';

export function ForestScene() {
  const { isTraveling, travelProgress, travelTo } = useSceneStore();
  const forest = PLACES['forest'];
  
  const handleGather = async (resourceId: string) => {
    const resource = forest.resources.find(r => r.id === resourceId);
    if (!resource) return;
    
    await GatheringSystem.gather(resource);
  };
  
  const handleTravel = async (placeId: string) => {
    await travelTo(placeId);
  };
  
  return (
    <div className="space-y-4">
      <div className="text-mud-text">
        <h2 className="text-xl font-bold mb-2">{forest.name}</h2>
        <p className="text-mud-text-dim">{forest.description}</p>
      </div>
      
      {/* 移动进度 */}
      {isTraveling && (
        <div className="border border-mud-bg-tertiary p-2">
          <p className="text-mud-text-dim text-sm mb-2">正在移动...</p>
          <div className="h-2 bg-mud-bg-tertiary">
            <div 
              className="h-full bg-mud-accent transition-all"
              style={{ width: `${travelProgress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* 采集选项 */}
      {!isTraveling && (
        <>
          <div className="space-y-2">
            <p className="text-mud-text-dim text-sm">你可以：</p>
            
            {forest.resources.map((resource, index) => (
              <button
                key={resource.id}
                onClick={() => handleGather(resource.id)}
                disabled={isTraveling}
                className="block w-full text-left px-4 py-2 text-mud-info hover:bg-mud-bg-tertiary transition-colors disabled:opacity-50"
              >
                [{index + 1}] {resource.actionName}
                <span className="text-mud-text-dim text-sm ml-2">
                  (-{resource.psCost}体力, {resource.timeCost}秒)
                </span>
              </button>
            ))}
          </div>
          
          {/* 移动选项 */}
          <div className="pt-4 border-t border-mud-bg-tertiary">
            <p className="text-mud-text-dim text-sm">前往：</p>
            <button
              onClick={() => handleTravel('town')}
              disabled={isTraveling}
              className="block w-full text-left px-4 py-2 text-mud-info hover:bg-mud-bg-tertiary"
            >
              [回] 返回银溪镇 ({PLACES['town'].travelTime}秒)
            </button>
            <button
              onClick={() => handleTravel('river')}
              disabled={isTraveling}
              className="block w-full text-left px-4 py-2 text-mud-info hover:bg-mud-bg-tertiary"
            >
              [溪] 前往溪流 ({PLACES['river'].travelTime}秒)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

### 5. 动态场景切换

> **实际实现说明：** SceneRouter 从 `gameStore` 读取状态（非独立 sceneStore），
> 同时集成了移动进度条和采集进度条的覆盖层显示。

**设计参考 (src/components/scenes/SceneRouter.tsx):**
```tsx
import { useSceneStore } from '@/store/sceneStore';
import { TownScene } from './TownScene';
import { ForestScene } from './ForestScene';

// 场景映射表
const SCENES: Record<string, React.ComponentType> = {
  town: TownScene,
  forest: ForestScene,
  // 更多场景...
};

export function SceneRouter() {
  const { currentPlace } = useSceneStore();
  
  const SceneComponent = SCENES[currentPlace] || TownScene;
  
  return (
    <div className="h-full">
      <SceneComponent />
    </div>
  );
}
```

### 6. 更新 App.tsx

> **实际实现说明：** 背包使用 Modal 弹层，而非切换侧边栏内容。
> 没有使用 `useGameLoop` Hook（时间由事件驱动推进）。

**设计参考 (src/App.tsx):**
```tsx
import { useGameLoop } from '@/hooks/useGameLoop';
import { StatusBar } from '@/components/layout/StatusBar';
import { LogPanel } from '@/components/layout/LogPanel';
import { Inventory } from '@/components/ui/Inventory';
import { SceneRouter } from '@/components/scenes/SceneRouter';
import { useState } from 'react';

function App() {
  useGameLoop();
  const [showInventory, setShowInventory] = useState(false);
  
  return (
    <div className="min-h-screen p-4 bg-mud-bg">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* 标题 */}
        <header className="text-center py-4">
          <h1 className="text-3xl font-bold text-mud-accent">
            超苦逼冒险者
          </h1>
          <p className="text-mud-text-dim">MUD风格放置RPG - 复刻版</p>
        </header>
        
        {/* 状态栏 */}
        <StatusBar />
        
        {/* 快捷操作 */}
        <div className="flex gap-2">
          <button 
            onClick={() => setShowInventory(!showInventory)}
            className="px-4 py-2 border border-mud-info text-mud-info hover:bg-mud-info hover:text-white"
          >
            [I] 背包
          </button>
        </div>
        
        {/* 主内容 */}
        <div className="grid grid-cols-3 gap-4">
          {/* 左侧：场景 */}
          <div className="col-span-2 border border-mud-bg-tertiary bg-mud-bg-secondary p-4 min-h-[400px]">
            <SceneRouter />
          </div>
          
          {/* 右侧：日志/背包 */}
          <div className="col-span-1 space-y-4">
            {showInventory ? <Inventory /> : <LogPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
```

### 7. 更新城镇场景

**src/components/scenes/TownScene.tsx:**
```tsx
import { useGameStore } from '@/store/gameStore';
import { useSceneStore } from '@/store/sceneStore';

export function TownScene() {
  const { startGame, stopGame, isRunning, addLog } = useGameStore();
  const { isTraveling, travelTo } = useSceneStore();
  
  const actions = [
    { 
      id: 'toggle', 
      label: isRunning ? '暂停时间 [P]' : '开始时间 [P]', 
      action: () => {
        if (isRunning) {
          stopGame();
          addLog('时间暂停了...', 'info');
        } else {
          startGame();
          addLog('时间开始流逝...', 'success');
        }
      }
    },
    { 
      id: 'forest', 
      label: '前往静谧森林 [采集木材]', 
      action: async () => {
        addLog('你决定前往森林采集资源...', 'info');
        await travelTo('forest');
      }
    },
  ];
  
  return (
    <div className="space-y-4">
      <div className="text-mud-text">
        <h2 className="text-xl font-bold mb-2">银溪镇</h2>
        <p className="text-mud-text-dim">
          一座宁静的小镇，冒险者的起点。北风呼啸，街上行人寥寥。
        </p>
      </div>
      
      {isTraveling && (
        <div className="text-mud-info">正在移动中...</div>
      )}
      
      {!isTraveling && (
        <div className="space-y-2">
          <p className="text-mud-text-dim text-sm">你可以：</p>
          {actions.map((action, index) => (
            <button
              key={action.id}
              onClick={action.action}
              disabled={isTraveling}
              className="block w-full text-left px-4 py-2 text-mud-info hover:bg-mud-bg-tertiary transition-colors disabled:opacity-50"
            >
              [{index + 1}] {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 验收标准

### 验证功能:

1. **场景切换**
   - [x] 点击「前往静谧森林」能切换到森林场景
   - [x] 移动时有进度条显示
   - [x] 移动过程中不能进行其他操作

2. **资源采集**
   - [x] 在森林能「采集木材」
   - [x] 采集消耗体力和时间
   - [x] 采集结果随机（2-5个木材）
   - [x] 采集结果记录在日志中

3. **背包系统**
   - [x] 采集的物品出现在背包中
   - [x] 点击 [I] 能打开背包（Modal 弹层方式）
   - [x] 背包显示物品数量
   - [x] 背包有容量限制显示
   - [x] 物品信息浮窗（hover 显示详情）

4. **食物使用**
   - [x] 如果有「浆果」或「烤肉」可以食用
   - [x] 食用后恢复相应属性
   - [x] 食用后物品数量减少

---

## 🎮 MVP Demo 体验

完成 M3 后，玩家应该能：

```
1. 开始游戏，看到状态自动流逝
2. 前往森林采集木材和浆果
3. 食用浆果恢复饱食度
4. 查看背包中的物品
5. 返回城镇继续冒险
```

这是第一个可玩的里程碑！

---

## 🚀 下一步

完成本里程碑后，进入 **M4: 制造系统**

查看: [m04_craft_system.md](./m04_craft_system.md)

---

## 📝 实际实现中的重构说明

本里程碑完成过程中，对项目进行了一次常量/类型集中化重构，以提高可维护性：

### 新增的 `constants/` 文件

| 文件 | 用途 | 包含常量 |
|------|------|----------|
| `constants/labels.ts` | 中文标签映射 | `EFFECT_LABEL`、`WEAPON_TYPE_LABEL`、`EQUIP_SLOT_LABEL`、`ITEM_TYPE_LABEL` |
| `constants/styles.ts` | UI 样式映射 | `ITEM_TYPE_COLOR`、`LOG_COLOR`、`STAT_CONFIGS` |
| `constants/game.ts` (扩展) | 游戏数值 | 新增 `GATHER_TICK_*`、`TRAVEL_TICK_*` 进度条参数 |

### 类型定义调整

- `StatConfig` interface 从 `constants/styles.ts` → `types/player.ts`（类型定义归 types 目录）

### 新增组件

| 组件 | 文件 | 说明 |
|------|------|------|
| Modal | `components/Modal.tsx` | 通用弹层（遮罩 + ESC关闭 + 入场动画） |
| ItemTooltip | `components/ItemTooltip.tsx` | 物品详情浮窗（手动定位 + Portal 到 body） |
| GenericScene | `components/scenes/GenericScene.tsx` | 通用场景组件（未注册地点自动渲染） |

---

*里程碑文档 v1.1 | M3 | 2026-03-18 | ✅ 已完成*
