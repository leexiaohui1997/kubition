# M4: 制造系统

## 📋 里程碑目标

实现铁匠铺和炼金台，玩家可以制作工具和装备。

**工期:** 2 天
**前置:** M3 资源采集
**输出:** 铁匠铺 + 炼金台 Demo

---

## ✅ 核心功能

### 1. 制造队列系统
```typescript
interface CraftingQueueItem {
  recipeId: string;
  startTime: number;
  duration: number;
  status: 'pending' | 'crafting' | 'completed';
}
```

### 2. 制造检查
- 材料是否足够
- 是否已解锁配方
- 背包是否有空间

### 3. 场景
- **铁匠铺**: 制作武器、工具、装备
- **炼金台**: 制作药水、食物

---

## 🎯 验收标准

- [ ] 能查看配方列表
- [ ] 能开始制作物品
- [ ] 制作时有进度显示
- [ ] 制作完成后自动放入背包
- [ ] 材料不足时提示

---

**查看详细时间表:** [../timeline.md](../timeline.md)

*里程碑文档 v1.0 | M4 | 2026-03-17*
