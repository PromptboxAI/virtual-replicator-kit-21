import React, { useEffect, useRef } from 'react';
import { useAgents } from '@/hooks/useAgents';

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
  const { agents, loading } = useAgents();
  
  // Generate nodes from database agents
  const generateNodes = (): Node[] => {
    if (loading || agents.length === 0) return [];
    
    const colors = [
      'hsl(261, 83%, 58%)', // Purple
      'hsl(192, 100%, 50%)', // Cyan
      'hsl(142, 76%, 36%)', // Green
      'hsl(45, 93%, 47%)', // Yellow
      'hsl(0, 72%, 51%)', // Red
      'hsl(262, 52%, 47%)', // Indigo
    ];
    
    // Take first 8 agents and position them in a network layout
    const displayAgents = agents.slice(0, 8);
    
    return displayAgents.map((agent, index) => {
      // Calculate position in a circular pattern with some randomness
      const angle = (index / displayAgents.length) * 2 * Math.PI;
      const radius = 120 + Math.random() * 60;
      const centerX = 200;
      const centerY = 150;
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      // Calculate node size based on market cap
      const marketCap = agent.market_cap || 0;
      const baseRadius = 15;
      const maxRadius = 25;
      const normalizedRadius = baseRadius + (marketCap / 10000000) * (maxRadius - baseRadius);
      
      // Generate some connections to other agents
      const possibleConnections = displayAgents
        .filter((_, i) => i !== index)
        .slice(0, Math.floor(Math.random() * 3) + 1)
        .map(a => a.name);
      
      return {
        id: agent.name,
        name: agent.name,
        x: Math.max(30, Math.min(370, x)), // Keep within bounds
        y: Math.max(30, Math.min(270, y)), // Keep within bounds
        radius: Math.min(maxRadius, Math.max(baseRadius, normalizedRadius)),
        color: colors[index % colors.length],
        connections: possibleConnections,
      };
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || loading || agents.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Generate nodes once when agents load
    const nodes = generateNodes();

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
  }, [agents, loading]);

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