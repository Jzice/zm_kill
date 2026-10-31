// 本文件由 scripts/build-expansion.mjs 生成，请勿手改。
// 单一事实来源：scripts/build-expansion.mjs 的 SEED（12 学期 × 9 学科 = 108 名角色）。
import type { Character, EquipSlot, ItemDef, Talent, SkillEffect } from '../core/types';

export interface EquipDef {
  id: string;
  name: string;
  slot: EquipSlot;
  tier: 1 | 2 | 3 | 4;
  /** 解锁所需年级（商店按年级门槛展示 / 购买） */
  icon: string;
  desc: string;
  /** 装备效果（在 setup 时折算为玩家加成） */
  fx: { range?: number; dmg?: number; reduce?: number; shield?: number; distPlus?: number; distMinus?: number };
}

export const EXPANSION_CHARS: Character[] = [];

export const EXPANSION_SKILLS: Talent[] = [];

export const EXPANSION_EQUIPS: EquipDef[] = [
  {
    "id": "eq_wpn_1",
    "name": "木剑",
    "slot": "weapon",
    "tier": 1,
    "icon": "🗡️",
    "desc": "攻击距离 +1",
    "fx": {
      "range": 1
    }
  },
  {
    "id": "eq_arm_1",
    "name": "布甲",
    "slot": "armor",
    "tier": 1,
    "icon": "🥋",
    "desc": "受到的伤害 -1（每回合限一次）",
    "fx": {
      "reduce": 1
    }
  },
  {
    "id": "eq_hp_1",
    "name": "黄骠马",
    "slot": "horsePlus",
    "tier": 1,
    "icon": "🐎",
    "desc": "其他角色计算与你的距离 +1",
    "fx": {
      "distPlus": 1
    }
  },
  {
    "id": "eq_hm_1",
    "name": "青骢马",
    "slot": "horseMinus",
    "tier": 1,
    "icon": "🐎",
    "desc": "你计算与其他角色的距离 -1",
    "fx": {
      "distMinus": 1
    }
  },
  {
    "id": "eq_wpn_2",
    "name": "精钢剑",
    "slot": "weapon",
    "tier": 2,
    "icon": "⚔️",
    "desc": "攻击距离 +1，攻击伤害 +1",
    "fx": {
      "range": 1,
      "dmg": 1
    }
  },
  {
    "id": "eq_arm_2",
    "name": "锁子甲",
    "slot": "armor",
    "tier": 2,
    "icon": "🛡",
    "desc": "受到的伤害 -1，开局护盾 +1",
    "fx": {
      "reduce": 1,
      "shield": 1
    }
  },
  {
    "id": "eq_hp_2",
    "name": "赤兔马",
    "slot": "horsePlus",
    "tier": 2,
    "icon": "🐴",
    "desc": "其他角色计算与你的距离 +1",
    "fx": {
      "distPlus": 1
    }
  },
  {
    "id": "eq_hm_2",
    "name": "照夜玉狮子",
    "slot": "horseMinus",
    "tier": 2,
    "icon": "🐴",
    "desc": "你计算与其他角色的距离 -1",
    "fx": {
      "distMinus": 1
    }
  },
  {
    "id": "eq_wpn_3",
    "name": "倚天剑",
    "slot": "weapon",
    "tier": 3,
    "icon": "🗡",
    "desc": "攻击距离 +2，攻击伤害 +1",
    "fx": {
      "range": 2,
      "dmg": 1
    }
  },
  {
    "id": "eq_arm_3",
    "name": "金丝甲",
    "slot": "armor",
    "tier": 3,
    "icon": "🛡️",
    "desc": "受到的伤害 -1，开局护盾 +2",
    "fx": {
      "reduce": 1,
      "shield": 2
    }
  },
  {
    "id": "eq_hp_3",
    "name": "的卢",
    "slot": "horsePlus",
    "tier": 3,
    "icon": "🐎",
    "desc": "其他角色计算与你的距离 +1，你计算距离 -1",
    "fx": {
      "distPlus": 1,
      "distMinus": 1
    }
  },
  {
    "id": "eq_hm_3",
    "name": "绝影",
    "slot": "horseMinus",
    "tier": 3,
    "icon": "🐎",
    "desc": "你计算与其他角色的距离 -1，开局护盾 +1",
    "fx": {
      "distMinus": 1,
      "shield": 1
    }
  },
  {
    "id": "eq_wpn_4",
    "name": "方天画戟",
    "slot": "weapon",
    "tier": 4,
    "icon": "🔱",
    "desc": "攻击距离 +2，攻击伤害 +1，开局护盾 +1",
    "fx": {
      "range": 2,
      "dmg": 1,
      "shield": 1
    }
  },
  {
    "id": "eq_arm_4",
    "name": "永动盾",
    "slot": "armor",
    "tier": 4,
    "icon": "🛡",
    "desc": "受到的伤害 -1，开局护盾 +3",
    "fx": {
      "reduce": 1,
      "shield": 3
    }
  },
  {
    "id": "eq_hp_4",
    "name": "神行靴",
    "slot": "horsePlus",
    "tier": 4,
    "icon": "👟",
    "desc": "其他角色计算与你的距离 +2",
    "fx": {
      "distPlus": 2
    }
  },
  {
    "id": "eq_hm_4",
    "name": "缩地符",
    "slot": "horseMinus",
    "tier": 4,
    "icon": "🌀",
    "desc": "你计算与其他角色的距离 -2",
    "fx": {
      "distMinus": 2
    }
  },
  {
    "id": "eq_wpn_5",
    "name": "青釭剑·真",
    "slot": "weapon",
    "tier": 4,
    "icon": "⚔️",
    "desc": "攻击距离 +2，攻击伤害 +2",
    "fx": {
      "range": 2,
      "dmg": 2
    }
  },
  {
    "id": "eq_arm_5",
    "name": "金丝软甲",
    "slot": "armor",
    "tier": 4,
    "icon": "🥋",
    "desc": "受到的伤害 -1，开局护盾 +2，其他角色计算与你的距离 +1",
    "fx": {
      "reduce": 1,
      "shield": 2,
      "distPlus": 1
    }
  }
];

export const EXPANSION_ITEMS: ItemDef[] = [
  {
    "id": "it_reset",
    "name": "温故符",
    "icon": "🔄",
    "desc": "立即温故知新，摸 1 张牌",
    "maxCarry": 3,
    "effects": [
      {
        "kind": "selfDraw",
        "n": 1
      }
    ]
  },
  {
    "id": "it_shield",
    "name": "护身符",
    "icon": "🛡",
    "desc": "获得 1 点护盾（抵挡一次伤害）",
    "maxCarry": 3,
    "effects": [
      {
        "kind": "shield",
        "n": 1
      }
    ]
  },
  {
    "id": "it_draw",
    "name": "灵感符",
    "icon": "✨",
    "desc": "立即摸两张牌",
    "maxCarry": 3,
    "effects": [
      {
        "kind": "selfDraw",
        "n": 2
      }
    ]
  },
  {
    "id": "it_peek",
    "name": "锦囊符",
    "icon": "📜",
    "desc": "令一名角色弃一张手牌",
    "maxCarry": 2,
    "effects": [
      {
        "kind": "targetDiscard",
        "n": 1
      }
    ]
  },
  {
    "id": "it_peek2",
    "name": "拆弹符",
    "icon": "💣",
    "desc": "令一名角色弃两张手牌",
    "maxCarry": 2,
    "effects": [
      {
        "kind": "targetDiscard",
        "n": 2
      }
    ]
  },
  {
    "id": "it_wall",
    "name": "铁壁符",
    "icon": "🧱",
    "desc": "获得 2 点护盾",
    "maxCarry": 2,
    "effects": [
      {
        "kind": "shield",
        "n": 2
      }
    ]
  }
];

export function expansionCharById(id: string): Character | undefined {
  return EXPANSION_CHARS.find((c) => c.id === id);
}
export function expansionEquipById(id: string): EquipDef | undefined {
  return EXPANSION_EQUIPS.find((e) => e.id === id);
}
export function expansionItemById(id: string): ItemDef | undefined {
  return EXPANSION_ITEMS.find((i) => i.id === id);
}
