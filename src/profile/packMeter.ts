/* ==================== 扩展包使用计量（首版简化） ====================
 * 掌门杀首版去掉学分经济：扩展包（全部 / 初中 / 高中）均为免费并列选项，
 * 本模块保留原有接口以兼容调用方，但不再产生任何计费 / 免费额度约束。
 */
import type { PacketId } from '../data/packets';
import { packTollOf } from '../data/packets';

/** 三种扩展包每天共享的免费使用次数（保留常量以兼容旧的展示代码） */
export const PACK_FREE_DAILY = 3;

/** 跨日重置（首版无计数器，保留空实现） */
export function ensurePackDay(): void {
  /* no-op */
}

/** 今日已用免费次数（首版恒 0） */
export function packFreeUsed(): number {
  return 0;
}

/** 今日剩余免费次数（首版恒为全部额度） */
export function packFreeRemaining(): number {
  return PACK_FREE_DAILY;
}

/** 预览：首版永远免费且可负担 */
export function packUsePreview(ids: PacketId[]): {
  needsPay: boolean;
  toll: number;
  viaFree: boolean;
  affordable: boolean;
} {
  const toll = packTollOf(ids);
  return { needsPay: false, toll, viaFree: false, affordable: true };
}

/** 结算一次扩展包使用：首版恒成功、零消耗 */
export function consumePackUse(ids: PacketId[]): { ok: boolean; viaFree: boolean; toll: number; remaining: number } {
  return { ok: true, viaFree: false, toll: packTollOf(ids), remaining: PACK_FREE_DAILY };
}

/** 该扩展包是否可被选为「基础包 / 叠加包」：首版恒可 */
export function canEnablePacket(_id: PacketId): boolean {
  return true;
}
