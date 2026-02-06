export enum Player {
  None = 0,
  Black = 1,
  White = 2,
}

export enum GameMode {
  PvP = 'PvP',
  PvAI = 'PvAI',
}

export enum GameStatus {
  Playing = 'PLAYING',
  Won = 'WON',
  Draw = 'DRAW',
}

export enum SkillType {
  None = 'NONE',
  Delete = 'DELETE',     // 飞沙走石
  Undo = 'UNDO',         // 时光倒流
  Clear = 'CLEAR',       // 保洁上门
  InstantWin = 'WIN',    // 力拔山兮
}

export interface Point {
  r: number;
  c: number;
}

export interface PieceData {
  id: string; // unique ID for animation tracking
  r: number;
  c: number;
  player: Player;
  isRemoving?: boolean; // For 'Delete' animation
  isClearing?: boolean; // For 'Clear' animation
}

export const BOARD_SIZE = 13;
