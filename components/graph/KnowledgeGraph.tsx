'use client';

import { GraphNode, GraphEdgeUI } from '@/types';
import { useEffect, useRef, useState } from 'react';

interface KnowledgeGraphProps {
  nodes: GraphNode[];
  edges: GraphEdgeUI[];
  onNodeClick?: (node: GraphNode) => void;
  selectedNodeId?: string | null;
}

const NODE_COLORS = {
  contract: { border: '#7DDECB', fill: '#0D2030', text: '#7DDECB' },
  document: { border: '#534AB7', fill: '#160D2A', text: '#AFA9EC' },
  clause: { border: '#3B6D11', fill: '#0D1A08', text: '#7CC93E' },
};

const EDGE_COLORS = {
  linked: '#1D9E75',
  conflict: '#A32D2D',
};

export default function KnowledgeGraph({
  nodes,
  edges,
  onNodeClick,
  selectedNodeId,
}: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(
    new Map()
  );

  // Simple force-directed layout
  useEffect(() => {
    if (nodes.length === 0) return;

    const pos = new Map<string, { x: number; y: number }>();
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    const cx = width / 2;
    const cy = height / 2;

    // Initialize positions in a circle
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.3;
      pos.set(node.id, {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      });
    });

    // Simple force simulation (50 iterations)
    for (let iter = 0; iter < 50; iter++) {
      // Repulsion between all nodes
      nodes.forEach((a) => {
        nodes.forEach((b) => {
          if (a.id === b.id) return;
          const pA = pos.get(a.id)!;
          const pB = pos.get(b.id)!;
          const dx = pA.x - pB.x;
          const dy = pA.y - pB.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = 5000 / (dist * dist);
          pA.x += (dx / dist) * force;
          pA.y += (dy / dist) * force;
        });
      });

      // Attraction along edges
      edges.forEach((edge) => {
        const pA = pos.get(edge.source);
        const pB = pos.get(edge.target);
        if (!pA || !pB) return;
        const dx = pB.x - pA.x;
        const dy = pB.y - pA.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = (dist - 120) * 0.01;
        pA.x += (dx / dist) * force;
        pA.y += (dy / dist) * force;
        pB.x -= (dx / dist) * force;
        pB.y -= (dy / dist) * force;
      });

      // Center gravity
      nodes.forEach((node) => {
        const p = pos.get(node.id)!;
        p.x += (cx - p.x) * 0.01;
        p.y += (cy - p.y) * 0.01;
      });
    }

    setPositions(pos);
  }, [nodes, edges]);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || positions.size === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = '#0A0F16';
    ctx.fillRect(0, 0, width, height);

    // Draw edges
    edges.forEach((edge) => {
      const from = positions.get(edge.source);
      const to = positions.get(edge.target);
      if (!from || !to) return;

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = EDGE_COLORS[edge.type];
      ctx.lineWidth = edge.type === 'conflict' ? 2 : 1.5;
      if (edge.type === 'conflict') {
        ctx.setLineDash([6, 4]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    });

    // Draw nodes
    nodes.forEach((node) => {
      const pos = positions.get(node.id);
      if (!pos) return;

      const colors = NODE_COLORS[node.type];
      const isSelected = selectedNodeId === node.id;
      const radius = node.type === 'clause' ? 16 : 22;

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = colors.fill;
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#fff' : colors.border;
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.stroke();

      // Glow for selected
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = colors.border;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Label
      ctx.fillStyle = colors.text;
      ctx.font = '11px "DM Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const label =
        node.label.length > 18 ? node.label.slice(0, 16) + '...' : node.label;
      ctx.fillText(label, pos.x, pos.y + radius + 6);
    });
  }, [positions, nodes, edges, selectedNodeId]);

  // Handle click
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onNodeClick) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const node of nodes) {
      const pos = positions.get(node.id);
      if (!pos) continue;
      const dx = x - pos.x;
      const dy = y - pos.y;
      const radius = node.type === 'clause' ? 16 : 22;
      if (dx * dx + dy * dy <= (radius + 4) * (radius + 4)) {
        onNodeClick(node);
        return;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{
          width: '100%',
          height: '100%',
          cursor: 'pointer',
        }}
      />
      {nodes.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'var(--text-muted)',
            fontSize: '14px',
            textAlign: 'center',
          }}
        >
          No graph data yet.
          <br />
          Upload contracts and run analysis to build the graph.
        </div>
      )}
    </div>
  );
}
