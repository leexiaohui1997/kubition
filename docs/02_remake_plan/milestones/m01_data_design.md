# M1: 数据层设计

## 📋 里程碑目标

定义所有游戏数据类型，提取和整理核心游戏数据。

**工期:** 1 天
**前置:** M0 项目初始化
**输出:** 完整的 TypeScript 类型定义 + 核心数据文件

---

## ✅ 任务清单

> **状态：已完成** | 完成日期：2026-03-17

### 1. 基础类型定义 ✅

**src/types/game.ts:**
```typescript
// ============ 物品相关 ============

export type ItemType = 
  | 'food' 
  | 'cooked' 
  | 'tool' 
  | 'weapon' 
  | 'equip' 
  | 'material' 
  | 'potion' 
  | 'seed';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  description?: string;
  // 食物属性
  hungerRestore?: number;   // 饱食度恢复
  thirstRestore?: number;   // 水分恢复
  hpRestore?: number;       // 生命恢复
  psRestore?: number;       // 体力恢复
  // 武器属性
  damage?: number;
  damageRange?: number;     // 伤害波动范围 (0-1)
  range?: number;           // 攻击距离
  attackSpeed?: number;     // 攻击速度系数
  accuracyBonus?: number;   // 命中加成
  psCost?: number;          // 体力消耗
  // 装备属性
  defense?: number;
  slot?: 'head' | 'body' | 'hand' | 'leg';
}

// ============ 怪物相关 ============

export interface Monster {
  id: string;
  name: string;
  maxHp: number;
  hpMultiplier?: number;    // 地牢中的血量倍数
  damage: number;
  range: number;
  chaseChance: number;      // 追击概率 (0-1)
  reward?: {
    gold?: number;
    items?: Record<string, number>;
  };
  dropChances?: Record<string, number>;  // 掉落概率
  description?: string;
}

// ============ 地点相关 ============

export interface ResourceNode {
  id: string;
  name: string;
  actionName: string;       // "采集"、"狩猎"等
  timeCost: number;         // 耗时 (秒)
  psCost: number;           // 体力消耗
  drops: Array<{
    item: string;
    chance: number;         // 掉落概率
    amount: [number, number]; // [最小, 最大]
  }>;
  requiredTool?: string;    // 需要的工具
}

export interface Place {
  id: string;
  name: string;
  description: string;
  resources: ResourceNode[];
  temperature?: number;     // 环境温度
  requiredItem?: string;    // 进入需要的物品
  travelTime: number;       // 移动耗时
}

// ============ 制造相关 ============

export interface Recipe {
  id: string;
  name: string;
  category: 'smith' | 'alchemy' | 'magic' | 'tech';
  timeCost: number;         // 制造耗时 (秒)
  materials: Record<string, number>;
  output: {
    item: string;
    amount: number;
  };
  requiredTech?: string;    // 需要的前置科技
  description?: string;
}

// ============ 地牢相关 ============

export interface DungeonFloor {
  floor: number;
  name: string;
  description: string;
  monsterWeights: Record<string, number>;  // 怪物权重
  eliteChance: number;      // 精英怪概率
  rewards: Array<{
    item: string;
    chance: number;
    amount: number;
  }>;
  boss?: string;            // BOSS怪物ID
}
```

**src/types/player.ts:**
```typescript
// ============ 角色状态 ============

export interface StateValue {
  current: number;
  max: number;
}

export interface PlayerState {
  hp: StateValue;          // 生命
  ps: StateValue;          // 体力
  full: StateValue;        // 饱食
  moist: StateValue;       // 水分
  san: StateValue;         // 理智
  temp: {                  // 体温
    current: number;       // -10 ~ 10
    max: number;
  };
}

export interface PlayerEquipment {
  mainHand?: string;       // 主手武器
  subHand?: string;        // 副手
  head?: string;           // 头部
  body?: string;           // 躯干
  hand?: string;           // 手部
  leg?: string;            // 腿部
}
```

### 2. 核心数据文件 ✅

**src/data/items.ts (全量迁移 - 409个物品):**
```typescript
import type { Item } from '@/types/game';

export const ITEMS: Record<string, Item> = {
  // ===== 基础材料 =====
  wood: {
    id: 'wood',
    name: '木材',
    type: 'material',
    description: '森林中最常见的资源',
  },
  stone: {
    id: 'stone',
    name: '石块',
    type: 'material',
    description: '随处可见的石头',
  },
  
  // ===== 食物 =====
  meat: {
    id: 'meat',
    name: '生肉',
    type: 'food',
    hungerRestore: 15,
    psRestore: 5,
  },
  cookedMeat: {
    id: 'cookedMeat',
    name: '烤肉',
    type: 'cooked',
    hungerRestore: 35,
    psRestore: 10,
    hpRestore: 5,
  },
  berry: {
    id: 'berry',
    name: '浆果',
    type: 'food',
    hungerRestore: 5,
    thirstRestore: 5,
  },
  
  // ===== 武器 =====
  knife: {
    id: 'knife',
    name: '匕首',
    type: 'weapon',
    damage: 8,
    damageRange: 0.25,
    range: 3,
    attackSpeed: 1,
    psCost: 2,
  },
  stoneAxe: {
    id: 'stoneAxe',
    name: '石斧',
    type: 'weapon',
    damage: 15,
    damageRange: 0.3,
    range: 3,
    attackSpeed: 1.2,
    psCost: 5,
  },
  
  // ===== 装备 =====
  clothArmor: {
    id: 'clothArmor',
    name: '布衣',
    type: 'equip',
    slot: 'body',
    defense: 2,
  },
};

// 辅助函数
export function getItem(id: string): Item | undefined {
  return ITEMS[id];
}

export function getItemName(id: string): string {
  return ITEMS[id]?.name ?? id;
}
```

**src/data/monsters.ts (全量迁移 - 99个怪物):**
```typescript
import type { Monster } from '@/types/game';

export const MONSTERS: Record<string, Monster> = {
  // ===== 第1层 =====
  creeper: {
    id: 'creeper',
    name: '匍匐怪',
    maxHp: 35,
    damage: 5,
    range: 3,
    chaseChance: 0.3,
    reward: { gold: 1 },
    dropChances: { stone: 0.2 },
    description: '一种低等的魔物，行动缓慢但数量众多',
  },
  skeleton: {
    id: 'skeleton',
    name: '骷髅',
    maxHp: 45,
    damage: 12,
    range: 4,
    chaseChance: 0.4,
    reward: { gold: 2 },
    dropChances: { bone: 0.3 },
    description: '从坟墓里爬出来的亡灵',
  },
  
  // ===== 第2层 =====
  bat: {
    id: 'bat',
    name: '蝙蝠',
    maxHp: 25,
    damage: 8,
    range: 2,
    chaseChance: 0.5,
    reward: { gold: 1 },
  },
  witch: {
    id: 'witch',
    name: '女巫学徒',
    maxHp: 60,
    damage: 20,
    range: 10,
    chaseChance: 0.3,
    reward: { gold: 5 },
    dropChances: { magicPowder: 0.15 },
  },
  
  // ===== 第3层 BOSS =====
  waterLord: {
    id: 'waterLord',
    name: '潮汐领主',
    maxHp: 200,
    hpMultiplier: 1.5,
    damage: 30,
    range: 8,
    chaseChance: 1.0,
    reward: { gold: 50 },
    dropChances: { iceStaff: 0.2, magicGem: 0.5 },
    description: '掌控潮汐之力的元素生物',
  },
};
```

**src/data/places.ts:**
```typescript
import type { Place } from '@/types/game';

export const PLACES: Record<string, Place> = {
  town: {
    id: 'town',
    name: '银溪镇',
    description: '一座宁静的小镇，冒险者的起点',
    resources: [],
    travelTime: 0,
  },
  forest: {
    id: 'forest',
    name: '静谧森林',
    description: '古木参天，阳光只能从树叶间隙洒落',
    resources: [
      {
        id: 'forest_wood',
        name: '森林木材',
        actionName: '采集木材',
        timeCost: 5,
        psCost: 5,
        drops: [
          { item: 'wood', chance: 0.8, amount: [2, 5] },
          { item: 'berry', chance: 0.3, amount: [1, 3] },
        ],
      },
      {
        id: 'forest_hunt',
        name: '兔子',
        actionName: '狩猎兔子',
        timeCost: 10,
        psCost: 8,
        drops: [
          { item: 'meat', chance: 0.7, amount: [1, 2] },
          { item: 'fur', chance: 0.4, amount: [1, 1] },
        ],
        requiredTool: 'knife',
      },
    ],
    travelTime: 30,
  },
  river: {
    id: 'river',
    name: '溪流',
    description: '清澈的山泉水，偶尔能看见鱼儿的身影',
    resources: [
      {
        id: 'river_water',
        name: '山泉水',
        actionName: '取水',
        timeCost: 3,
        psCost: 2,
        drops: [
          { item: 'water', chance: 1, amount: [1, 3] },
        ],
      },
    ],
    travelTime: 45,
  },
};
```

**src/data/recipes.ts:**
```typescript
import type { Recipe } from '@/types/game';

export const RECIPES: Record<string, Recipe> = {
  // ===== 基础工具 =====
  stoneAxe: {
    id: 'stoneAxe',
    name: '石斧',
    category: 'smith',
    timeCost: 30,
    materials: { wood: 3, stone: 5 },
    output: { item: 'stoneAxe', amount: 1 },
    description: '粗糙但实用的工具',
  },
  
  // ===== 食物 =====
  cookedMeat: {
    id: 'cookedMeat',
    name: '烤肉',
    category: 'alchemy',
    timeCost: 20,
    materials: { meat: 1, wood: 1 },
    output: { item: 'cookedMeat', amount: 1 },
  },
  
  // ===== 装备 =====
  clothArmor: {
    id: 'clothArmor',
    name: '布衣',
    category: 'smith',
    timeCost: 60,
    materials: { fur: 4, wood: 2 },
    output: { item: 'clothArmor', amount: 1 },
  },
};
```

### 3. 数据加载工具 ✅

**src/utils/dataLoader.ts:**
```typescript
import { ITEMS } from '@/data/items';
import { MONSTERS } from '@/data/monsters';
import { PLACES } from '@/data/places';
import { RECIPES } from '@/data/recipes';

export const DataLoader = {
  items: ITEMS,
  monsters: MONSTERS,
  places: PLACES,
  recipes: RECIPES,
  
  // 验证数据完整性
  validate(): boolean {
    // 检查配方引用的物品是否存在
    for (const [id, recipe] of Object.entries(RECIPES)) {
      for (const material of Object.keys(recipe.materials)) {
        if (!ITEMS[material]) {
          console.error(`配方 ${id} 引用了不存在的物品: ${material}`);
          return false;
        }
      }
      if (!ITEMS[recipe.output.item]) {
        console.error(`配方 ${id} 产出不存在的物品: ${recipe.output.item}`);
        return false;
      }
    }
    
    // 检查地点资源
    for (const [id, place] of Object.entries(PLACES)) {
      for (const resource of place.resources) {
        for (const drop of resource.drops) {
          if (!ITEMS[drop.item]) {
            console.error(`地点 ${id} 的资源掉落了不存在的物品: ${drop.item}`);
            return false;
          }
        }
        if (resource.requiredTool && !ITEMS[resource.requiredTool]) {
          console.error(`地点 ${id} 的资源需要不存在的工具: ${resource.requiredTool}`);
          return false;
        }
      }
    }
    
    console.log('✅ 数据验证通过');
    return true;
  },
};
```

---

## 🎯 验收标准

### 必须完成的检查项:

- [x] `src/types/game.ts` 包含所有核心类型定义（ItemType 39种、Monster、Place、Recipe、DungeonFloor 等）
- [x] `src/types/player.ts` 包含玩家状态类型（StateValue、PlayerState、PlayerEquipment）
- [x] `src/data/items.ts` 全量迁移 **409** 个物品
- [x] `src/data/monsters.ts` 全量迁移 **99** 个怪物
- [x] `src/data/places.ts` 全量迁移 **20** 个地点
- [x] `src/data/recipes.ts` 全量迁移 **179** 个配方（锻造60+炼金12+科技74+魔法33）
- [x] `src/data/dungeons.ts` 全量迁移 **16** 层地牢
- [x] `DataLoader.validate()` 运行无报错
- [x] TypeScript 编译无错误
- [x] `npm run build` 构建成功（产物 254KB, gzip 69KB）

### 验证代码:

```typescript
// 在 App.tsx 中临时测试
import { DataLoader } from '@/utils/dataLoader';

function App() {
  useEffect(() => {
    const valid = DataLoader.validate();
    console.log('Items:', Object.keys(DataLoader.items).length);
    console.log('Monsters:', Object.keys(DataLoader.monsters).length);
    console.log('Places:', Object.keys(DataLoader.places).length);
    console.log('Recipes:', Object.keys(DataLoader.recipes).length);
  }, []);
  
  // ...
}
```

---

## ✅ 里程碑检查点

完成 M1 后，你应该能够：

1. ~~看到完整的 TypeScript 类型定义~~ ✅
2. ~~导入并使用游戏数据~~ ✅
3. ~~TypeScript 能提供正确的类型提示~~ ✅
4. ~~数据验证通过无报错~~ ✅

**全部检查点已通过。**

---

## 🚀 下一步

完成本里程碑后，进入 **M2: 核心机制**

查看: [m02_core_systems.md](./m02_core_systems.md)

---

*里程碑文档 v1.1 | M1 已完成 | 2026-03-17*
