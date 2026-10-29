/* ==================== 游戏状态 ==================== */
import type { GameState } from '../core/types';

/** 全局唯一游戏状态对象（联机 state_sync 直接序列化此结构的字段） */
export const G: GameState = {
  players: [],
  deck: [],
  discard: [],
  current: 0,
  started: false,
  myPlayerIdx: 0,
  pendingOptions: null,
  pendingType: 'list',
  pendingResolve: null,
  pendingPlayer: null,
  gameOver: false,
  winnerText: '',
  playerCount: 4,
  settled: false,
  myKills: 0,
  // 回合限时（开局选项，默认关闭）
  timerOn: false,
  timerSec: 20,
  timerEnd: null,
  // 大模型「思考中」座位（默认无）
  thinkingSeat: null,
  // 房主大模型接管开关状态（联机由房主下发给客人端只读展示）
  llmEnabled: false,
  llmTakeoverAll: false,
};
