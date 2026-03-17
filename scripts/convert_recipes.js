/**
 * 数据转换脚本：将原始 data_studio.js 转换为 TypeScript 类型化数据
 * 配方数据包含四大分类：MAKE_DATA(锻造), ALCHEMY_DATA(炼金), SCIENCE_DATA(科技), MAGIC_DATA(魔法)
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'KuBiTionAdvanture', 'src', 'data_studio.js');
const content = fs.readFileSync(dataPath, 'utf-8');
eval(content);

// 同时读取物品数据用于获取配方名称
const itemDataPath = path.join(__dirname, '..', 'KuBiTionAdvanture', 'src', 'data_item.js');
const itemContent = fs.readFileSync(itemDataPath, 'utf-8');
eval(itemContent);

function toTsValue(val, indent) {
  indent = indent || '    ';
  if (val === null || val === undefined) return 'undefined';
  if (typeof val === 'boolean') return val.toString();
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'string') return "'" + val.replace(/'/g, "\\'") + "'";
  if (Array.isArray(val)) {
    if (val.length === 0) return '[]';
    var items = val.map(function(v) { return toTsValue(v, indent + '  '); });
    return '[' + items.join(', ') + ']';
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

/**
 * 将原始配方数据转换为 Recipe 格式
 */
function convertRecipes(dataObj, category) {
  var recipes = {};
  Object.entries(dataObj).forEach(function(entry) {
    var recipeId = entry[0];
    var raw = entry[1];
    
    // 获取配方名称：优先从 ITEM_DATA 获取
    var name = (ITEM_DATA[recipeId] && ITEM_DATA[recipeId].name) || recipeId;
    
    var recipe = {
      name: name,
      category: category,
      timeCost: raw.timeNeed || 1,
      materials: raw.require || {},
    };
    
    if (raw.amount !== undefined) recipe.amount = raw.amount;
    if (raw.science !== undefined) recipe.requiredScience = raw.science;
    if (raw.building !== undefined) recipe.requiredBuilding = raw.building;
    if (raw.event !== undefined) recipe.requiredEvent = raw.event;
    
    recipes[recipeId] = recipe;
  });
  return recipes;
}

var smithRecipes = convertRecipes(MAKE_DATA, 'smith');
var alchemyRecipes = convertRecipes(ALCHEMY_DATA, 'alchemy');
var scienceRecipes = convertRecipes(SCIENCE_DATA, 'science');
var magicRecipes = convertRecipes(MAGIC_DATA, 'magic');

function writeRecipeBlock(varName, recipes, indent) {
  indent = indent || '  ';
  var out = '';
  Object.entries(recipes).forEach(function(entry) {
    var id = entry[0];
    var recipe = entry[1];
    out += indent + formatKey(id) + ': {\n';
    Object.entries(recipe).forEach(function(propEntry) {
      out += indent + '  ' + formatKey(propEntry[0]) + ': ' + toTsValue(propEntry[1], indent + '  ') + ',\n';
    });
    out += indent + '},\n';
  });
  return out;
}

// 生成 TypeScript 文件内容
var output = '/**\n' +
  ' * 配方数据 - 全量迁移自原始项目 KuBiTionAdvanture/src/data_studio.js\n' +
  ' * 本文件由脚本自动生成，请勿手动修改\n' +
  ' */\n' +
  "import type { Recipe } from '@/types/game'\n\n";

// 锻造配方
output += "/** 锻造配方（不含运行时 id 字段） */\n";
output += "const SMITH_RECIPES_RAW: Record<string, Omit<Recipe, 'id'>> = {\n";
output += writeRecipeBlock('SMITH_RECIPES', smithRecipes);
output += '}\n\n';

// 炼金配方
output += "/** 炼金配方（不含运行时 id 字段） */\n";
output += "const ALCHEMY_RECIPES_RAW: Record<string, Omit<Recipe, 'id'>> = {\n";
output += writeRecipeBlock('ALCHEMY_RECIPES', alchemyRecipes);
output += '}\n\n';

// 科技研发
output += "/** 科技研发（不含运行时 id 字段） */\n";
output += "const SCIENCE_RECIPES_RAW: Record<string, Omit<Recipe, 'id'>> = {\n";
output += writeRecipeBlock('SCIENCE_RECIPES', scienceRecipes);
output += '}\n\n';

// 魔法配方
output += "/** 魔法配方（不含运行时 id 字段） */\n";
output += "const MAGIC_RECIPES_RAW: Record<string, Omit<Recipe, 'id'>> = {\n";
output += writeRecipeBlock('MAGIC_RECIPES', magicRecipes);
output += '}\n\n';

// 注入 id 字段的辅助函数
output += '/** 为配方数据注入运行时 id 字段 */\n';
output += "function injectId(raw: Record<string, Omit<Recipe, 'id'>>): Record<string, Recipe> {\n";
output += '  return Object.fromEntries(\n';
output += '    Object.entries(raw).map(([id, recipe]) => [id, { ...recipe, id }])\n';
output += '  ) as Record<string, Recipe>\n';
output += '}\n\n';

// 导出含 id 的版本
output += '/** 锻造配方 */\n';
output += 'export const SMITH_RECIPES: Record<string, Recipe> = injectId(SMITH_RECIPES_RAW)\n\n';
output += '/** 炼金配方 */\n';
output += 'export const ALCHEMY_RECIPES: Record<string, Recipe> = injectId(ALCHEMY_RECIPES_RAW)\n\n';
output += '/** 科技研发 */\n';
output += 'export const SCIENCE_RECIPES: Record<string, Recipe> = injectId(SCIENCE_RECIPES_RAW)\n\n';
output += '/** 魔法配方 */\n';
output += 'export const MAGIC_RECIPES: Record<string, Recipe> = injectId(MAGIC_RECIPES_RAW)\n\n';

// 合并的全部配方
output += '/** 全部配方（合并四大分类） */\n';
output += 'export const ALL_RECIPES: Record<string, Recipe> = {\n';
output += '  ...SMITH_RECIPES,\n';
output += '  ...ALCHEMY_RECIPES,\n';
output += '  ...SCIENCE_RECIPES,\n';
output += '  ...MAGIC_RECIPES,\n';
output += '}\n';

var outPath = path.join(__dirname, '..', 'kubition-remake', 'src', 'data', 'recipes.ts');
fs.writeFileSync(outPath, output, 'utf-8');

var totalCount = Object.keys(smithRecipes).length + Object.keys(alchemyRecipes).length + 
                 Object.keys(scienceRecipes).length + Object.keys(magicRecipes).length;
console.log('✅ 配方数据已生成: ' + outPath);
console.log('   锻造: ' + Object.keys(smithRecipes).length + ' 个');
console.log('   炼金: ' + Object.keys(alchemyRecipes).length + ' 个');
console.log('   科技: ' + Object.keys(scienceRecipes).length + ' 个');
console.log('   魔法: ' + Object.keys(magicRecipes).length + ' 个');
console.log('   合计: ' + totalCount + ' 个配方');
