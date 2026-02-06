import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameLogic } from './services/gameLogic';
import { soundManager } from './services/soundManager';
import { Piece } from './components/Piece';
import { EffectsLayer } from './components/EffectsLayer';
import { BOARD_SIZE, GameMode, GameStatus, PieceData, Player, Point, SkillType } from './types';

// Icons using SVG strings for zero-dep
const Icons = {
  Sand: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M5.5 8.5 9 12l-3.5 3.5L2 12l3.5-3.5Z"/><path d="m12 2 3.5 3.5L12 9 8.5 5.5 12 2Z"/><path d="M18.5 8.5 22 12l-3.5 3.5L15 12l3.5-3.5Z"/><path d="m12 15 3.5 3.5L12 22l-3.5-3.5L12 15Z"/></svg>,
  Time: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
  Broom: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M12 2.5a.5.5 0 0 1 .5.5v3.5a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5h4ZM4 8h11v2H4V8Zm12 0v11.5a2.5 2.5 0 0 1-5 0V8"/><path d="m19.5 8.5-4 12"/></svg>,
  Power: () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M6 3v18"/><path d="M18 3v18"/><path d="M2 12h20"/></svg>,
};

function App() {
  // --- State ---
  const [board, setBoard] = useState<Player[][]>(
    Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(Player.None))
  );
  const [pieces, setPieces] = useState<PieceData[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(Player.Black);
  const [status, setStatus] = useState<GameStatus>(GameStatus.Playing);
  const [mode, setMode] = useState<GameMode>(GameMode.PvAI);
  const [activeSkill, setActiveSkill] = useState<SkillType>(SkillType.None);
  
  // Effects State
  const [isProcessing, setIsProcessing] = useState(false);
  const [crackEffect, setCrackEffect] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [rippleEffect, setRippleEffect] = useState(false);

  // History for Undo
  const historyRef = useRef<PieceData[][]>([]);
  
  // --- Refs ---
  const boardRef = useRef<HTMLDivElement>(null);

  // --- Helpers ---
  const getGridStyle = () => ({
    gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
  });

  const saveHistory = () => {
    // Deep copy current pieces
    const currentSnapshot = JSON.parse(JSON.stringify(pieces));
    historyRef.current.push(currentSnapshot);
  };

  const handleWin = (winner: Player) => {
    setStatus(GameStatus.Won);
    soundManager.playWin();
    // alert(`${winner === Player.Black ? 'Black' : 'White'} Wins!`);
  };

  const checkGameStatus = (currentBoard: Player[][], r: number, c: number, player: Player) => {
    if (GameLogic.checkWin(currentBoard, r, c, player)) {
      handleWin(player);
      return true;
    }
    if (GameLogic.checkDraw(currentBoard)) {
      setStatus(GameStatus.Draw);
      return true;
    }
    return false;
  };

  // --- Actions ---

  const placePiece = useCallback((r: number, c: number, player: Player) => {
    saveHistory();
    soundManager.playPlacePiece();

    const newPiece: PieceData = {
      id: `${r}-${c}-${Date.now()}`,
      r, c, player
    };

    setPieces(prev => [...prev, newPiece]);
    setBoard(prev => {
      const newBoard = prev.map(row => [...row]);
      newBoard[r][c] = player;
      return newBoard;
    });

    const isGameOver = checkGameStatus(board, r, c, player); // Note: passing 'board' here is slightly stale but logic checks specific coords. 
    // Actually, let's reconstruct temp board for check
    const tempBoard = board.map(row => [...row]);
    tempBoard[r][c] = player;
    
    if (GameLogic.checkWin(tempBoard, r, c, player)) {
      handleWin(player);
      return;
    }

    if (!isGameOver) {
      setCurrentPlayer(prev => prev === Player.Black ? Player.White : Player.Black);
    }
  }, [board, pieces]);


  // --- Skill Implementations ---

  const triggerFlyingSand = (targetId: string) => {
    if (activeSkill !== SkillType.Delete) return;

    soundManager.playWhoosh();
    
    // 1. Animate removal
    setPieces(prev => prev.map(p => p.id === targetId ? { ...p, isRemoving: true } : p));
    setIsProcessing(true);

    // 2. Actually remove after animation
    // Reduced timeout to match faster animation (0.4s)
    setTimeout(() => {
      setPieces(prev => {
        const target = prev.find(p => p.id === targetId);
        if (!target) return prev;
        
        // Update logical board
        setBoard(currentBoard => {
          const newBoard = currentBoard.map(row => [...row]);
          newBoard[target.r][target.c] = Player.None;
          return newBoard;
        });
        
        return prev.filter(p => p.id !== targetId);
      });
      
      setIsProcessing(false);
      setActiveSkill(SkillType.None); // Skill used
    }, 400); 
  };

  const triggerTimeRewind = () => {
    if (historyRef.current.length === 0) return;
    
    soundManager.playSkillTrigger('Undo');
    setIsProcessing(true);
    setRippleEffect(true);

    setTimeout(() => {
      // Restore state
      const previousPieces = historyRef.current.pop();
      if (previousPieces) {
        setPieces(previousPieces);
        
        // Rebuild board grid from pieces
        const newBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(Player.None));
        previousPieces.forEach(p => {
          newBoard[p.r][p.c] = p.player;
        });
        setBoard(newBoard);
        
        // Switch turn back
        setCurrentPlayer(prev => prev === Player.Black ? Player.White : Player.Black);
      }
      
      setRippleEffect(false);
      setIsProcessing(false);
      setActiveSkill(SkillType.None);
    }, 600);
  };

  const triggerCleaningService = () => {
    soundManager.playSkillTrigger('Clear');
    setIsProcessing(true);
    
    // Animate all sliding off
    setPieces(prev => prev.map(p => ({ ...p, isClearing: true })));

    setTimeout(() => {
      setPieces([]);
      setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(Player.None)));
      historyRef.current = []; // Clear history
      
      setIsProcessing(false);
      setActiveSkill(SkillType.None);
    }, 800);
  };

  const triggerOverwhelmingPower = () => {
    soundManager.playCrack();
    setIsProcessing(true);
    setScreenShake(true);
    setCrackEffect(true);

    setTimeout(() => {
      setScreenShake(false);
      handleWin(currentPlayer);
      setIsProcessing(false);
      setActiveSkill(SkillType.None);
    }, 600);
  };


  // --- Interaction Handlers ---

  const handleCellClick = (r: number, c: number) => {
    if (status !== GameStatus.Playing || isProcessing) return;

    // Handle Skill: Flying Sand (Delete) - Clicking on a piece?
    if (activeSkill === SkillType.Delete) {
        // Logic handled in handlePieceClick, but if they click empty cell, cancel skill?
        // Let's keep it simple: cell click does nothing if skill is active unless it's a piece.
        return; 
    }

    // Normal Move
    if (board[r][c] !== Player.None) return;

    placePiece(r, c, currentPlayer);
  };

  const handlePieceClick = (pieceId: string) => {
    if (activeSkill === SkillType.Delete) {
      triggerFlyingSand(pieceId);
    }
  };

  // --- AI Turn Loop ---
  useEffect(() => {
    if (mode === GameMode.PvAI && currentPlayer === Player.White && status === GameStatus.Playing && !isProcessing) {
      // Small delay for realism
      const timer = setTimeout(() => {
        const move = GameLogic.getBestMove(board, Player.White);
        if (move) {
          placePiece(move.r, move.c, Player.White);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, status, mode, isProcessing, board, placePiece]);


  // --- Render ---

  return (
    <div className={`w-full min-h-screen bg-slate-800 flex flex-col items-center justify-center p-4 overflow-hidden relative ${screenShake ? 'animate-shake-screen' : ''}`}>
      
      {/* Visual Effects Overlay */}
      <div className={`fixed inset-0 pointer-events-none transition-all duration-500 z-40 ${rippleEffect ? 'animate-ripple' : ''}`}></div>
      
      {/* Header */}
      <header className="mb-6 text-center z-10">
        <h1 className="text-4xl font-bold text-amber-100 mb-2 drop-shadow-md">技能五子棋</h1>
        <div className="flex gap-4 justify-center text-slate-300">
           <button 
             onClick={() => { setMode(m => m === GameMode.PvAI ? GameMode.PvP : GameMode.PvAI); setPieces([]); setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(Player.None))); setStatus(GameStatus.Playing); setCurrentPlayer(Player.Black); }}
             className="bg-slate-700 px-4 py-1 rounded hover:bg-slate-600 transition"
           >
             模式: {mode === GameMode.PvAI ? '人机对战' : '双人对弈'}
           </button>
           <span className="px-4 py-1 bg-slate-700 rounded border border-slate-600">
             回合: <span className={currentPlayer === Player.Black ? 'text-black font-bold bg-white px-2 rounded-sm' : 'text-white font-bold bg-black px-2 rounded-sm'}>
               {currentPlayer === Player.Black ? '黑子' : '白子'}
             </span>
           </span>
        </div>
      </header>

      {/* Main Game Area */}
      <div className="relative">
        
        {/* Canvas Effect Layer */}
        <EffectsLayer 
          effectType={crackEffect ? 'CRACK' : 'NONE'} 
          isActive={crackEffect} 
          onAnimationComplete={() => setCrackEffect(false)} 
        />

        {/* Board Container */}
        <div 
          ref={boardRef}
          className="relative bg-[#eabb74] rounded-lg shadow-2xl border-[12px] border-[#8b5a2b] select-none"
          style={{ 
            width: 'min(90vw, 600px)', 
            height: 'min(90vw, 600px)',
          }}
        >
            {/* Grid Lines Layer */}
            <div 
              className="absolute inset-4 grid"
              style={getGridStyle()}
            >
              {board.map((row, r) => (
                row.map((cell, c) => (
                  <div 
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className="relative border-slate-900/20 cursor-crosshair hover:bg-black/5"
                  >
                    {/* Cross lines for board intersection look */}
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-800/40"></div>
                    <div className="absolute left-1/2 top-0 h-full w-[1px] bg-slate-800/40"></div>
                    
                    {/* Star points (Hoshi) */}
                    {((r === 3 && c === 3) || (r === 3 && c === 9) || (r === 9 && c === 3) || (r === 9 && c === 9) || (r === 6 && c === 6)) && (
                      <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-slate-800 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                    )}
                  </div>
                ))
              ))}
            </div>

            {/* Pieces Layer (Rendered separately to allow free animations) */}
            <div className="absolute inset-4 pointer-events-none grid" style={getGridStyle()}>
               {/* Just a spacer grid to align pieces correctly */}
               {Array(BOARD_SIZE * BOARD_SIZE).fill(0).map((_, i) => <div key={i}></div>)}
            </div>

            {/* Actual Piece Elements positioned absolutely */}
            {pieces.map((p) => {
              // Calculate percentage position
              const step = 100 / BOARD_SIZE;
              const top = p.r * step;
              const left = p.c * step;
              
              return (
                <div 
                  key={p.id} 
                  className="absolute w-[7.69%] h-[7.69%] pointer-events-auto" // 100 / 13 ~= 7.69%
                  style={{ top: `${top}%`, left: `${left}%` }}
                >
                  <Piece 
                    player={p.player} 
                    isRemoving={p.isRemoving}
                    isClearing={p.isClearing}
                    canInteract={activeSkill === SkillType.Delete && !p.isRemoving}
                    onClick={() => handlePieceClick(p.id)}
                  />
                </div>
              );
            })}
        </div>
      </div>

      {/* Skill Bar */}
      <div className="mt-8 flex gap-4 flex-wrap justify-center z-20">
        
        <SkillButton 
          label="飞沙走石" 
          icon={<Icons.Sand />} 
          active={activeSkill === SkillType.Delete}
          onClick={() => setActiveSkill(activeSkill === SkillType.Delete ? SkillType.None : SkillType.Delete)}
          disabled={status !== GameStatus.Playing || pieces.length === 0}
          color="bg-amber-600"
        />

        <SkillButton 
          label="时光倒流" 
          icon={<Icons.Time />} 
          active={false}
          onClick={triggerTimeRewind}
          disabled={status !== GameStatus.Playing || pieces.length === 0}
          color="bg-blue-600"
        />

        <SkillButton 
          label="保洁上门" 
          icon={<Icons.Broom />} 
          active={false}
          onClick={triggerCleaningService}
          disabled={status !== GameStatus.Playing || pieces.length === 0}
          color="bg-emerald-600"
        />

        <SkillButton 
          label="力拔山兮" 
          icon={<Icons.Power />} 
          active={false}
          onClick={triggerOverwhelmingPower}
          disabled={status !== GameStatus.Playing}
          color="bg-purple-600"
        />

      </div>

      {/* Status Modal */}
      {status !== GameStatus.Playing && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white p-8 rounded-xl text-center shadow-2xl transform scale-110">
            <h2 className="text-4xl font-bold mb-4 text-slate-800">
              {status === GameStatus.Won ? (
                <span>{currentPlayer === Player.Black ? '黑棋' : '白棋'} 获胜！</span>
              ) : '平局！'}
            </h2>
            <button 
              onClick={() => {
                setPieces([]);
                setBoard(Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(Player.None)));
                setStatus(GameStatus.Playing);
                setCurrentPlayer(Player.Black);
                historyRef.current = [];
              }}
              className="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-700 transition"
            >
              再来一局
            </button>
          </div>
        </div>
      )}

      {activeSkill === SkillType.Delete && (
        <div className="fixed top-20 bg-amber-600 text-white px-4 py-2 rounded-full shadow-lg animate-bounce z-50 pointer-events-none">
          点击棋子将其移除！
        </div>
      )}
    </div>
  );
}

// Sub-component for buttons
const SkillButton = ({ label, icon, onClick, disabled, active, color }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      flex flex-col items-center justify-center p-3 w-24 h-24 rounded-xl shadow-lg border-b-4 border-black/20
      transition-all duration-200 active:translate-y-1 active:border-b-0
      ${disabled ? 'bg-gray-500 opacity-50 cursor-not-allowed' : color}
      ${active ? 'ring-4 ring-white scale-105' : 'hover:brightness-110'}
      text-white
    `}
  >
    <div className="mb-1">{icon}</div>
    <span className="text-xs font-bold leading-tight">{label}</span>
  </button>
);

export default App;