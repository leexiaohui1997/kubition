/**
 * 数据转换脚本：将原始 data_dungeon.js 转换为 TypeScript 类型化数据
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'KuBiTionAdvanture', 'src', 'data_dungeon.js');
const content = fs.readFileSync(dataPath, 'utf-8');
eval(content);

function toTsValue(val, indent) {
  indent = indent || '    ';
  if (val === null || val === undefined) return 'undefined';
  if (typeof val === 'boolean') return val.toString();
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'string') return "'" + val.replace(/'/g, "\\'") + "'";
  if (Array.isArray(val)) {
    if (val.length === 0) return '[]';
    var items = val.map(function(v) { return indent + '  ' + toTsValue(v, indent + '  '); });
    return '[\n' + items.join(',\n') + ',\n' + indent + ']';
  }
  if (typeof val === 'object') {
    var entries = Object.entries(val);
    if (entries.length === 0) return '{}';
    if (entries.length <= 5 && entries.every(function(e) { return typeof e[1] !== 'object'; })) {
      var pairs = entries.map(function(e) { return formatKey(e[0]) + ': ' + toTsValue(e[1]); });
      return '{ ' + pairs.join(', ') + ' }';
    }
    var pairs2 = entries.map(function(e) { return indent + '  ' + formatKey(e[0]) + ': ' + toTsValue(e[1], indent + '  '); });
    return '{\n' + pairs2.join(',\n') + ',\n' + indent + '}';
  }
  return String(val);
}

function formatKey(key) {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) return key;
  return "'" + key + "'";
}

// 生成 TypeScript 文件内容
var output = '/**\n' +
  ' * 地牢数据 - 全量迁移自原始项目 KuBiTionAdvanture/src/data_dungeon.js\n' +
  ' * 本文件由脚本自动生成，请勿手动修改\n' +
  ' */\n' +
  "import type { DungeonFloor, DungeonReward } from '@/types/game'\n\n" +
  '/** 全部地牢层级数据 */\n' +
  'export const DUNGEON_FLOORS: Record<number, DungeonFloor> = {\n';

var entries = Object.entries(DUNGEON_DATA);
for (var i = 0; i < entries.length; i++) {
  var floorNum = entries[i][0];
  var floorData = entries[i][1];
  
  output += '  ' + floorNum + ': {\n';
  output += '    floor: ' + floorNum + ',\n';
  
  // monsterWeights
  output += '    monsterWeights: ' + toTsValue(floorData.mst, '    ') + ',\n';
  
  // rewards
  if (floorData.reward && floorData.reward.length > 0) {
    output += '    rewards: [\n';
    floorData.reward.forEach(function(reward) {
      output += '      { things: ' + toTsValue(reward.things, '      ') + ', chance: ' + reward.chance + ' },\n';
    });
    output += '    ],\n';
  } else {
    output += '    rewards: [],\n';
  }
  
  output += '  },\n';
}

output += '}\n';

var outPath = path.join(__dirname, '..', 'kubition-remake', 'src', 'data', 'dungeons.ts');
fs.writeFileSync(outPath, output, 'utf-8');
console.log('✅ 地牢数据已生成: ' + outPath);
console.log('   共 ' + entries.length + ' 层');
