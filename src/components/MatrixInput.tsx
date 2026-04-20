import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { GraphEdge, GraphNode } from "./GraphCanvas";
import { Check } from "lucide-react";

interface Props {
  onApply: (nodes: GraphNode[], edges: GraphEdge[]) => void;
  initialN?: number;
  /** When provided, fills the input cells with these computed values (e.g. final shortest distances). */
  updatedMatrix?: number[][] | null;
}

// Layout nodes in a circle
function layoutNodes(n: number): GraphNode[] {
  const cx = 360;
  const cy = 220;
  const r = Math.min(160, 60 + n * 12);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { id: i, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
}

export function MatrixInput({ onApply, initialN = 4, updatedMatrix = null }: Props) {
  const [n, setN] = useState(initialN);
  const [matrix, setMatrix] = useState<string[][]>(() =>
    Array.from({ length: initialN }, (_, i) =>
      Array.from({ length: initialN }, (_, j) => (i === j ? "0" : "")),
    ),
  );
  const [error, setError] = useState<string | null>(null);

  // Resize matrix when n changes
  useEffect(() => {
    setMatrix((prev) => {
      const next: string[][] = [];
      for (let i = 0; i < n; i++) {
        const row: string[] = [];
        for (let j = 0; j < n; j++) {
          if (i === j) row.push("0");
          else row.push(prev[i]?.[j] ?? "");
        }
        next.push(row);
      }
      return next;
    });
  }, [n]);

  const updateCell = (i: number, j: number, val: string) => {
    // Only allow numbers, empty, or "inf"/"∞"
    if (val !== "" && val !== "-" && !/^-?\d*\.?\d*$/.test(val) && val.toLowerCase() !== "inf") {
      return;
    }
    setMatrix((m) => m.map((row, ri) => (ri === i ? row.map((c, ci) => (ci === j ? val : c)) : row)));
  };

  const apply = () => {
    setError(null);
    if (n < 2) {
      setError("Need at least 2 nodes.");
      return;
    }
    if (n > 12) {
      setError("Max 12 nodes for visualization.");
      return;
    }
    const edges: GraphEdge[] = [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const raw = matrix[i][j].trim().toLowerCase();
        if (raw === "" || raw === "inf" || raw === "∞" || raw === "-") continue;
        const w = Number(raw);
        if (!Number.isFinite(w)) {
          setError(`Invalid value at [${i}][${j}]: "${matrix[i][j]}"`);
          return;
        }
        edges.push({ from: i, to: j, weight: w });
      }
    }
    const nodes = layoutNodes(n);
    onApply(nodes, edges);
  };

  const fillEmpty = () => {
    setMatrix((m) =>
      m.map((row, i) => row.map((c, j) => (i === j ? "0" : c === "" ? "∞" : c))),
    );
  };

  const clearMatrix = () => {
    setMatrix(
      Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => (i === j ? "0" : "")),
      ),
    );
  };

  return (
    <div className="rounded-xl bg-gradient-card border border-border/50 shadow-elegant p-5">
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">
            Number of Nodes
          </Label>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setN((v) => Math.max(2, v - 1))}
              disabled={n <= 2}
              className="h-10 w-10"
            >
              −
            </Button>
            <Input
              type="number"
              min={2}
              max={12}
              value={n}
              onChange={(e) => {
                const raw = parseInt(e.target.value);
                if (Number.isNaN(raw)) return;
                setN(Math.max(2, Math.min(12, raw)));
              }}
              className="w-16 text-center font-bold text-lg"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setN((v) => Math.min(12, v + 1))}
              disabled={n >= 12}
              className="h-10 w-10"
            >
              +
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground flex-1 min-w-[200px]">
          Enter edge weights in the adjacency matrix below. Leave a cell{" "}
          <span className="text-foreground">empty</span> (or type <code>inf</code>) for no edge.
          Diagonal is always 0.
        </p>
      </div>

      <div className="overflow-auto">
        <table className="border-separate border-spacing-1 mx-auto">
          <thead>
            <tr>
              <th className="w-10 h-10"></th>
              {Array.from({ length: n }).map((_, j) => (
                <th key={j} className="w-14 text-center text-xs font-semibold text-primary">
                  {j}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: n }).map((_, i) => (
              <tr key={i}>
                <th className="w-10 h-10 text-center text-xs font-semibold text-primary">{i}</th>
                {Array.from({ length: n }).map((_, j) => (
                  <td key={j}>
                    <input
                      value={matrix[i]?.[j] ?? ""}
                      onChange={(e) => updateCell(i, j, e.target.value)}
                      disabled={i === j}
                      placeholder={i === j ? "0" : "∞"}
                      className={`w-14 h-10 rounded-md text-center text-sm font-mono border transition-smooth focus:outline-none focus:ring-2 focus:ring-ring ${
                        i === j
                          ? "bg-muted/40 text-muted-foreground border-transparent"
                          : "bg-input/60 text-foreground border-border/60 hover:border-primary/60"
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <p className="mt-3 text-sm text-destructive text-center">{error}</p>
      )}

      <div className="mt-5 flex flex-wrap gap-2 justify-center">
        <Button
          onClick={apply}
          className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 transition-smooth"
        >
          <Check className="mr-2 h-4 w-4" /> Build Graph
        </Button>
        <Button onClick={fillEmpty} variant="secondary">
          Fill empties with ∞
        </Button>
        <Button onClick={clearMatrix} variant="outline">
          Clear
        </Button>
      </div>
    </div>
  );
}
