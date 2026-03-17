# M5: 战斗系统

## 📋 里程碑目标

实现回合制战斗引擎，玩家可以与怪物战斗。

**工期:** 2 天
**前置:** M4 制造系统
**输出:** 战斗引擎 Demo

---

## ✅ 核心功能

### 1. 战斗算法
```typescript
interface CombatResult {
  damage: number;
  isCritical: boolean;
  isHit: boolean;
}

// 命中计算
function calculateHit(attackerRange: number, defenderRange: number): boolean

// 伤害计算  
function calculateDamage(attacker: Combatant, weapon: Weapon): number

// 速度比较决定先手
function compareSpeed(a: Combatant, b: Combatant): number
```

### 2. 战斗选项
- [攻击] 使用装备武器攻击
- [使用物品] 使用药水/食物
- [逃跑] 有概率失败

### 3. 战斗日志
实时显示双方行动

---

## 🎯 验收标准

- [ ] 遭遇怪物进入战斗
- [ ] 可以攻击造成伤害
- [ ] 怪物会反击
- [ ] 战斗胜利获得奖励
- [ ] 可以逃跑

---

**查看详细时间表:** [../timeline.md](../timeline.md)

*里程碑文档 v1.0 | M5 | 2026-03-17*
