'use client';

import { GraphNode, GraphEdgeUI } from '@/types';
import dynamic from 'next/dynamic';
import { useCallback, useRef, useEffect, useState } from 'react';

// react-force-graph-2d requires exactly this dynamic import pattern for Next.js app router 
// to prevent window is not defined errors during SSR
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const graphRef = useRef<any>(null);

  // Map nodes and edges for ForceGraph
  const graphData = {
    nodes: nodes.map(n => ({ ...n, val: n.type === 'clause' ? 1.5 : 2.5 })), // Adjust node size based on type
    links: edges.map(e => ({ ...e, source: e.source, target: e.target }))
  };

  // Resize observer to keep the graph canvas perfectly responsive
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        if (entries[0]) {
          const { width, height } = entries[0].contentRect;
          setDimensions({ width, height });
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    if (onNodeClick) {
      onNodeClick(node as GraphNode);
    }
  }, [onNodeClick]);

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
      {nodes.length > 0 ? (
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="label"
          nodeColor={(node: any) => NODE_COLORS[node.type as keyof typeof NODE_COLORS]?.fill || '#999'}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.label.length > 18 ? node.label.slice(0, 16) + '...' : node.label;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px "DM Mono", monospace`;

            const colors = NODE_COLORS[node.type as keyof typeof NODE_COLORS];
            const isSelected = selectedNodeId === node.id;
            const radius = node.val * 4;

            // Optional glow effect for selected nodes
            if (isSelected) {
              ctx.beginPath();
              ctx.arc(node.x, node.y, radius + 4/globalScale, 0, 2 * Math.PI, false);
              ctx.fillStyle = colors.border;
              ctx.globalAlpha = 0.3;
              ctx.fill();
              ctx.globalAlpha = 1;
            }

            // Draw core node circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = colors.fill;
            ctx.fill();
            ctx.lineWidth = isSelected ? 2/globalScale : 1/globalScale;
            ctx.strokeStyle = colors.border;
            ctx.stroke();

            // Draw text label below the node
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = colors.text;
            ctx.fillText(label, node.x, node.y + radius + fontSize);
          }}
          linkColor={(link: any) => EDGE_COLORS[link.type as keyof typeof EDGE_COLORS] || '#999'}
          linkWidth={(link: any) => link.type === 'conflict' ? 2 : 1}
          linkLineDash={(link: any) => link.type === 'conflict' ? [4, 4] : null}
          onNodeClick={handleNodeClick}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          warmupTicks={100}
        />
      ) : (
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
          No graph data yet.<br />
          Upload contracts and run analysis to build the graph.
        </div>
      )}
    </div>
  );
}
