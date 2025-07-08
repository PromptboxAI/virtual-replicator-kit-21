import React, { useEffect, useRef } from 'react';

interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  connections: string[];
}

interface NetworkVisualizationProps {
  className?: string;
}

export function NetworkVisualization({ className }: NetworkVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const nodes: Node[] = [
    { id: 'aixbt', name: 'aixbt', x: 200, y: 150, radius: 25, color: 'hsl(261, 83%, 58%)', connections: ['Luna', 'Zerebro', 'Aelred'] },
    { id: 'Luna', name: 'Luna', x: 100, y: 100, radius: 20, color: 'hsl(192, 100%, 50%)', connections: ['aixbt', 'Degenixi'] },
    { id: 'Zerebro', name: 'Zerebro', x: 300, y: 80, radius: 18, color: 'hsl(142, 76%, 36%)', connections: ['aixbt', 'Athena'] },
    { id: 'Aelred', name: 'Aelred', x: 280, y: 220, radius: 22, color: 'hsl(261, 83%, 58%)', connections: ['aixbt', 'Athena'] },
    { id: 'Degenixi', name: 'Degenixi', x: 50, y: 200, radius: 16, color: 'hsl(192, 100%, 50%)', connections: ['Luna'] },
    { id: 'Athena', name: 'Athena', x: 350, y: 150, radius: 19, color: 'hsl(142, 76%, 36%)', connections: ['Zerebro', 'Aelred'] },
    { id: 'Gigabrain', name: 'Gigabrain', x: 150, y: 250, radius: 17, color: 'hsl(192, 100%, 50%)', connections: ['aixbt'] },
    { id: 'MacOINT', name: 'MacOINT', x: 120, y: 50, radius: 15, color: 'hsl(261, 83%, 58%)', connections: ['Luna'] },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    let time = 0;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.02;

      // Draw connections
      nodes.forEach(node => {
        node.connections.forEach(connId => {
          const connectedNode = nodes.find(n => n.id === connId);
          if (connectedNode) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(connectedNode.x, connectedNode.y);
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });
      });

      // Draw nodes
      nodes.forEach((node, index) => {
        const offsetX = Math.sin(time + index) * 3;
        const offsetY = Math.cos(time + index * 1.5) * 2;
        const currentX = node.x + offsetX;
        const currentY = node.y + offsetY;

        // Node glow
        const gradient = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, node.radius + 10);
        gradient.addColorStop(0, node.color);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(currentX, currentY, node.radius + 10, 0, Math.PI * 2);
        ctx.fill();

        // Node circle
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(currentX, currentY, node.radius, 0, Math.PI * 2);
        ctx.fill();

        // Node border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Node label
        ctx.fillStyle = '#000000';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, currentX, currentY + node.radius + 20);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      />
      <div className="absolute top-4 left-4 text-sm text-foreground font-medium">
        Agent Network
      </div>
    </div>
  );
}