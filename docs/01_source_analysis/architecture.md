# 游戏系统架构图

## 1. 整体架构图

```mermaid
graph TB
    subgraph 用户界面层
        UI[React Components]
        Event[事件处理系统]
        Animation[CSS3动画]
    end

    subgraph 业务逻辑层
        App[App 主控制器]
        Combat[战斗系统]
        Craft[制造系统]
        Explore[探索系统]
        Quest[任务系统]
    end

    subgraph 数据层
        State[游戏状态数据]
        Config[配置数据]
        Storage[LocalStorage持久化]
    end

    UI --> Event
    Event --> App
    App --> Combat
    App --> Craft
    App --> Explore
    App --> Quest
    Combat --> State
    Craft --> State
    Explore --> State
    Quest --> State
    State --> Storage
    Config -.-> App
    Config -.-> Combat
    Config -.-> Craft
```

## 2. 游戏核心循环

```mermaid
flowchart TD
    A[开始游戏] --> B[资源收集]
    B --> C{资源是否充足?}
    C -->|是| D[制造装备/物品]
    C -->|否| B
    D --> E[提升战斗力]
    E --> F{挑战地牢?}
    F -->|是| G[地牢战斗]
    F -->|否| B
    G --> H{战斗胜利?}
    H -->|是| I[获得奖励]
    H -->|否| J[恢复/提升]
    J --> B
    I --> K[解锁新内容]
    K --> L{游戏通关?}
    L -->|否| B
    L -->|是| M[转生/新周目]
    M --> B
```

## 3. 数据文件依赖关系

```mermaid
graph LR
    main[main.js] --> lib[lib.js]
    main --> data[data.js]
    main --> item[data_item.js]
    main --> mst[data_mst.js]
    main --> place[data_place.js]
    main --> event[data_event.js]
    main --> studio[data_studio.js]
    main --> dungeon[data_dungeon.js]
    
    item --> data
    mst --> data
    place --> data
    event --> data
    studio --> data
    dungeon --> data
    
    style main fill:#f9f,stroke:#333
    style data fill:#bbf,stroke:#333
```

## 4. 状态系统设计

### 4.1 核心状态流转图

```mermaid
stateDiagram-v2
    [*] --> 野外探索
    野外探索 --> 战斗: 遭遇怪物
    战斗 --> 战斗胜利: 击败怪物
    战斗 --> 逃跑失败: 逃跑被追击
    战斗 --> 死亡: HP归零
    
    战斗胜利 --> 野外探索: 继续探索
    逃跑失败 --> 战斗: 被迫战斗
    
    野外探索 --> 休息: 使用睡眠点
    休息 --> 状态恢复: 生命值/体力恢复
    状态恢复 --> 野外探索
    
    野外探索 --> 制造: 打开工作台
    制造 --> 野外探索: 制造完成
    
    野生探索 --> 任务: 触发事件
    任务 --> 野外探索: 完成任务
    
    野外探索 --> 地牢: 进入地牢
    地牢 --> 地牢战斗: 遭遇怪物
    地牢战斗 --> 地牢胜利: 击败怪物
    地牢胜利 --> 下一层: 找到出口
    下一层 --> 地牢: 下潜
    地牢战斗 --> 返回地面: 使用穿洞绳/逃跑
    返回地面 --> 野外探索
    
    地牢 --> 地牢BOSS: 到达BOSS层
    地牢BOSS --> 游戏通关: 击败最终BOSS
    游戏通关 --> 转生: 转生系统
    转生 --> [*]: 新周目
```

### 4.2 角色状态变化

```mermaid
graph LR
    subgraph 时间流逝影响
        T[经过时间] --> A[饱食度下降]
        T --> B[水分下降]
        T --> C[体温调节]
        T --> D[体力恢复]
    end
    
    subgraph 状态影响
        A --> E[饱食度低: HP恢复-50%]
        B --> F[水分低: san下降]
        C --> G[温度异常: debuff]
        D --> H[体力充足: 可行动]
    end
    
    subgraph 恢复手段
        I[进食] --> A
        J[饮水] --> B
        K[衣物/环境] --> C
        L[休息/睡眠] --> D
    end
```

## 5. 战斗系统流程

```mermaid
sequenceDiagram
    participant Player as 玩家
    participant Combat as 战斗系统
    participant Enemy as 怪物数据
    participant Calc as 计算系统

    Player->>Combat: 遭遇怪物
    Combat->>Enemy: 读取怪物数据
    Enemy-->>Combat: 返回属性
    
    loop 战斗回合
        Combat->>Calc: 计算双方攻速
        Calc-->>Combat: 确定行动顺序
        
        alt 玩家先攻
            Combat->>Calc: 计算命中率
            Calc-->>Combat: 命中判定
            Combat->>Calc: 计算伤害
            Calc-->>Combat: 最终伤害值
            Combat->>Enemy: 扣除怪物HP
        else 怪物先攻
            Combat->>Calc: 计算怪物命中
            Calc-->>Combat: 命中判定
            Combat->>Calc: 计算怪物伤害
            Calc-->>Combat: 最终伤害值
            Combat->>Player: 扣除玩家HP/PS
        end
        
        Combat->>Combat: 检查胜负条件
    end
    
    alt 玩家胜利
        Combat->>Calc: 计算战利品
        Calc-->>Combat: 掉落物品
        Combat-->>Player: 返回奖励
    else 逃跑
        Combat->>Calc: 计算追击概率
        Calc-->>Combat: 是否追击
        alt 被追击
            Combat-->>Player: 强制战斗
        else 逃脱成功
            Combat-->>Player: 返回探索
        end
    end
```

## 6. 制造系统流程

```mermaid
flowchart TD
    A[打开工作台] --> B[选择配方]
    B --> C{材料是否充足?}
    C -->|否| D[显示需求清单]
    D --> B
    C -->|是| E{是否满足前置条件?}
    E -->|否| F[显示科技/事件需求]
    F --> B
    E -->|是| G[开始制造]
    G --> H[消耗材料]
    H --> I[进入制造队列]
    I --> J[等待时间完成]
    J --> K{制造成功?}
    K -->|是| L[获得物品]
    L --> M{是否解锁新配方?}
    M -->|是| N[提示新配方]
    M -->|否| O[继续]
    K -->|否| P[制造失败 - 物品损坏]
    N --> O
    P --> O
    O --> A
```

## 7. 任务链系统

```mermaid
graph TD
    subgraph 村长任务链
        A[robberQuestGet] -->|接受任务| B[robberQuest]
        B -->|击杀盗贼| C[spiderQuestGet]
        C -->|接受任务| D[spiderQuest]
        D -->|击杀蛛魔之后| E[dragonQuestGet]
        E -->|接受任务| F[dragonQuest]
        F -->|击杀龙王| G[gulf]
        G -->|对话水手| H[藏宝湾解锁]
    end
    
    subgraph 地精工匠链
        I[goblin] -->|修车| J[goblin_1]
        J -->|学罗盘| K[goblin_2]
        K -->|学干扰装置| L[goblin_3]
        L -->|学急冻枪| M[goblin_4]
        M -->|学探测帽| N[goblin_5]
        N -->|学车床| O[goblin_end]
        O -->|商店开启| P[购买零件]
    end
    
    subgraph 战争阵营
        Q[iceTownEvent] -->|选食人魔| R[iceTownEvent_1]
        R --> S[iceTownEvent_2]
        S --> T[iceTownEvent_3]
        T --> U[iceTownEvent_end]
        
        Q -->|选法师| V[fireTownEvent_1]
        V --> W[fireTownEvent_2]
        W --> X[fireTownEvent_3]
        X --> Y[fireTownEvent_end]
    end
```

## 8. 地牢系统架构

```mermaid
graph TB
    subgraph 地牢入口
        A[dungeon入口] --> B{检查钥匙}
        B -->|无| C[提示需要钥匙]
        B -->|有| D[选择目标层数]
    end
    
    subgraph 地牢层级
        D --> E[第N层]
        E --> F[怪物生成]
        F --> G[战斗]
        G --> H{结果}
        H -->|胜利| I[奖励结算]
        H -->|失败| J[返回上一存档点]
        I --> K{找到出口?}
        K -->|是| L[下层/通关]
        K -->|否| E
        L -->|未到16层| E
        L -->|16层通关| M[击败星尘鱼]
    end
    
    subgraph 特殊机制
        N[穿洞绳] --> O[返回已到达的任意层]
        P[钥匙] --> Q[打开宝箱]
        R[药水] --> S[恢复状态]
    end
```

## 9. 经济系统闭环

```mermaid
flowchart LR
    subgraph 资源获取
        A[采集]
        B[战斗掉落]
        C[任务奖励]
        D[陷阱捕获]
        E[种植收获]
    end
    
    subgraph 资源消耗
        F[制造装备]
        G[购买物品]
        H[技能学习]
        I[建筑升级]
    end
    
    subgraph 能力提升
        J[战斗力提升]
    end
    
    A --> F
    B --> F
    C --> G
    D --> F
    E --> F
    
    F --> J
    G --> J
    H --> J
    I --> J
    
    J --> B
    J --> C
```

## 10. 组件之间的关系图

```mermaid
classDiagram
    class App {
        +playerState
        +bag
        +currentEquip
        +useTime()
        +fightMst()
        +makeItem()
    }
    
    class ItemComponent {
        +item
        +amount
        +itemMouseClick()
    }
    
    class PlaceComponent {
        +placeId
        +collectResource()
        +fight()
    }
    
    class DungeonComponent {
        +currentFloor
        +dungeonFight()
        +descend()
    }
    
    class MakeTable {
        +queue
        +addToQueue()
    }
    
    class Bag {
        +things
        +capacity
    }
    
    class CombatSystem {
        +calculateDamage()
        +calculateHit()
        +determineOrder()
    }
    
    App --> ItemComponent : contains
    App --> PlaceComponent : manages
    App --> DungeonComponent : manages
    App --> MakeTable : manages
    App --> Bag : manages
    App --> CombatSystem : uses
    
    PlaceComponent --> CombatSystem : triggers
    DungeonComponent --> CombatSystem : triggers
```

这是一个完整的、自洽的游戏系统架构，涵盖了从UI层到数据层的完整技术栈。
