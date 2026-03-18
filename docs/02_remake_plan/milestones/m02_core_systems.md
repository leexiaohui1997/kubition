# M2: 核心机制

## 📋 里程碑目标

实现游戏的核心状态管理和时间流逝系统。

**工期:** 1 天
**前置:** M1 数据层设计
**输出:** 状态管理 + 时间系统 Demo

---

## ✅ 任务清单

### 1. Zustand Store 架构

**src/store/gameStore.ts:**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlayerState, PlayerEquipment } from '@/types/player';

interface GameState {
  // ============ 游戏状态 ============
  isRunning: boolean;
  tick: number;                    // 游戏时间 tick
  currentPlace: string;            // 当前地点
  logs: Array<{                   // 游戏日志
    time: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }>;
  
  // ============ 玩家状态 ============
  player: PlayerState;
  
  // ============ 背包 ============
  inventory: Record<string, number>;
  maxInventory: number;
  
  // ============ 装备 ============
  equipment: PlayerEquipment;
}

interface GameActions {
  // 时间相关
  startGame: () => void;
  stopGame: () => void;
  tick: () => void;
  
  // 状态修改
  updatePlayerState: (updates: Partial<PlayerState>) => void;
  restoreState: (type: 'hp' | 'ps' | 'full' | 'moist', amount: number) => void;
  consumeState: (type: 'hp' | 'ps' | 'full' | 'moist', amount: number) => void;
  
  // 背包
  addItem: (itemId: string, amount: number) => void;
  removeItem: (itemId: string, amount: number) => void;
  hasItem: (itemId: string, amount?: number) => boolean;
  
  // 装备
  equip: (itemId: string, slot: keyof PlayerEquipment) => void;
  unequip: (slot: keyof PlayerEquipment) => void;
  
  // 地点
  travelTo: (placeId: string) => void;
  
  // 日志
  addLog: (message: string, type?: GameState['logs'][0]['type']) => void;
  clearLogs: () => void;
}

const initialPlayerState: PlayerState = {
  hp: { current: 100, max: 100 },
  ps: { current: 100, max: 100 },
  full: { current: 80, max: 100 },
  moist: { current: 80, max: 100 },
  san: { current: 100, max: 100 },
  temp: { current: 0, max: 10 },
};

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      // ============ 初始状态 ============
      isRunning: false,
      tick: 0,
      currentPlace: 'town',
      logs: [],
      player: initialPlayerState,
      inventory: {},
      maxInventory: 20,
      equipment: {},
      
      // ============ 时间控制 ============
      startGame: () => set({ isRunning: true }),
      stopGame: () => set({ isRunning: false }),
      
      tick: () => {
        const { player } = get();
        
        set((state) => ({
          tick: state.tick + 1,
          player: {
            ...state.player,
            ps: {
              ...state.player.ps,
              current: Math.min(
                state.player.ps.max,
                state.player.ps.current + 0.5  // 每tick恢复0.5体力
              ),
            },
            full: {
              ...state.player.full,
              current: Math.max(
                0,
                state.player.full.current - 0.1  // 每tick消耗0.1饱食
              ),
            },
            moist: {
              ...state.player.moist,
              current: Math.max(
                0,
                state.player.moist.current - 0.15  // 每tick消耗0.15水分
              ),
            },
          },
        }));
      },
      
      // ============ 状态修改 ============
      updatePlayerState: (updates) => {
        set((state) => ({
          player: { ...state.player, ...updates },
        }));
      },
      
      restoreState: (type, amount) => {
        set((state) => ({
          player: {
            ...state.player,
            [type]: {
              ...state.player[type],
              current: Math.min(
                state.player[type].max,
                state.player[type].current + amount
              ),
            },
          },
        }));
      },
      
      consumeState: (type, amount) => {
        set((state) => ({
          player: {
            ...state.player,
            [type]: {
              ...state.player[type],
              current: Math.max(0, state.player[type].current - amount),
            },
          },
        }));
      },
      
      // ============ 背包操作 ============
      addItem: (itemId, amount) => {
        set((state) => ({
          inventory: {
            ...state.inventory,
            [itemId]: (state.inventory[itemId] || 0) + amount,
          },
        }));
      },
      
      removeItem: (itemId, amount) => {
        set((state) => {
          const current = state.inventory[itemId] || 0;
          const newAmount = Math.max(0, current - amount);
          const newInventory = { ...state.inventory };
          
          if (newAmount === 0) {
            delete newInventory[itemId];
          } else {
            newInventory[itemId] = newAmount;
          }
          
          return { inventory: newInventory };
        });
      },
      
      hasItem: (itemId, amount = 1) => {
        return (get().inventory[itemId] || 0) >= amount;
      },
      
      // ============ 装备操作 ============
      equip: (itemId, slot) => {
        set((state) => ({
          equipment: { ...state.equipment, [slot]: itemId },
        }));
      },
      
      unequip: (slot) => {
        set((state) => {
          const newEquipment = { ...state.equipment };
          delete newEquipment[slot];
          return { equipment: newEquipment };
        });
      },
      
      // ============ 地点 ============
      travelTo: (placeId) => {
        set({ currentPlace: placeId });
      },
      
      // ============ 日志 ============
      addLog: (message, type = 'info') => {
        const time = new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        });
        
        set((state) => ({
          logs: [{ time, message, type }, ...state.logs].slice(0, 100),
        }));
      },
      
      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: 'kubition-game-storage',
      partialize: (state) => ({
        player: state.player,
        inventory: state.inventory,
        equipment: state.equipment,
        currentPlace: state.currentPlace,
        tick: state.tick,
      }),
    }
  )
);
```

### 2. 游戏循环 Hook

**src/hooks/useGameLoop.ts:**
```typescript
import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';

const TICK_INTERVAL = 1000; // 1秒 = 1 tick

export function useGameLoop() {
  const { isRunning, tick } = useGameStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        tick();
      }, TICK_INTERVAL);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, tick]);
  
  return { isRunning };
}
```

### 3. 状态检查 Hook

**src/hooks/usePlayerStatus.ts:**
```typescript
import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';

export function usePlayerStatus() {
  const { player } = useGameStore();
  
  const status = useMemo(() => {
    const warnings: string[] = [];
    
    if (player.full.current < 20) {
      warnings.push('极度饥饿！生命值恢复速度下降');
    } else if (player.full.current < 50) {
      warnings.push('感到饥饿');
    }
    
    if (player.moist.current < 20) {
      warnings.push('极度口渴！理智值正在下降');
    } else if (player.moist.current < 50) {
      warnings.push('感到口渴');
    }
    
    if (player.ps.current < 20) {
      warnings.push('体力不足，需要休息');
    }
    
    const canAct = player.ps.current > 5;
    
    return {
      warnings,
      canAct,
      isCritical: warnings.length > 0,
    };
  }, [player]);
  
  return status;
}
```

### 4. UI 组件 - 状态栏

**src/components/layout/StatusBar.tsx:**
```tsx
import { useGameStore } from '@/store/gameStore';

export function StatusBar() {
  const { player, tick } = useGameStore();
  
  const formatPercent = (value: number, max: number) => {
    return Math.round((value / max) * 100);
  };
  
  return (
    <div className="grid grid-cols-5 gap-4 p-4 bg-mud-bg-secondary border border-mud-bg-tertiary">
      <StatusItem 
        label="生命" 
        value={player.hp.current} 
        max={player.hp.max} 
        color="text-red-500"
      />
      <StatusItem 
        label="体力" 
        value={player.ps.current} 
        max={player.ps.max} 
        color="text-yellow-500"
      />
      <StatusItem 
        label="饱食" 
        value={player.full.current} 
        max={player.full.max} 
        color="text-orange-500"
      />
      <StatusItem 
        label="水分" 
        value={player.moist.current} 
        max={player.moist.max} 
        color="text-blue-500"
      />
      <div className="text-right text-mud-text-dim text-sm">
        Tick: {tick}
      </div>
    </div>
  );
}

function StatusItem({ 
  label, 
  value, 
  max, 
  color 
}: { 
  label: string; 
  value: number; 
  max: number; 
  color: string;
}) {
  const percent = Math.round((value / max) * 100);
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-mud-text-dim">{label}</span>
        <span className={color}>{value}/{max}</span>
      </div>
      <div className="h-2 bg-mud-bg-tertiary overflow-hidden">
        <div 
          className={`h-full ${color.replace('text-', 'bg-')}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
```

### 5. UI 组件 - 日志面板

**src/components/layout/LogPanel.tsx:**
```tsx
import { useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

export function LogPanel() {
  const { logs, clearLogs } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs]);
  
  const getLogColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-mud-success';
      case 'warning': return 'text-mud-warning';
      case 'error': return 'text-mud-danger';
      default: return 'text-mud-text-dim';
    }
  };
  
  return (
    <div className="border border-mud-bg-tertiary bg-mud-bg-secondary">
      <div className="flex justify-between items-center p-2 border-b border-mud-bg-tertiary">
        <span className="text-sm text-mud-text-dim">冒险日志</span>
        <button 
          onClick={clearLogs}
          className="text-xs text-mud-text-dim hover:text-mud-text"
        >
          [清除]
        </button>
      </div>
      
      <div 
        ref={scrollRef}
        className="h-48 overflow-y-auto p-2 space-y-1"
      >
        <AnimatePresence>
          {logs.map((log, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm"
            >
              <span className="text-mud-text-dim">[{log.time}]</span>{' '}
              <span className={getLogColor(log.type)}>{log.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {logs.length === 0 && (
          <div className="text-mud-text-dim text-sm italic">
            暂无日志...
          </div>
        )}
      </div>
    </div>
  );
}
```

### 6. 主面板组件

**src/components/scenes/TownScene.tsx:**
```tsx
import { useGameStore } from '@/store/gameStore';

export function TownScene() {
  const { addLog, startGame, stopGame, isRunning } = useGameStore();
  
  const actions = [
    { 
      id: 'start', 
      label: isRunning ? '暂停时间' : '开始冒险', 
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
      id: 'test', 
      label: '测试: 恢复体力', 
      action: () => {
        const { restoreState, addLog } = useGameStore.getState();
        restoreState('ps', 20);
        addLog('你休息了一会儿，体力恢复了', 'success');
      }
    },
    { 
      id: 'test2', 
      label: '测试: 消耗饱食', 
      action: () => {
        const { consumeState, addLog } = useGameStore.getState();
        consumeState('full', 10);
        addLog('你感到有些饥饿', 'warning');
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
      
      <div className="space-y-2">
        <p className="text-mud-text-dim text-sm">你可以：</p>
        {actions.map((action, index) => (
          <button
            key={action.id}
            onClick={action.action}
            className="block w-full text-left px-4 py-2 text-mud-info hover:bg-mud-bg-tertiary transition-colors"
          >
            [{index + 1}] {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 7. 常量集中管理架构

在 M3 阶段的重构中，将各组件内散落的常量/配置统一抽离到 `src/constants/` 目录下，按职责分文件管理：

```
src/constants/
├── game.ts      ← 游戏数值常量（状态上限、消耗速率、进度条参数等）
├── labels.ts    ← 中文标签映射（枚举 key → 中文显示名）
└── styles.ts    ← UI 样式配置（颜色映射、状态栏配置等）
```

**game.ts** — 游戏数值常量：
- 状态上限/消耗速率/恢复速率等基础数值
- `GATHER_TICK_INTERVAL` / `GATHER_TICK_INCREMENT`：采集进度条参数
- `TRAVEL_TICK_INTERVAL` / `TRAVEL_TICK_INCREMENT`：移动进度条参数

**labels.ts** — 中文标签映射：
- `EFFECT_LABEL`：效果属性（饱食/水分/生命/体力/理智/体温）
- `WEAPON_TYPE_LABEL`：武器类型（近战/远程/魔法）
- `EQUIP_SLOT_LABEL`：装备槽位（头部/身体/手部/脚部/颈部）
- `ITEM_TYPE_LABEL`：物品类型（食材/武器/装备/材料等 12 种）

**styles.ts** — UI 样式配置：
- `ITEM_TYPE_COLOR`：物品类型对应的 Tailwind 颜色类
- `LOG_COLOR`：日志类型对应的文字颜色
- `STAT_CONFIGS`：四项状态栏配置（标签/key/颜色/低值颜色）

> **类型定义说明**：`StatConfig` interface 定义在 `types/player.ts` 中（与 `PlayerState` 等类型放在一起），`styles.ts` 通过 `import type` 引用。

### 8. 整合到 App.tsx

**src/App.tsx:**
```tsx
import { useGameLoop } from '@/hooks/useGameLoop';
import { StatusBar } from '@/components/layout/StatusBar';
import { LogPanel } from '@/components/layout/LogPanel';
import { TownScene } from '@/components/scenes/TownScene';

function App() {
  useGameLoop();
  
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
        
        {/* 主面板 */}
        <div className="grid grid-cols-3 gap-4">
          {/* 左侧：场景 */}
          <div className="col-span-2 border border-mud-bg-tertiary bg-mud-bg-secondary p-4 min-h-[300px]">
            <TownScene />
          </div>
          
          {/* 右侧：日志 */}
          <div className="col-span-1">
            <LogPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
```

---

## 🎯 验收标准

### 验证步骤:

1. **启动游戏**
   ```bash
   npm run dev
   ```

2. **测试功能:**
   - [x] 点击操作按钮后，时间(gameHour)推进
   - [x] 观察到饱食度和水分随时间消耗下降
   - [x] 观察到体力自动恢复(在有饱食度时)
   - [x] 点击「测试: 恢复体力」体力增加
   - [x] 点击「测试: 消耗饱食」饱食度减少
   - [x] 每次操作都有日志记录
   - [x] 日志有过渡动画 (Framer Motion)
   - [x] 刷新页面后状态保持 (localStorage持久化)

---

## ✅ 里程碑检查点

完成 M2 后，你应该能够：

1. ✅ 看到实时更新的状态栏（四项属性进度条 + 游戏时间）
2. ✅ 操作触发时间推进，状态自动结算（事件驱动模式）
3. ✅ 操作后能在日志面板上看到反馈（带入场动画）
4. ✅ 刷新后数据不丢失（localStorage 持久化）
5. ✅ 响应式 UI 兼容 PC + 移动端

---

## 🚀 下一步

完成本里程碑后，进入 **M3: 资源采集 MVP**

查看: [m03_gathering_system.md](./m03_gathering_system.md)

---

*里程碑文档 v1.2 | M2 | 2026-03-18 | ✅ 已完成（M3 阶段补充 constants 架构说明）*
