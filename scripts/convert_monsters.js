/**
 * 数据转换脚本：将原始 data_mst.js 转换为 TypeScript 类型化数据
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'KuBiTionAdvanture', 'src', 'data_mst.js');
const content = fs.readFileSync(dataPath, 'utf-8');
eval(content);

function toTsValue(val, indent = '    ') {
  if (val === null || val === undefined) return 'undefined';
  if (typeof val === 'boolean') return val.toString();
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'string') return "'" + val.replace(/'/g, "\\'") + "'";
  if (Array.isArray(val)) {
    const items = val.map(function(v) { return toTsValue(v, indent + '  '); });
    return '[' + items.join(', ') + ']';
  }
  if (typeof val === 'object') {
    const entries = Object.entries(val);
    if (entries.length === 0) return '{}';
    if (entries.length <= 4 && entries.every(function(e) { return typeof e[1] !== 'object'; })) {
      const pairs = entries.map(function(e) { return formatKey(e[0]) + ': ' + toTsValue(e[1]); });
      return '{ ' + pairs.join(', ') + ' }';
    }
    const pairs = entries.map(function(e) { return indent + '  ' + formatKey(e[0]) + ': ' + toTsValue(e[1], indent + '  '); });
    return '{\n' + pairs.join(',\n') + ',\n' + indent + '}';
  }
  return String(val);
}

function formatKey(key) {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) return key;
  return "'" + key + "'";
}

var output = '/**\n' +
  ' * 怪物数据 - 全量迁移自原始项目 KuBiTionAdvanture/src/data_mst.js\n' +
  ' * 本文件由脚本自动生成，请勿手动修改\n' +
  ' */\n' +
  "import type { Monster } from '@/types/game'\n\n" +
  "/** 全部怪物数据（不含运行时 id 字段） */\n" +
  "const MONSTERS_RAW: Record<string, Omit<Monster, 'id'>> = {\n";

var entries = Object.entries(MST_DATA);
for (var i = 0; i < entries.length; i++) {
  var key = entries[i][0];
  var item = entries[i][1];
  output += '  ' + formatKey(key) + ': {\n';
  var props = Object.entries(item);
  for (var j = 0; j < props.length; j++) {
    output += '    ' + formatKey(props[j][0]) + ': ' + toTsValue(props[j][1]) + ',\n';
  }
  output += '  },\n';
}

output += '}\n\n' +
  '/** 全部怪物数据（含运行时 id 字段） */\n' +
  'export const MONSTERS: Record<string, Monster> = Object.fromEntries(\n' +
  "  Object.entries(MONSTERS_RAW).map(([id, mst]) => [id, { ...mst, id }])\n" +
  ') as Record<string, Monster>\n\n' +
  '/** 根据怪物ID获取怪物对象 */\n' +
  'export function getMonster(id: string): Monster | undefined {\n' +
  '  return MONSTERS[id]\n' +
  '}\n\n' +
  '/** 根据怪物ID获取怪物中文名称，不存在时返回原始ID */\n' +
  'export function getMonsterName(id: string): string {\n' +
  '  return MONSTERS[id]?.name ?? id\n' +
  '}\n';

var outPath = path.join(__dirname, '..', 'kubition-remake', 'src', 'data', 'monsters.ts');
fs.writeFileSync(outPath, output, 'utf-8');
console.log('✅ 怪物数据已生成: ' + outPath);
console.log('   共 ' + entries.length + ' 个怪物');
