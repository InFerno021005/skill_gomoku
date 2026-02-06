import React from 'react';
import { Player } from '../types';

interface PieceProps {
  player: Player;
  isRemoving?: boolean;
  isClearing?: boolean;
  onClick?: () => void;
  canInteract: boolean;
}

export const Piece: React.FC<PieceProps> = ({ player, isRemoving, isClearing, onClick, canInteract }) => {
  if (player === Player.None) return null;

  // Visual style for black/white pieces with nice gradients
  const baseStyle = `absolute w-[80%] h-[80%] rounded-full shadow-lg transform transition-all duration-300`;
  const colorStyle = player === Player.Black 
    ? 'bg-gradient-to-br from-gray-700 to-black ring-1 ring-gray-600' 
    : 'bg-gradient-to-br from-white to-gray-300 ring-1 ring-gray-400';

  // Apply animation classes based on props
  let animationClass = 'scale-100 opacity-100';
  if (isRemoving) {
    animationClass = 'animate-throw-out'; // Updated to new faster throw animation
  } else if (isClearing) {
    animationClass = 'animate-slide-off';
  } else {
    // Entry animation - changed from bounce to subtle scale
    animationClass = 'animate-place-piece'; 
  }

  const cursorClass = canInteract ? 'cursor-pointer hover:ring-4 ring-red-500' : 'cursor-default';

  return (
    <div 
      className={`flex items-center justify-center w-full h-full ${cursorClass}`}
      onClick={canInteract ? onClick : undefined}
    >
      <div className={`${baseStyle} ${colorStyle} ${animationClass}`}>
        {/* Shine effect on piece */}
        <div className="absolute top-[15%] left-[15%] w-[30%] h-[30%] rounded-full bg-white opacity-20 filter blur-[1px]"></div>
      </div>
    </div>
  );
};