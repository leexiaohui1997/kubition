# M8: 任务系统

## 📋 里程碑目标

实现NPC对话和任务链系统。

**工期:** 2 天
**前置:** M7 探索系统
**输出:** NPC对话 + 任务链 Demo

---

## ✅ 核心功能

### 1. NPC系统
```typescript
interface NPC {
  id: string;
  name: string;
  dialogue: string[];
  quests: string[];
}
```

### 2. 任务结构
```typescript
interface Quest {
  id: string;
  name: string;
  description: string;
  requirements: Record<string, number>;
  rewards: Record<string, number>;
  nextQuest?: string;  // 任务链
}
```

### 3. 首个任务链
- 村长 → 剿灭盗贼 → 蛛魔之后 → 龙王

---

## 🎯 验收标准

- [ ] 能与NPC对话
- [ ] 能接受任务
- [ ] 任务进度追踪
- [ ] 完成任务获得奖励
- [ ] 任务链能连续触发

---

**查看详细时间表:** [../timeline.md](../timeline.md)

*里程碑文档 v1.0 | M8 | 2026-03-17*
