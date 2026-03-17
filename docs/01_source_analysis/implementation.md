# 代码实现技术分析

## 1. 核心算法实现

### 1.1 命中率计算算法

```javascript
// main.js 中实现
getHitChance: function(attackerRange, targetRange) {
    // 距离差决定命中基础概率
    var rangeDiff = Math.abs(attackerRange - targetRange);
    var baseHit = 100 - rangeDiff * 2;
    
    // 添加随机波动
    var randomFactor = Math.random() * 20 - 10;
    
    return Math.max(5, Math.min(95, baseHit + randomFactor));
}
```

### 1.2 伤害计算公式

```javascript
// 基础伤害 = 武器伤害 * 属性加成
calculateDamage: function(attacker, defender, weapon) {
    var baseDamage = weapon.damage;
    
    // 伤害波动 ±damageRan
    var variance = (Math.random() * 2 - 1) * weapon.damageRan;
    var damage = baseDamage * (1 + variance);
    
    // 暴击判定 (5%基础概率)
    if(Math.random() < 0.05) {
        damage *= 2;
    }
    
    // 防御减伤
    var defense = defender.equip.def || 0;
    damage = Math.max(1, damage - defense * 0.5);
    
    return Math.floor(damage);
}
```

### 1.3 背包容量检查

```javascript
// lib.js 中实现
checkHaveResource: function(requireList, bag) {
    for(var item in requireList) {
        var need = requireList[item];
        var have = bag[item] || 0;
        if(have < need) return false;
    }
    return true;
}

// 带数量检查的版本
checkHaveResourceWithAmount: function(item, amount, bag) {
    return (bag[item] || 0) >= amount;
}
```

### 1.4 随机物品生成

```javascript
// 基于权重的随机选择
function weightedRandom(items) {
    var totalWeight = 0;
    for(var id in items) {
        totalWeight += items[id];
    }
    
    var random = Math.random() * totalWeight;
    var currentWeight = 0;
    
    for(var id in items) {
        currentWeight += items[id];
        if(random <= currentWeight) {
            return id;
        }
    }
}

// 应用示例：地牢怪物生成
var mst = weightedRandom(DUNGEON_DATA[floor].mst);
```

### 1.5 时间流逝处理

```javascript
// time系统核心逻辑
useTime: function(timeUnits, callback) {
    var self = this;
    var playerState = this.state.playerState;
    
    // 更新状态
    playerState.full.amount -= timeUnits * 0.3;
    playerState.moist.amount -= timeUnits * 0.5;
    playerState.ps.amount += timeUnits * 0.5;
    
    // 体温向环境温趋近
    var targetTemp = this.getEnvironmentTemp();
    var tempDiff = targetTemp - playerState.temp.amount;
    playerState.temp.amount += tempDiff * 0.1 * timeUnits;
    
    // 检查死亡条件
    if(playerState.hp.amount <= 0) {
        this.handleDeath();
    }
    
    // 回调更新UI
    this.setState({playerState: playerState}, callback);
}
```

## 2. React 组件设计模式

### 2.1 Context API 使用

```javascript
// 定义Context类型
contextTypes: {
    playerState: React.PropTypes.object.isRequired,
    useTime: React.PropTypes.func.isRequired,
    changeMsg: React.PropTypes.func.isRequired,
    handleExchange: React.PropTypes.func.isRequired,
    AudioEngine: React.PropTypes.object.isRequired,
    // ... 更多
}

// 在App组件中提供
getChildContext: function() {
    return {
        playerState: this.state.playerState,
        useTime: this.useTime,
        changeMsg: this.changeMsg,
        // ...
    };
}
```

### 2.2 高阶组件模式

```javascript
// BoxComponent - 通用容器组件
var BoxComponent = React.createClass({
    contextTypes: {
        boxSaveData: React.PropTypes.object.isRequired,
    },
    
    render: function() {
        var box = this.context.boxSaveData[this.props.box];
        // 渲染物品格子
        return <ul className="boxList">{this.createItems()}</ul>;
    }
});

// 被多个界面复用
<BoxComponent box="bag" />
<BoxComponent box="bigBox" />
<BoxComponent box="trapBox" />
```

### 2.3 受控组件

```javascript
// ItemComponent - 物品显示组件
var ItemComponent = React.createClass({
    itemMouseClick: function(event) {
        CTRL_PRESSED = event.ctrlKey;
        SHIFT_PRESSED = event.shiftKey;
        
        this.context.handleExchange(
            this.props.item, 
            this.props.box, 
            this.context.isDueling
        );
    },
    
    render: function() {
        var item = this.props.item;
        return (
            <div className="item" onClick={this.itemMouseClick}>
                <p style={{color: TYPE_DATA[ITEM_DATA[item].type].color}}>
                    {ITEM_DATA[item].name}
                </p>
                <span className="badge">{this.props.amount}</span>
            </div>
        );
    }
});
```

## 3. 数据存储架构

### 3.1 LocalStorage 封装

```javascript
// 存档结构
var SAVE_KEY = 'KuBiTion_Save';

// 保存游戏
function saveGame(saveData) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
}

// 加载游戏
function loadGame() {
    var data = localStorage.getItem(SAVE_KEY);
    if(data) {
        return JSON.parse(data);
    }
    return null;
}

// 存档数据结构
var saveData = {
    version: '1.0',
    saveTime: Date.now(),
    playerState: {...},      // 角色状态
    bag: {...},              // 背包内容
    currentEquip: {...},     // 当前装备
    boxSaveData: {...},      // 各类箱子数据
    mapSaveData: {...},      // 地图解锁状态
    eventSaveData: {...},    // 事件完成状态
    scienceSaveData: {...},  // 科技学习状态
    skillSaveData: {...},    // 技能等级
}
```

### 3.2 深拷贝实现

```javascript
// lib.js 中实现的深拷贝
function clone(obj) {
    if(obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    var copy = obj.constructor();
    for(var attr in obj) {
        if(obj.hasOwnProperty(attr)) {
            copy[attr] = clone(obj[attr]);
        }
    }
    return copy;
}

// 使用场景：防止状态引用污染
var newState = clone(this.state.playerState);
newState.hp.amount -= 10;
this.setState({playerState: newState});
```

## 4. 工具函数库 (lib.js)

### 4.1 对象操作

```javascript
// 合并两个对象（物品合并）
function together(obj1, obj2) {
    var result = clone(obj1);
    for(var key in obj2) {
        result[key] = (result[key] || 0) + obj2[key];
    }
    return result;
}

// 获取对象长度
function getLength(obj) {
    var count = 0;
    for(var key in obj) {
        if(obj.hasOwnProperty(key)) count++;
    }
    return count;
}

// 从对象中移除指定键
function removeKey(obj, key) {
    var result = clone(obj);
    delete result[key];
    return result;
}
```

### 4.2 数组/集合操作

```javascript
// 数组去重
function unique(arr) {
    return Array.from(new Set(arr));
}

// 随机打乱数组
function shuffle(arr) {
    for(var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
```

### 4.3 随机工具

```javascript
// 随机整数 [min, max]
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 随机选择数组元素
function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// 概率判定
function chance(probability) {
    return Math.random() < probability;
}

// 正态分布随机
function normalRandom(mean, stdDev) {
    var u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * stdDev + mean;
}
```

## 5. 定时器与异步处理

### 5.1 制造队列系统

```javascript
// 制造队列管理
var makeQueue = [];

function addToQueue(recipe) {
    var item = {
        id: recipe.id,
        startTime: Date.now(),
        duration: recipe.timeNeed * TIME_UNIT * 1000,
    };
    makeQueue.push(item);
    processQueue();
}

function processQueue() {
    if(makeQueue.length === 0) return;
    
    var current = makeQueue[0];
    var elapsed = Date.now() - current.startTime;
    
    if(elapsed >= current.duration) {
        completeMake(current);
        makeQueue.shift();
        processQueue(); // 处理下一个
    } else {
        setTimeout(processQueue, 1000); // 每秒检查
    }
}
```

### 5.2 游戏循环

```javascript
// 游戏主循环（使用requestAnimationFrame）
var lastTime = 0;

function gameLoop(timestamp) {
    var deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // 更新被动恢复
    updatePassiveRecovery(deltaTime);
    
    // 更新制造队列
    updateMakingQueue(deltaTime);
    
    // 更新UI
    updateUI();
    
    requestAnimationFrame(gameLoop);
}

// 启动游戏循环
requestAnimationFrame(gameLoop);
```

## 6. 事件系统实现

### 6.1 自定义事件

```javascript
// 简单的事件系统
var EventCenter = {
    events: {},
    
    on: function(eventName, callback) {
        if(!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    },
    
    emit: function(eventName, data) {
        if(this.events[eventName]) {
            this.events[eventName].forEach(function(callback) {
                callback(data);
            });
        }
    },
    
    off: function(eventName, callback) {
        if(this.events[eventName]) {
            this.events[eventName] = this.events[eventName].filter(
                function(cb) { return cb !== callback; }
            );
        }
    }
};

// 使用示例
EventCenter.on('playerDeath', function() {
    console.log('玩家死亡');
});
```

## 7. 性能优化技巧

### 7.1 虚拟列表（未实现但可优化）

```javascript
// 大列表渲染优化
var VirtualList = React.createClass({
    getInitialState: function() {
        return {
            scrollTop: 0,
            visibleStart: 0,
            visibleEnd: 20,
        };
    },
    
    onScroll: function(e) {
        var scrollTop = e.target.scrollTop;
        var itemHeight = 30;
        var visibleStart = Math.floor(scrollTop / itemHeight);
        var visibleCount = Math.ceil(window.innerHeight / itemHeight);
        
        this.setState({
            scrollTop: scrollTop,
            visibleStart: visibleStart,
            visibleEnd: visibleStart + visibleCount,
        });
    },
    
    render: function() {
        var items = this.props.items.slice(
            this.state.visibleStart, 
            this.state.visibleEnd
        );
        // 只渲染可见区域
    }
});
```

### 7.2 防抖与节流

```javascript
// 防抖函数
function debounce(func, wait) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            func.apply(context, args);
        }, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    var inThrottle;
    return function() {
        var context = this, args = arguments;
        if(!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(function() { inThrottle = false; }, limit);
        }
    };
}

// 应用：滚动事件节流
window.addEventListener('scroll', throttle(function() {
    // 处理滚动
}, 100));
```

## 8. 代码风格与规范

### 8.1 命名规范

```javascript
// 常量：全大写下划线
var TIME_UNIT = 4;
var MAX_BAG_SIZE = 100;

// 构造函数：驼峰命名
function PlayerState() {}
function CombatEngine() {}

// 数据配置：与JSON保持一致
var ITEM_DATA = {};
var MST_DATA = {};

// 组件名：首字母大写
var ItemComponent = React.createClass({...});

// 方法名：小驼峰
function calculateDamage() {}
function handleItemClick() {}

// 私有方法：下划线前缀
function _privateMethod() {}
```

### 8.2 注释规范

```javascript
/**
 * 计算战斗伤害
 * @param {Object} attacker - 攻击者
 * @param {Object} defender - 防御者
 * @param {Object} weapon - 使用的武器
 * @returns {Number} 最终伤害值
 */
function calculateDamage(attacker, defender, weapon) {
    // ...
}

// TODO: 需要优化性能
// FIXME: 这里有bug
// HACK: 临时解决方案
```

## 9. 错误处理

### 9.1 输入验证

```javascript
function useItem(itemId, amount) {
    // 参数验证
    if(!itemId || typeof itemId !== 'string') {
        console.error('Invalid itemId:', itemId);
        return false;
    }
    
    if(!ITEM_DATA[itemId]) {
        console.error('Unknown item:', itemId);
        return false;
    }
    
    // 数量验证
    amount = parseInt(amount) || 1;
    if(amount <= 0) {
        console.error('Invalid amount:', amount);
        return false;
    }
    
    // 执行使用逻辑
    // ...
}
```

### 9.2 边界处理

```javascript
// 确保数值在有效范围
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// 应用示例
playerState.hp.amount = clamp(playerState.hp.amount, 0, playerState.hp.max);
```

## 10. 扩展性设计

### 10.1 插件系统架构

```javascript
// 插件接口设计
var PluginManager = {
    plugins: [],
    
    register: function(plugin) {
        if(typeof plugin.init === 'function') {
            plugin.init();
        }
        this.plugins.push(plugin);
    },
    
    callHook: function(hookName, data) {
        this.plugins.forEach(function(plugin) {
            if(typeof plugin[hookName] === 'function') {
                data = plugin[hookName](data) || data;
            }
        });
        return data;
    }
};

// 插件示例
var AutoSavePlugin = {
    init: function() {
        setInterval(function() {
            saveGame();
        }, 60000); // 每分钟自动保存
    }
};

PluginManager.register(AutoSavePlugin);
```

---

**技术总结**: 该游戏使用了经典的React+jQuery技术栈，代码组织清晰，数据驱动设计合理，具有良好的可维护性和扩展性。
