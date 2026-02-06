import React, { useEffect, useRef } from 'react';

interface EffectsLayerProps {
  effectType: 'CRACK' | 'NONE';
  isActive: boolean;
  onAnimationComplete: () => void;
}

export const EffectsLayer: React.FC<EffectsLayerProps> = ({ effectType, isActive, onAnimationComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive || effectType === 'NONE') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to match parent
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = canvas.parentElement?.clientHeight || 800;

    if (effectType === 'CRACK') {
      drawCracks(ctx, canvas.width, canvas.height);
      setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onAnimationComplete();
      }, 1500); // Cracks stay for 1.5s
    }

  }, [effectType, isActive, onAnimationComplete]);

  const drawCracks = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = '#3f1a1a'; // Dark brown/red
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    // Create 3-5 random cracks originating from center
    const numCracks = 5;
    const cx = w / 2;
    const cy = h / 2;

    for (let i = 0; i < numCracks; i++) {
      let x = cx;
      let y = cy;
      const angle = (Math.PI * 2 * i) / numCracks + (Math.random() * 0.5 - 0.25);
      const length = Math.min(w, h) * 0.4 + Math.random() * 100;
      
      ctx.beginPath();
      ctx.moveTo(x, y);

      // Jagged line
      let currentLen = 0;
      while(currentLen < length) {
        const step = 20 + Math.random() * 20;
        currentLen += step;
        
        // Add random deviation to angle
        const dev = (Math.random() - 0.5) * 1.5; 
        
        x += Math.cos(angle + dev) * step;
        y += Math.sin(angle + dev) * step;
        
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  };

  if (!isActive) return null;

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-30"
    />
  );
};
