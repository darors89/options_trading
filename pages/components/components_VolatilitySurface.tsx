// components/VolatilitySurface.tsx
import { useEffect, useRef, useState } from 'react';

interface VolPoint {
  strike: number;
  dte: number;
  iv: number;
  isUsed?: boolean;
}

interface VolatilitySurfaceProps {
  legs: Array<{
    strike: number;
    premium: number;
  }>;
  stockPrice: number;
  currentDTE: number;
}

export default function VolatilitySurface({ legs, stockPrice, currentDTE }: VolatilitySurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState({ x: 45, y: 45 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Generate sample volatility surface data
  const generateSurfaceData = (): VolPoint[] => {
    const data: VolPoint[] = [];
    
    // Strikes: from 70% to 130% of stock price
    const strikes = Array.from({ length: 15 }, (_, i) => 
      stockPrice * (0.7 + i * 0.04)
    );
    
    // DTEs: from 7 to 180 days
    const dtes = [7, 14, 30, 60, 90, 120, 180];
    
    strikes.forEach(strike => {
      dtes.forEach(dte => {
        // Simple IV smile model (ATM lowest, wings higher)
        const moneyness = strike / stockPrice;
        const atmDistance = Math.abs(moneyness - 1);
        
        // Base IV increases with time
        const baseIV = 0.20 + (dte / 365) * 0.15;
        
        // Smile effect
        const smileEffect = atmDistance * 0.3;
        
        // Add some randomness
        const noise = (Math.random() - 0.5) * 0.02;
        
        const iv = baseIV + smileEffect + noise;
        
        // Check if this point is used in the strategy
        const isUsed = legs.some(leg => 
          Math.abs(leg.strike - strike) < stockPrice * 0.02 &&
          Math.abs(dte - currentDTE) < 5
        );
        
        data.push({ strike, dte, iv, isUsed });
      });
    });
    
    return data;
  };

  const [surfaceData] = useState(() => generateSurfaceData());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, width, height);

    // 3D projection parameters
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 150;

    // Rotation matrices
    const rotX = rotation.x * Math.PI / 180;
    const rotY = rotation.y * Math.PI / 180;

    // Project 3D point to 2D
    const project = (x: number, y: number, z: number) => {
      // Rotate around Y axis
      let x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
      let z1 = x * Math.sin(rotY) + z * Math.cos(rotY);
      
      // Rotate around X axis
      let y1 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
      let z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);
      
      // Project to 2D
      return {
        x: centerX + x1 * scale,
        y: centerY - y1 * scale,
        z: z2,
      };
    };

    // Normalize data for visualization
    const strikeRange = [Math.min(...surfaceData.map(p => p.strike)), Math.max(...surfaceData.map(p => p.strike))];
    const dteRange = [Math.min(...surfaceData.map(p => p.dte)), Math.max(...surfaceData.map(p => p.dte))];
    const ivRange = [Math.min(...surfaceData.map(p => p.iv)), Math.max(...surfaceData.map(p => p.iv))];

    const normalize = (value: number, range: number[]) => 
      (value - range[0]) / (range[1] - range[0]) * 2 - 1;

    // Draw grid
    ctx.strokeStyle = '#1e3a8a30';
    ctx.lineWidth = 0.5;

    // Grid lines - Strike
    for (let i = 0; i <= 10; i++) {
      const x = -1 + i * 0.2;
      ctx.beginPath();
      for (let j = 0; j <= 10; j++) {
        const y = -1 + j * 0.2;
        const z = 0;
        const p = project(x, y, z);
        if (j === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // Grid lines - DTE
    for (let j = 0; j <= 10; j++) {
      const y = -1 + j * 0.2;
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        const x = -1 + i * 0.2;
        const z = 0;
        const p = project(x, y, z);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // Draw surface points
    const projectedPoints = surfaceData.map(point => {
      const x = normalize(point.strike, strikeRange);
      const y = normalize(point.dte, dteRange);
      const z = normalize(point.iv, ivRange);
      
      return {
        ...project(x, y, z),
        iv: point.iv,
        isUsed: point.isUsed,
      };
    });

    // Sort by z-depth for proper rendering
    projectedPoints.sort((a, b) => a.z - b.z);

    // Draw points
    projectedPoints.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.isUsed ? 6 : 2, 0, Math.PI * 2);
      
      if (point.isUsed) {
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      } else {
        // Color by IV
        const normalized = (point.iv - ivRange[0]) / (ivRange[1] - ivRange[0]);
        const hue = (1 - normalized) * 240; // Blue (low IV) to Red (high IV)
        ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.6)`;
        ctx.fill();
      }
    });

    // Draw axes labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px Inter';
    
    // Strike axis
    const strikeAxisEnd = project(1.2, -1, 0);
    ctx.fillText('Strike →', strikeAxisEnd.x, strikeAxisEnd.y);
    
    // DTE axis
    const dteAxisEnd = project(-1, 1.2, 0);
    ctx.fillText('DTE →', dteAxisEnd.x, dteAxisEnd.y - 10);
    
    // IV axis
    const ivAxisEnd = project(-1, -1, 1.2);
    ctx.fillText('↑ IV', ivAxisEnd.x - 20, ivAxisEnd.y);

  }, [surfaceData, rotation]);

  // Handle mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    setRotation(prev => ({
      x: Math.max(-90, Math.min(90, prev.x + dy * 0.5)),
      y: (prev.y + dx * 0.5) % 360,
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="bg-[#0d1135]/40 border border-blue-900/30 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-light text-blue-200">Volatility Surface</h3>
        <div className="text-xs text-gray-500">Drag to rotate</div>
      </div>

      <canvas
        ref={canvasRef}
        width={700}
        height={500}
        className="w-full cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Low IV</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>High IV</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full border-2 border-amber-300"></div>
            <span>Strategy Options</span>
          </div>
        </div>
        <div className="text-gray-500">
          Rotation: X={rotation.x.toFixed(0)}° Y={rotation.y.toFixed(0)}°
        </div>
      </div>
    </div>
  );
}
