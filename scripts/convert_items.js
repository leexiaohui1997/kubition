/**
 * 数据转换脚本：将原始 data_item.js 转换为 TypeScript 类型化数据
 * 用法：node scripts/convert_items.js > ../kubition-remake/src/data/items.ts
 */
const fs = require('fs');
const path = require('path');

// 读取原始数据文件
const dataPath = path.join(__dirname, '..', 'KuBiTionAdvanture', 'src', 'data_item.js');
const content = fs.readFileSync(dataPath, 'utf-8');

// 用 eval 解析原始 JS 数据
eval(content);

// 辅助函数：将 JS 值转为 TypeScript 字面量字符串
function toTsValue(val, indent = '    ') {
  if (val === null || val === undefined) return 'undefined';
  if (typeof val === 'boolean') return val.toString();
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'string') return `'${val.replace(/'/g, "\\'")}'`;
  if (Array.isArray(val)) {
    const items = val.map(v => toTsValue(v, indent + '  '));
    return `[${items.join(', ')}]`;
  }
  if (typeof val === 'object') {
    const entries = Object.entries(val);
    if (entries.length === 0) return '{}';
    if (entries.length <= 3 && entries.every(([, v]) => typeof v !== 'object')) {
      const pairs = entries.map(([k, v]) => `${formatKey(k)}: ${toTsValue(v)}`);
      return `{ ${pairs.join(', ')} }`;
    }
    const pairs = entries.map(([k, v]) => `${indent}  ${formatKey(k)}: ${toTsValue(v, indent + '  ')}`);
    return `{\n${pairs.join(',\n')},\n${indent}}`;
  }
  return String(val);
}

function formatKey(key) {
  // 如果 key 包含特殊字符或以数字开头，需要加引号
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) return key;
  return `'${key}'`;
}

// 生成 TypeScript 文件内容
let output = `/**
 * 物品数据 - 全量迁移自原始项目 KuBiTionAdvanture/src/data_item.js
 * 本文件由脚本自动生成，请勿手动修改
 */
import type { Item } from '@/types/game'

/** 全部物品数据（不含运行时 id 字段） */
const ITEMS_RAW: Record<string, Omit<Item, 'id'>> = {\n`;

const entries = Object.entries(ITEM_DATA);
for (let i = 0; i < entries.length; i++) {
  const [key, item] = entries[i];
  output += `  ${formatKey(key)}: {\n`;
  
  const props = Object.entries(item);
  for (let j = 0; j < props.length; j++) {
    const [propKey, propVal] = props[j];
    output += `    ${formatKey(propKey)}: ${toTsValue(propVal)},\n`;
  }
  
  output += `  },\n`;
}

output += `}

/** 全部物品数据（含运行时 id 字段） */
export const ITEMS: Record<string, Item> = Object.fromEntries(
  Object.entries(ITEMS_RAW).map(([id, item]) => [id, { ...item, id }])
) as Record<string, Item>

/** 根据物品ID获取物品对象 */
export function getItem(id: string): Item | undefined {
  return ITEMS[id]
}

/** 根据物品ID获取物品中文名称，不存在时返回原始ID */
export function getItemName(id: string): string {
  return ITEMS[id]?.name ?? id
}
`;

// 输出到文件
const outPath = path.join(__dirname, '..', 'kubition-remake', 'src', 'data', 'items.ts');
fs.writeFileSync(outPath, output, 'utf-8');
console.log('✅ 物品数据已生成: ' + outPath);
console.log('   共 ' + entries.length + ' 个物品');
