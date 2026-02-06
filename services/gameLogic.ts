import { BOARD_SIZE, Player, Point } from '../types';

export class GameLogic {
  
  // Check if the board is full
  static checkDraw(board: Player[][]): boolean {
    return board.every(row => row.every(cell => cell !== Player.None));
  }

  // Check for 5 in a row
  static checkWin(board: Player[][], r: number, c: number, player: Player): boolean {
    const directions = [
      [0, 1],   // Horizontal
      [1, 0],   // Vertical
      [1, 1],   // Diagonal \
      [1, -1]   // Diagonal /
    ];

    for (const [dr, dc] of directions) {
      let count = 1;
      
      // Check forward
      for (let i = 1; i < 5; i++) {
        const nr = r + dr * i;
        const nc = c + dc * i;
        if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE || board[nr][nc] !== player) break;
        count++;
      }
      
      // Check backward
      for (let i = 1; i < 5; i++) {
        const nr = r - dr * i;
        const nc = c - dc * i;
        if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE || board[nr][nc] !== player) break;
        count++;
      }

      if (count >= 5) return true;
    }
    return false;
  }

  // Simple heuristic AI
  static getBestMove(board: Player[][], aiPlayer: Player): Point | null {
    const opponent = aiPlayer === Player.Black ? Player.White : Player.Black;
    let bestScore = -Infinity;
    let bestMoves: Point[] = [];

    // Valid moves
    const validMoves: Point[] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (board[r][c] === Player.None) {
          // Optimization: Only consider moves near existing pieces
          if (this.hasNeighbor(board, r, c)) {
            validMoves.push({ r, c });
          }
        }
      }
    }

    // If board is empty, start center
    if (validMoves.length === 0 && board[6][6] === Player.None) {
      return { r: 6, c: 6 };
    }

    for (const move of validMoves) {
      // Offensive score
      const attackScore = this.evaluatePosition(board, move.r, move.c, aiPlayer);
      // Defensive score (block opponent)
      const defendScore = this.evaluatePosition(board, move.r, move.c, opponent);
      
      // Weight defense slightly higher to survive, or offense if winning is imminent
      const score = attackScore + (defendScore * 0.9);

      if (score > bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) {
        bestMoves.push(move);
      }
    }

    if (bestMoves.length > 0) {
      return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }
    return null;
  }

  private static hasNeighbor(board: Player[][], r: number, c: number): boolean {
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        if (i === 0 && j === 0) continue;
        const nr = r + i, nc = c + j;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] !== Player.None) {
          return true;
        }
      }
    }
    return false;
  }

  // Evaluate a specific cell for a player
  private static evaluatePosition(board: Player[][], r: number, c: number, player: Player): number {
    let totalScore = 0;
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (const [dr, dc] of directions) {
      let count = 1;
      let blockedEnds = 0;

      // Check forward
      let i = 1;
      while (true) {
        const nr = r + dr * i;
        const nc = c + dc * i;
        if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) { blockedEnds++; break; }
        if (board[nr][nc] === Player.None) break;
        if (board[nr][nc] !== player) { blockedEnds++; break; }
        count++;
        i++;
      }

      // Check backward
      i = 1;
      while (true) {
        const nr = r - dr * i;
        const nc = c - dc * i;
        if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) { blockedEnds++; break; }
        if (board[nr][nc] === Player.None) break;
        if (board[nr][nc] !== player) { blockedEnds++; break; }
        count++;
        i++;
      }

      // Score logic
      if (count >= 5) totalScore += 100000;
      else if (count === 4 && blockedEnds === 0) totalScore += 10000;
      else if (count === 4 && blockedEnds === 1) totalScore += 1000;
      else if (count === 3 && blockedEnds === 0) totalScore += 1000;
      else if (count === 3 && blockedEnds === 1) totalScore += 100;
      else if (count === 2 && blockedEnds === 0) totalScore += 100;
      else if (count === 2 && blockedEnds === 1) totalScore += 10;
    }
    return totalScore;
  }
}
