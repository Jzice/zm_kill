/* ==================== 扩展包（角色池范围） ====================
 * 掌门杀首版已彻底移除年级 / 科目体系，扩展包仅保留 'all' 单项（junior / senior
 * 仅保留类型以兼容联机协议与存档字段），取池恒返回全量原著角色。
 */
import type { Character, Talent } from '../core/types';
import { CHARACTERS } from './characters';

/** 扩展包：并列的角色池范围选项（首版仅 'all'，junior/senior 仅保留以兼容联机协议与存档字段） */
export type PacketId = 'all' | 'junior' | 'senior';

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

/** 该扩展包是否可被选为「基础包 / 叠加包」（首版恒可） */
export function canEnablePacket(_id: PacketId): boolean {
  return true;
}

/**
 * 按扩展包取角色池（首版仅 'all'，返回全量原著角色）。
 */
export function charPoolForPacket(_packet: PacketId): Character[] {
  return CHARACTERS.slice();
}

export function packetName(id: PacketId): string {
  return PACKETS.find((p) => p.id === id)?.name || '全部';
}

/** 该扩展包的角色总数（首版恒为全量） */
export function packetCharCount(_packet: PacketId): number {
  return CHARACTERS.length;
}
