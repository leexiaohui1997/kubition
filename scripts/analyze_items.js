const fs = require('fs')
const path = require('path')

// 读取 items.ts 文件
const itemsPath = path.resolve(__dirname, '../kubition-remake/src/data/items.ts')
const docsDir = path.resolve(__dirname, '../docs')
const outputPath = path.join(docsDir, 'items-schema.md')

const content = fs.readFileSync(itemsPath, 'utf-8')

// 提取 ITEMS_RAW 对象内容（从第一个 { 到最后一个 }）
const rawBlockMatch = content.match(/const ITEMS_RAW[^=]+=\s*\{([\s\S]*)\}/)
if (!rawBlockMatch) {
  console.error('未找到 ITEMS_RAW 定义')
  process.exit(1)
}

// 用正则提取每个 item 的所有字段
const itemRegex = /(\w+):\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g

const fieldStats = {} // 字段名 -> { count, values: Set }
const typeValues = new Set()
const allItems = []

let match
while ((match = itemRegex.exec(content)) !== null) {
  const itemKey = match[1]
  const itemBody = match[2]

  // 跳过非 item 的块（如 effect 内部）
  if (itemKey === 'effect' || itemKey === 'ITEMS_RAW') continue

  const item = { key: itemKey, fields: {} }

  // 提取字段：支持字符串、数字、布尔、对象
  const fieldRegex = /(\w+):\s*(?:'([^']*)'|"([^"]*)"|(-?\d+(?:\.\d+)?)|(\{[^}]*\})|(true|false))/g
  let fieldMatch
  while ((fieldMatch = fieldRegex.exec(itemBody)) !== null) {
    const fieldName = fieldMatch[1]
    const value =
      fieldMatch[2] !== undefined ? fieldMatch[2] :
      fieldMatch[3] !== undefined ? fieldMatch[3] :
      fieldMatch[4] !== undefined ? Number(fieldMatch[4]) :
      fieldMatch[5] !== undefined ? fieldMatch[5] :
      fieldMatch[6] === 'true' ? true : false

    item.fields[fieldName] = value

    if (!fieldStats[fieldName]) {
      fieldStats[fieldName] = { count: 0, sampleValues: new Set() }
    }
    fieldStats[fieldName].count++
    if (fieldName === 'type') {
      typeValues.add(String(value))
    }
    if (fieldStats[fieldName].sampleValues.size < 5) {
      fieldStats[fieldName].sampleValues.add(String(value))
    }
  }

  allItems.push(item)
}

// 统计 type 分布
const typeCount = {}
for (const item of allItems) {
  const t = item.fields.type
  if (t) {
    typeCount[t] = (typeCount[t] || 0) + 1
  }
}

// 字段含义映射（人工注释）
const fieldDescriptions = {
  name: '物品显示名称（中文）',
  type: '物品类型分类，决定物品归属（见下方 type 说明）',
  desc: '物品描述文本',
  canUse: '是否可以主动使用（true = 可使用）',
  value: '物品价值/售价（金币）',
  effect: '使用后产生的效果，包含各属性的变化量（如 hp、full、moist、san、temp 等）',
  sound: '使用时播放的音效 key',
  durableRec: '耐久恢复类型（magic = 法杖类，unmagic = 非法杖武器）',
  durableAmount: '耐久恢复数量',
  durable: '武器/装备耐久度上限',
  durableDec: '是否会消耗耐久度（true = 使用时扣耐久）',
  weaponType: '武器子类型（melee = 近战，magic = 魔法，shoot = 射击）',
  range: '武器攻击射程数值（数值越大射程越远）',
  damage: '武器基础伤害值',
  equipType: '装备槽位（foot = 脚部，hand = 手部，body = 身体，head = 头部）',
  require: '使用/装备前置属性要求，如 { ps: 2 } 表示需要力量值 ≥ 2',
  science: '该物品需要研究的科技 key，研究对应科技后才能制作',
  isDrink: '是否为饮品（true = 饮品，影响使用动画或分类）',
  bullet: '射击武器使用的弹药类型 key（如 iron、bullet、arrow）',
  dmgMul: '受到伤害的倍率修正（< 1 减伤，> 1 增伤）',
  magicMul: '魔法伤害输出倍率加成（叠加值，如 0.8 = 额外 +80%）',
  meleeMul: '近战伤害输出倍率加成（叠加值）',
  shootMul: '射击伤害输出倍率加成（叠加值）',
  upgrade: '装备升级路径标识（如 farm、melee、shoot）',
  agileInc: '射程优势增加值（影响先手/命中）',
  dmgTo: '伤害转化效果，将造成的伤害转化为对目标属性的增益，如 { target: "hp", buff: 0.3 } = 汲取 30% 生命',
  rec: '每回合/每天自动恢复的属性，如 { ps: 4, full: -2 }',
  meleeCostDec: '近战攻击体力消耗减少量（负数为减少，小数为比例）',
  magicCostDec: '魔法攻击消耗减少量',
  shootCostDec: '射击攻击消耗减少量',
  block: '格挡/减伤概率（0~1，如 0.8 = 80% 几率格挡）',
  frozen: '被冻结时的移动速度倍率（< 1 表示减速）',
  frozenArm: '攻击时冻结敌人的概率（0~1）',
  reiToDmg: '按轮回次数增加伤害的基础值',
  reiToDef: '按轮回次数增加防御的比例（0~1）',
  reiToAtk: '按轮回次数增加攻击的比例（0~1）',
  psToDef: '将力量值转化为防御加成的比例',
  hpTo_magic: '将生命值转化为魔法伤害的比例',
  tempBuff: '对环境温度的持续影响值（正数升温，负数降温）',
  tempDownMul: '降温速率倍率（< 1 减缓降温）',
  tempUpMul: '升温速率倍率',
  curse: '诅咒效果概率（0~1）',
  fear: '恐惧效果概率（0~1，影响敌人逃跑几率）',
  collectSpeed: '采集速度倍率加成',
  moveFaster: '移动速度加成倍率',
  rewardChanceMul: '奖励获取概率倍率',
  runChanceMul: '逃跑成功概率倍率',
  battleChanceMul: '战斗触发概率倍率',
}

// type 含义映射
const typeDescriptions = {
  // ===== 普通物品 =====
  tool: '工具类 —— 功能性道具，如卷轴、钥匙等',
  food: '食材类 —— 未加工的原始食物，可直接食用或用于烹饪',
  cooked: '熟食类 —— 经过加工/烹饪的食物，通常有更好的效果',
  quest: '任务类 —— 与特定任务相关的物品，通常无法交易',
  met: '材料类 —— 合成/制作所需的原材料（金属、矿石、生物材料等）',
  special: '特殊类 —— 特殊功能物品',
  poizon: '毒药类 —— 具有中毒/负面效果的物品',
  art: '艺术品类 —— 装饰性物品，主要用于出售获取金币',
  bullet: '弹药类 —— 射击武器所需的弹药',
  // ===== 装备 =====
  weapon: '武器类 —— 可装备的攻击性武器（含近战/魔法/射击）',
  equip: '装备类 —— 可穿戴的防具/饰品（含 equipType 字段区分槽位）',
  // ===== 科技树节点（研究后生效，不进入背包） =====
  unknownBonus: '科技-解锁类 —— 研究后解锁新配方或新能力（如铁匠工具、炼金提纯）',
  bigBoxSizeBonus: '科技-箱子扩容 —— 每级增加箱子存储空间',
  bagSizeBonus: '科技-背包扩容 —— 每级增加背包存储空间',
  farmSizeBonus: '科技-农田扩建 —— 每级增加农田种植格数',
  alcoSizeBonus: '科技-酒桶扩建 —— 每级增加酒桶容量',
  trapSizeBonus: '科技-陷阱扩容 —— 每级增加陷阱数量上限',
  wellBonus: '科技-水井产量 —— 每级增加水井每日产水量',
  makeSpeed: '科技-制作速度 —— 每级提升物品制作速度',
  cookerUpdate: '科技-炊具升级 —— 每级加快烹饪速度',
  durableUpdate: '科技-锻造强化 —— 每级增加非魔法武器耐久度，或解锁工具制作',
  magicDurableUpdate: '科技-魔法提炼 —— 每级增加魔法武器耐久度',
  collectDec: '科技-采集优化 —— 每级减少采集行动的体力消耗',
  trapChance: '科技-陷阱效率 —— 每级提升陷阱捕获几率',
  trapGet: '科技-陷阱收益 —— 每级增加陷阱的掉落收益',
  lockUpdate: '科技-门锁升级 —— 每级延长盗贼破门间隔天数',
  securityBox: '科技-保险箱 —— 每级减少失窃数量',
  mapBonus: '科技-地图测绘 —— 每级在地图上解锁新地点',
  beaconMax: '科技-商队马车 —— 每级增加商人最大交易量',
  sleepPlace: '科技-睡眠设施 —— 提供睡眠场所，影响休息恢复效率',
  showerPlace: '科技-洗浴设施 —— 提供洗澡/废物处理功能',
}

// 生成 Markdown 文档
let md = `# items.ts 数据结构分析

> 自动生成于 ${new Date().toLocaleString('zh-CN')}
> 源文件：\`kubition-remake/src/data/items.ts\`

---

## 一、Item 字段说明

| 字段名 | 出现次数 | 含义 | 示例值 |
|--------|---------|------|--------|
`

// 按出现次数降序排列
const sortedFields = Object.entries(fieldStats).sort((a, b) => b[1].count - a[1].count)

for (const [field, stat] of sortedFields) {
  const desc = fieldDescriptions[field] || '（待补充）'
  const samples = [...stat.sampleValues].slice(0, 3).join('、')
  md += `| \`${field}\` | ${stat.count} | ${desc} | ${samples} |\n`
}

md += `
---

## 二、type 字段值说明

| type 值 | 数量 | 含义 |
|---------|------|------|
`

// 按数量降序
const sortedTypes = Object.entries(typeCount).sort((a, b) => b[1] - a[1])
for (const [type, count] of sortedTypes) {
  const desc = typeDescriptions[type] || '（待补充）'
  md += `| \`${type}\` | ${count} | ${desc} |\n`
}

// 补充在 typeValues 中但 typeCount 没有的（理论上不会有，保险起见）
for (const t of typeValues) {
  if (!typeCount[t]) {
    const desc = typeDescriptions[t] || '（待补充）'
    md += `| \`${t}\` | 0 | ${desc} |\n`
  }
}

md += `
---

## 三、effect 子字段说明

\`effect\` 字段是一个对象，包含使用物品后对角色属性的影响：

| 子字段 | 含义 |
|--------|------|
| \`hp\` | 生命值变化量（正数恢复，负数扣除） |
| \`full\` | 饱食度变化量 |
| \`moist\` | 水分/湿润度变化量 |
| \`san\` | 理智值变化量 |
| \`temp\` | 体温/环境温度变化量（正数升温，负数降温） |
| \`ps\` | 力量值变化量 |

---

## 四、科技类说明

科技类物品与普通物品共用同一数据结构（\`Item\`），**没有单独的 \`tech\` type 值**。
科技类通过以下多种 type 值区分功能，统一表示「研究后生效、不进入背包」的科技树节点：

| type 值 | 功能分类 |
|---------|----------|
| \`unknownBonus\` | 解锁新配方/新能力（铁匠、炼金、裁缝等） |
| \`bigBoxSizeBonus\` | 箱子扩容 |
| \`bagSizeBonus\` | 背包扩容 |
| \`farmSizeBonus\` | 农田扩建 |
| \`alcoSizeBonus\` | 酒桶扩建 |
| \`trapSizeBonus\` | 陷阱扩容 |
| \`wellBonus\` | 水井产量提升 |
| \`makeSpeed\` | 制作速度提升 |
| \`cookerUpdate\` | 烹饪速度提升 |
| \`durableUpdate\` | 非魔法武器耐久提升 |
| \`magicDurableUpdate\` | 魔法武器耐久提升 |
| \`collectDec\` | 采集消耗降低 |
| \`trapChance\` | 陷阱捕获几率提升 |
| \`trapGet\` | 陷阱收益提升 |
| \`lockUpdate\` | 门锁强化（延长盗贼破门间隔） |
| \`securityBox\` | 保险箱（减少失窃） |
| \`mapBonus\` | 地图测绘（解锁新地点） |
| \`beaconMax\` | 商队马车（增加商人交易量） |
| \`sleepPlace\` | 睡眠设施（影响休息恢复） |
| \`showerPlace\` | 洗浴设施（洗澡/废物处理） |

科技物品特有字段：

| 字段 | 说明 |
|------|------|
| \`science\` | 该物品需要研究的科技 key，研究对应科技后才能制作此物品 |

---

## 五、统计摘要

- **物品总数**：${allItems.length} 个
- **字段种类**：${sortedFields.length} 种
- **type 种类**：${sortedTypes.length} 种
`

// 确保 docs 目录存在
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true })
}

fs.writeFileSync(outputPath, md, 'utf-8')
console.log(`✅ 文档已生成：${outputPath}`)
console.log(`\n📊 统计摘要：`)
console.log(`  - 物品总数：${allItems.length}`)
console.log(`  - 字段种类：${sortedFields.length}`)
console.log(`  - type 种类：${sortedTypes.length}`)
console.log(`\n🏷️  type 分布：`)
for (const [type, count] of sortedTypes) {
  console.log(`  ${type.padEnd(12)} : ${count} 个`)
}
console.log(`\n📋 字段列表（按出现频率）：`)
for (const [field, stat] of sortedFields) {
  console.log(`  ${field.padEnd(15)} : ${stat.count} 次`)
}
