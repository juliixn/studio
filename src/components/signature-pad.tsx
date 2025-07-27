"use client";

import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { cn } from '@/lib/utils';

export interface SignaturePadRef {
  clear: () => void;
  getSignature: () => string | undefined;
  isEmpty: () => boolean;
}

interface SignaturePadProps extends React.CanvasHTMLAttributes<HTMLCanvasElement> {}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(({ className, ...props }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [hasContent, setHasContent] = useState(false);
  
  // This function sets up the canvas size and drawing context
  const configureCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions to match its container for responsiveness
    const { width, height } = canvas.parentElement!.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  useEffect(() => {
    configureCanvas();
    window.addEventListener('resize', configureCanvas);
    return () => {
      window.removeEventListener('resize', configureCanvas);
    };
  }, []);
  
  const getPosition = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = getPosition(e);
    isDrawing.current = true;
    setHasContent(true);
    lastPos.current = pos;
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    const pos = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          setHasContent(false);
        }
      }
    },
    getSignature: () => {
      const canvas = canvasRef.current;
      if (canvas && hasContent) {
        return canvas.toDataURL('image/png');
      }
      return undefined;
    },
    isEmpty: () => !hasContent
  }));

  return (
    <div className={cn("relative w-full h-full touch-none", className)}>
        <canvas 
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          className="absolute top-0 left-0 w-full h-full"
          {...props}
        />
        {!hasContent && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-muted-foreground">Firme aquí</p>
            </div>
        )}
    </div>
  );
});
SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
