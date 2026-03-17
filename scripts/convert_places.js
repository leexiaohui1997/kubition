/**
 * 数据转换脚本：将原始 data_place.js 转换为 TypeScript 类型化数据
 * 地点数据需要特殊处理：resource 对象 → ResourceNode 数组，字段名映射等
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'KuBiTionAdvanture', 'src', 'data_place.js');
const content = fs.readFileSync(dataPath, 'utf-8');
eval(content);

function toTsValue(val, indent = '    ') {
  if (val === null || val === undefined) return 'undefined';
  if (typeof val === 'boolean') return val.toString();
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'string') return "'" + val.replace(/'/g, "\\'") + "'";
  if (Array.isArray(val)) {
    if (val.length === 0) return '[]';
    var items = val.map(function(v) { return toTsValue(v, indent + '  '); });
    // 如果数组元素是简单值且较少，单行输出
    if (val.every(function(v) { return typeof v !== 'object'; }) && val.length <= 5) {
      return '[' + items.join(', ') + ']';
    }
    return '[\n' + items.map(function(item) { return indent + '  ' + item; }).join(',\n') + ',\n' + indent + ']';
  }
  if (typeof val === 'object') {
    var entries = Object.entries(val);
    if (entries.length === 0) return '{}';
    if (entries.length <= 4 && entries.every(function(e) { return typeof e[1] !== 'object'; })) {
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

/**
 * 将原始地点的 resource 对象转换为 ResourceNode 数组
 * 原始格式: { tree: { name, things, circle, timeNeed, action, require, initAmount, event }, ... }
 * 目标格式: ResourceNode[] (id, name, actionName, timeCost, drops, psCost, requiredTool, circle, initAmount, event)
 */
function convertResources(resourceObj, indent) {
  if (!resourceObj || Object.keys(resourceObj).length === 0) return null;
  
  var nodes = [];
  Object.entries(resourceObj).forEach(function(entry) {
    var resId = entry[0];
    var res = entry[1];
    var node = {
      id: resId,
      name: res.name || resId,
      actionName: res.action || '采集',
      timeCost: res.timeNeed || 1,
      drops: res.things || {},
    };
    
    // 处理 require 字段（拆分为 psCost、hpCost 和 requiredTool）
    if (res.require) {
      var req = Object.assign({}, res.require);
      if (req.ps !== undefined) {
        node.psCost = req.ps;
        delete req.ps;
      }
      if (req.hp !== undefined) {
        node.hpCost = req.hp;
        delete req.hp;
      }
      if (Object.keys(req).length > 0) {
        node.requiredTool = req;
      }
    }
    
    if (res.circle !== undefined) node.circle = res.circle;
    if (res.initAmount !== undefined) node.initAmount = res.initAmount;
    if (res.event !== undefined) node.event = res.event;
    
    nodes.push(node);
  });
  
  return nodes;
}

/**
 * 将原始地点的 mst 对象转换为 monsters 对象
 */
function convertMonsters(mstObj) {
  if (!mstObj || Object.keys(mstObj).length === 0) return null;
  return mstObj; // 结构已经是 { mstId: { balancedAmount } }
}

// 生成 TypeScript 文件内容
var output = '/**\n' +
  ' * 地点数据 - 全量迁移自原始项目 KuBiTionAdvanture/src/data_place.js\n' +
  ' * 本文件由脚本自动生成，请勿手动修改\n' +
  ' */\n' +
"import type { Place } from '@/types/game'\n\n" +
  "/** 全部地点数据（不含运行时 id 字段） */\n" +
  "const PLACES_RAW: Record<string, Omit<Place, 'id'>> = {\n";

var entries = Object.entries(PLACE_DATA);
for (var i = 0; i < entries.length; i++) {
  var placeId = entries[i][0];
  var place = entries[i][1];
  
  output += '  ' + formatKey(placeId) + ': {\n';
  output += "    name: '" + (place.name || placeId).replace(/'/g, "\\'") + "',\n";
  output += '    timeNeed: ' + (place.timeNeed || 0) + ',\n';
  
  // 资源节点
  var resources = convertResources(place.resource);
  if (resources && resources.length > 0) {
    output += '    resources: ' + toTsValue(resources, '    ') + ',\n';
  }
  
  // 怪物
  var monsters = convertMonsters(place.mst);
  if (monsters && Object.keys(monsters).length > 0) {
    output += '    monsters: ' + toTsValue(monsters, '    ') + ',\n';
  }
  
  // 可拾取物品
  if (place.things && Object.keys(place.things).length > 0) {
    output += '    things: ' + toTsValue(place.things, '    ') + ',\n';
  }
  
  // 环境温度
  if (place.temp !== undefined) {
    output += '    temp: ' + place.temp + ',\n';
  }
  
  // 进入条件事件
  if (place.requireEvent !== undefined) {
    output += "    requireEvent: '" + place.requireEvent + "',\n";
  }
  
  // 可触发事件
  if (place.event && Object.keys(place.event).length > 0) {
    output += '    events: ' + toTsValue(place.event, '    ') + ',\n';
  }
  
  // 需要科技
  if (place.science !== undefined) {
    output += "    science: '" + place.science + "',\n";
  }
  
  output += '  },\n';
}

output += '}\n\n' +
  '/** 全部地点数据（含运行时 id 字段） */\n' +
  'export const PLACES: Record<string, Place> = Object.fromEntries(\n' +
  "  Object.entries(PLACES_RAW).map(([id, place]) => [id, { ...place, id }])\n" +
  ') as Record<string, Place>\n\n' +
  '/** 根据地点ID获取地点对象 */\n' +
  'export function getPlace(id: string): Place | undefined {\n' +
  '  return PLACES[id]\n' +
  '}\n\n' +
  '/** 根据地点ID获取地点中文名称，不存在时返回原始ID */\n' +
  'export function getPlaceName(id: string): string {\n' +
  '  return PLACES[id]?.name ?? id\n' +
  '}\n';

var outPath = path.join(__dirname, '..', 'kubition-remake', 'src', 'data', 'places.ts');
fs.writeFileSync(outPath, output, 'utf-8');
console.log('✅ 地点数据已生成: ' + outPath);
console.log('   共 ' + entries.length + ' 个地点');
