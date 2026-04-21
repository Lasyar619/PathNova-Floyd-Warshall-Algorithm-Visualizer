import { useRef, useState, type MouseEvent } from "react";

export interface GraphNode {
  id: number;
  x: number;
  y: number;
}
export interface GraphEdge {
  from: number;
  to: number;
  weight: number;
}

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  highlightEdges?: { from: number; to: number }[];
  activeNodes?: number[];
  onCanvasClick?: (x: number, y: number) => void;
  onNodeClick?: (id: number) => void;
  onNodeDrag?: (id: number, x: number, y: number) => void;
  onNodeDelete?: (id: number) => void;
  onEdgeDelete?: (from: number, to: number) => void;
  selectedNode?: number | null;
  title: string;
  subtitle?: string;
  height?: number;
}

export function GraphCanvas({
  nodes,
  edges,
  highlightEdges = [],
  activeNodes = [],
  onCanvasClick,
  onNodeClick,
  onNodeDrag,
  onNodeDelete,
  onEdgeDelete,
  selectedNode = null,
  title,
  subtitle,
  height = 420,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragId, setDragId] = useState<number | null>(null);

  const isHighlighted = (a: number, b: number) =>
    highlightEdges.some((e) => e.from === a && e.to === b);

  const getPos = (e: MouseEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleSvgClick = (e: MouseEvent) => {
    if ((e.target as SVGElement).tagName !== "svg") return;
    if (!onCanvasClick) return;
    const { x, y } = getPos(e);
    onCanvasClick(x, y);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (dragId === null || !onNodeDrag) return;
    const { x, y } = getPos(e);
    onNodeDrag(dragId, x, y);
  };

  return (
    <div className="rounded-xl bg-gradient-card border border-border/50 shadow-elegant overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-xs text-muted-foreground">
          {nodes.length} nodes · {edges.length} edges
        </span>
      </div>
      <svg
        ref={svgRef}
        className="w-full block cursor-crosshair"
        style={{ height }}
        onClick={handleSvgClick}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setDragId(null)}
        onMouseLeave={() => setDragId(null)}
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--edge)" />
          </marker>
          <marker
            id="arrow-active"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--edge-active)" />
          </marker>
        </defs>

        {edges.map((e, i) => {
          const a = nodes.find((n) => n.id === e.from);
          const b = nodes.find((n) => n.id === e.to);
          if (!a || !b) return null;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const r = 22;
          const hasReverse = edges.some((o) => o.from === e.to && o.to === e.from);
          const offset = hasReverse ? 6 : 0;
          const px = -dy / len;
          const py = dx / len;
          const sx = a.x + (dx / len) * r + px * offset;
          const sy = a.y + (dy / len) * r + py * offset;
          const ex = b.x - (dx / len) * r + px * offset;
          const ey = b.y - (dy / len) * r + py * offset;
          const mx = (sx + ex) / 2;
          const my = (sy + ey) / 2;
          const labelOffset = hasReverse ? 10 : 12;
          const lx = mx + px * labelOffset;
          const ly = my + py * labelOffset;
          const active = isHighlighted(e.from, e.to);
          const pathD = `M ${sx} ${sy} L ${ex} ${ey}`;
          return (
            <g key={i}>
              <path
                d={pathD}
                fill="none"
                stroke={active ? "var(--edge-active)" : "var(--edge)"}
                strokeWidth={active ? 3 : 2}
                markerEnd={active ? "url(#arrow-active)" : "url(#arrow)"}
                className={active ? "animate-flow" : ""}
              />
              <g
                transform={`translate(${lx}, ${ly})`}
                className={onEdgeDelete ? "cursor-pointer" : ""}
                onClick={(ev) => {
                  if (!onEdgeDelete) return;
                  ev.stopPropagation();
                  onEdgeDelete(e.from, e.to);
                }}
              >
                {onEdgeDelete && <title>Click to delete this edge</title>}
                <rect
                  x={-12}
                  y={-10}
                  width={24}
                  height={20}
                  rx={6}
                  fill="var(--card)"
                  stroke={active ? "var(--edge-active)" : "var(--border)"}
                />
                <text
                  textAnchor="middle"
                  dy="0.35em"
                  fontSize="11"
                  fontWeight="600"
                  fill="var(--foreground)"
                >
                  {e.weight}
                </text>
              </g>
            </g>
          );
        })}

        {nodes.map((n) => {
          const isSelected = selectedNode === n.id;
          const isActive = activeNodes.includes(n.id);
          return (
            <g
              key={n.id}
              transform={`translate(${n.x}, ${n.y})`}
              className="cursor-pointer"
              onMouseDown={() => setDragId(n.id)}
              onClick={(ev) => {
                ev.stopPropagation();
                onNodeClick?.(n.id);
              }}
              onContextMenu={(ev) => {
                if (!onNodeDelete) return;
                ev.preventDefault();
                ev.stopPropagation();
                onNodeDelete(n.id);
              }}
            >
              {onNodeDelete && <title>Right-click to delete this node</title>}
              <circle
                r={26}
                fill="var(--node)"
                opacity={0.2}
                className={isActive ? "animate-pulse-node" : ""}
              />
              <circle
                r={20}
                fill="var(--node)"
                stroke={isSelected ? "var(--accent)" : "var(--foreground)"}
                strokeWidth={isSelected ? 3 : 1.5}
                style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))" }}
              />
              <text
                textAnchor="middle"
                dy="0.35em"
                fontSize="14"
                fontWeight="700"
                fill="var(--node-foreground)"
              >
                {n.id}
              </text>
            </g>
          );
        })}

        {nodes.length === 0 && (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            fill="var(--muted-foreground)"
            fontSize="14"
          >
            Click anywhere to add a node
          </text>
        )}
      </svg>
    </div>
  );
}
