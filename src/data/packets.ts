/* ==================== 扩展包（角色池分桶） ====================
 * 掌门杀首版不再区分年级 / 科目，扩展包仅作为「角色池范围」的并列选项，
 * 三个选项取池规则（首版均返回全量角色，主题技能随科目体系一并移除）：
 *   - all     ：包含全部角色
 *   - junior  ：初中扩展包（首版等同全量）
 *   - senior  ：高中扩展包（首版等同全量）
 */
import type { Character, Talent } from '../core/types';
import { CHARACTERS } from './characters';

/** 扩展包：并列的角色池范围选项 */
export type PacketId = 'all' | 'junior' | 'senior';
/** 学段（保留类型以兼容调用方，首版不再用于技能注入） */
export type Stage = 'junior' | 'senior';

export interface Packet {
  id: PacketId;
  name: string;
  icon: string;
  desc: string;
}

/**
 * 已移除学堂杀的年级扩展包（初中 / 高中）：
 * 角色池只有一套原著 48 人，选角改为按「九大门派」筛选（#factionPicker）。
 * 保留 `all` 单项与 PacketId 类型，仅为兼容联机协议与存档字段，不再有分桶语义。
 */
export const PACKETS: Packet[] = [{ id: 'all', name: '全部角色', icon: '📖', desc: '掌门路原著 61 人' }];

/** 扩展包取池阶序（计费 / 合并取最高阶，首版未启用学分） */
export function packetRank(id: PacketId): number {
  return id === 'all' ? 2 : id === 'senior' ? 1 : 0;
}

/** 是否为受额度约束的扩展包（首版均为免费并列选项） */
export function isExpansion(_id: PacketId): boolean {
  return false;
}

/** 合并多个扩展包后的档位（首版恒为 0） */
export function packTollOf(_ids: PacketId[]): number {
  return 0;
}

/** 角色所属学段：首版不再区分，统一返回 senior（保留以兼容调用方） */
export function stageOf(_grade: string): Stage {
  return 'senior';
}

/**
 * 按扩展包为角色追加主题技能（首版随科目体系移除，直接返回原角色）。
 */
export function withPacketSkills(c: Character, _packet: PacketId): Character {
  return c;
}

/**
 * 按扩展包取角色池（首版均不受年级限制，返回全量角色）。
 */
export function charPoolForPacket(_grade: string, _packet: PacketId): Character[] {
  return CHARACTERS.slice();
}

export function packetName(id: PacketId): string {
  return PACKETS.find((p) => p.id === id)?.name || '全部';
}

/** 该扩展包的角色总数（首版恒为全量） */
export function packetCharCount(_packet: PacketId, _grade?: string): number {
  return CHARACTERS.length;
}
