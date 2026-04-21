import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { GraphCanvas, type GraphEdge, type GraphNode } from "@/components/GraphCanvas";
import { DistanceMatrix } from "@/components/DistanceMatrix";
import { floydWarshall, reconstructPath, INF } from "@/lib/floyd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MatrixInput } from "@/components/MatrixInput";
import { Play, Pause, RotateCcw, Trash2, Sparkles, GitBranch, Zap, Grid3x3, MousePointer2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "PathNova" },
      {
        name: "description",
        content:
          "Interactive Floyd–Warshall visualizer. Build a weighted graph and watch the all-pairs shortest path algorithm animate in real time.",
      },
    ],
  }),
});

const SAMPLE_NODES: GraphNode[] = [
  { id: 0, x: 150, y: 100 },
  { id: 1, x: 420, y: 90 },
  { id: 2, x: 560, y: 280 },
  { id: 3, x: 360, y: 380 },
  { id: 4, x: 120, y: 320 },
];
const SAMPLE_EDGES: GraphEdge[] = [
  { from: 0, to: 1, weight: 4 },
  { from: 0, to: 4, weight: 8 },
  { from: 1, to: 2, weight: 3 },
  { from: 2, to: 3, weight: 2 },
  { from: 3, to: 4, weight: 5 },
  { from: 4, to: 2, weight: 7 },
  { from: 1, to: 3, weight: 9 },
];

function Index() {
  const [nodes, setNodes] = useState<GraphNode[]>(SAMPLE_NODES);
  const [edges, setEdges] = useState<GraphEdge[]>(SAMPLE_EDGES);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [edgeWeight, setEdgeWeight] = useState("1");
  const [inputMode, setInputMode] = useState<"matrix" | "draw">("matrix");

  const [running, setRunning] = useState(false);
  const [stepIdx, setStepIdx] = useState(-1);
  const [speed, setSpeed] = useState(150); // ms per step
  const [finished, setFinished] = useState(false);

  const [pathFrom, setPathFrom] = useState<string>("0");
  const [pathTo, setPathTo] = useState<string>("3");

  const result = useMemo(
    () => floydWarshall(nodes.length, edges),
    [nodes.length, edges],
  );

  const currentStep = stepIdx >= 0 ? result.steps[stepIdx] : null;
  const currentMatrix = currentStep?.matrix ?? result.dist;

  // Animation loop
  useEffect(() => {
    if (!running) return;
    if (stepIdx >= result.steps.length - 1) {
      setRunning(false);
      setFinished(true);
      return;
    }
    const t = setTimeout(() => setStepIdx((s) => s + 1), speed);
    return () => clearTimeout(t);
  }, [running, stepIdx, speed, result.steps.length]);

  const addNodeAt = (x: number, y: number) => {
    const nextId = nodes.length === 0 ? 0 : Math.max(...nodes.map((n) => n.id)) + 1;
    setNodes([...nodes, { id: nextId, x, y }]);
    resetRun();
  };

  const handleNodeClick = (id: number) => {
    if (selectedNode === null) {
      setSelectedNode(id);
    } else if (selectedNode === id) {
      setSelectedNode(null);
    } else {
      const w = parseInt(edgeWeight) || 1;
      const exists = edges.find((e) => e.from === selectedNode && e.to === id);
      if (exists) {
        setEdges(edges.map((e) => (e === exists ? { ...e, weight: w } : e)));
      } else {
        setEdges([...edges, { from: selectedNode, to: id, weight: w }]);
      }
      setSelectedNode(null);
      resetRun();
    }
  };

  const dragNode = (id: number, x: number, y: number) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, x, y } : n)));
  };

  const resetRun = () => {
    setRunning(false);
    setStepIdx(-1);
    setFinished(false);
  };

  const clearAll = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    resetRun();
  };

  const loadSample = () => {
    setNodes(SAMPLE_NODES);
    setEdges(SAMPLE_EDGES);
    setSelectedNode(null);
    resetRun();
  };

  const start = () => {
    if (nodes.length < 2) return;
    if (finished) {
      setStepIdx(-1);
      setFinished(false);
    }
    setRunning(true);
  };

  // Build "shortest path graph": for each pair i!=j with finite dist, draw aggregated edges of the path
  const shortestPathEdges: GraphEdge[] = useMemo(() => {
    if (!finished) return [];
    const out: GraphEdge[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        if (result.dist[i][j] === INF) continue;
        out.push({ from: i, to: j, weight: result.dist[i][j] });
      }
    }
    return out;
  }, [finished, nodes.length, result.dist]);

  const fromN = parseInt(pathFrom);
  const toN = parseInt(pathTo);
  const queryPath =
    finished && !isNaN(fromN) && !isNaN(toN)
      ? reconstructPath(result.next, fromN, toN)
      : [];
  const queryDist =
    finished && !isNaN(fromN) && !isNaN(toN) ? result.dist[fromN]?.[toN] : null;
  const queryHighlight: { from: number; to: number }[] = [];
  for (let i = 0; i < queryPath.length - 1; i++) {
    queryHighlight.push({ from: queryPath[i], to: queryPath[i + 1] });
  }

  const liveHighlight =
    currentStep && currentStep.updated
      ? [{ from: currentStep.i, to: currentStep.j }]
      : [];
  const activeNodes = currentStep ? [currentStep.k] : [];

  return (
    <main className="min-h-screen w-full px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-1.5 mb-4 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Floyd–Warshall · Interactive Visualizer
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <span className="text-gradient">Path</span>Nova
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Build a weighted directed graph, then watch the algorithm relax every pair through
            every intermediate vertex — step by step.
          </p>
        </header>

        {/* Mode Toggle */}
        <div className="mb-4 flex justify-center">
          <div className="inline-flex rounded-lg bg-card/60 border border-border/50 p-1 backdrop-blur">
            <button
              onClick={() => setInputMode("matrix")}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-smooth ${
                inputMode === "matrix"
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Grid3x3 className="h-4 w-4" /> Matrix Input
            </button>
            <button
              onClick={() => setInputMode("draw")}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-smooth ${
                inputMode === "draw"
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MousePointer2 className="h-4 w-4" /> Draw Mode
            </button>
          </div>
        </div>

        {/* Matrix Input Mode */}
        {inputMode === "matrix" && (
          <section className="mb-6">
            <MatrixInput
              initialN={nodes.length || 4}
              onApply={(ns, es) => {
                setNodes(ns);
                setEdges(es);
                setSelectedNode(null);
                resetRun();
              }}
              updatedMatrix={finished ? result.dist : null}
            />
          </section>
        )}

        {/* Controls */}
        <section className="mb-6 rounded-xl bg-gradient-card border border-border/50 shadow-elegant p-5">
          {inputMode === "draw" && (
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">
                  How to build
                </Label>
                <p className="text-sm">
                  <span className="text-primary font-medium">Click empty space</span> to add a node ·{" "}
                  <span className="text-accent font-medium">Click two nodes</span> to add an edge ·
                  Drag nodes to reposition
                </p>
              </div>
              <div>
                <Label htmlFor="weight" className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">
                  Edge Weight
                </Label>
                <Input
                  id="weight"
                  type="number"
                  value={edgeWeight}
                  onChange={(e) => setEdgeWeight(e.target.value)}
                  className="w-24"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={loadSample} variant="secondary">
                  <GitBranch className="mr-2 h-4 w-4" /> Sample
                </Button>
                <Button onClick={clearAll} variant="outline">
                  <Trash2 className="mr-2 h-4 w-4" /> Clear
                </Button>
              </div>
            </div>
          )}

          <div className={inputMode === "draw" ? "mt-5 flex flex-wrap items-center gap-4 pt-5 border-t border-border/40" : "flex flex-wrap items-center gap-4"}>
            <Button
              onClick={running ? () => setRunning(false) : start}
              disabled={nodes.length < 2}
              className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 transition-smooth"
            >
              {running ? (
                <>
                  <Pause className="mr-2 h-4 w-4" /> Pause
                </>
              ) : finished ? (
                <>
                  <Zap className="mr-2 h-4 w-4" /> Run Again
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" /> Run Floyd–Warshall
                </>
              )}
            </Button>
            <Button onClick={resetRun} variant="outline" disabled={stepIdx === -1}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>

            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
              <Label className="text-xs whitespace-nowrap text-muted-foreground">Speed</Label>
              <Slider
                value={[400 - speed]}
                onValueChange={(v) => setSpeed(400 - v[0])}
                min={0}
                max={380}
                step={20}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              Step{" "}
              <span className="font-mono text-foreground">
                {Math.max(0, stepIdx + 1)} / {result.steps.length}
              </span>
            </div>
          </div>

          {currentStep && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-primary/20 px-3 py-1 text-primary border border-primary/30">
                k = {currentStep.k}
              </span>
              <span className="rounded-full bg-muted/50 px-3 py-1 text-foreground">
                checking dist[{currentStep.i}][{currentStep.j}]
              </span>
              {currentStep.updated && (
                <span className="rounded-full bg-success/20 px-3 py-1 text-success border border-success/30">
                  ✓ improved via {currentStep.k}
                </span>
              )}
            </div>
          )}
        </section>

        {/* Initial Graph */}
        <section className="mb-6">
          <GraphCanvas
            title={finished ? "Initial Graph" : "Graph (live)"}
            subtitle={
              selectedNode !== null
                ? `Selected node ${selectedNode} — click another node to add an edge of weight ${edgeWeight}`
                : "Original weighted directed graph"
            }
            nodes={nodes}
            edges={edges}
            highlightEdges={liveHighlight}
            activeNodes={activeNodes}
            selectedNode={selectedNode}
            onCanvasClick={inputMode === "draw" ? addNodeAt : undefined}
            onNodeClick={inputMode === "draw" ? handleNodeClick : undefined}
            onNodeDrag={dragNode}
          />
        </section>

        {/* Matrix */}
        {nodes.length > 0 && (
          <section className="mb-6">
            <DistanceMatrix
              matrix={currentMatrix}
              highlight={
                currentStep
                  ? { i: currentStep.i, j: currentStep.j, k: currentStep.k }
                  : null
              }
              title={finished ? "Final Distance Matrix" : "Distance Matrix"}
              isFinal={finished}
            />
          </section>
        )}

        {/* Final shortest path graph + query */}
        {finished && (
          <>
            <section className="mb-6">
              <GraphCanvas
                title="Shortest Path Graph"
                subtitle="Edges that participate in at least one shortest path between some pair"
                nodes={nodes}
                edges={shortestPathEdges}
                highlightEdges={queryHighlight}
                height={420}
              />
            </section>

            <section className="rounded-xl bg-gradient-card border border-border/50 shadow-elegant p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" />
                Query a shortest path
              </h3>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">
                    From
                  </Label>
                  <Input
                    type="number"
                    value={pathFrom}
                    onChange={(e) => setPathFrom(e.target.value)}
                    className="w-20"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">
                    To
                  </Label>
                  <Input
                    type="number"
                    value={pathTo}
                    onChange={(e) => setPathTo(e.target.value)}
                    className="w-20"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  {queryPath.length > 0 && queryDist !== null && queryDist !== INF ? (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Path</div>
                      <div className="flex flex-wrap items-center gap-2 text-lg">
                        {queryPath.map((p, i) => (
                          <span key={i} className="flex items-center gap-2">
                            <span className="rounded-lg bg-gradient-primary text-primary-foreground font-bold w-9 h-9 flex items-center justify-center shadow-glow">
                              {p}
                            </span>
                            {i < queryPath.length - 1 && (
                              <span className="text-muted-foreground">→</span>
                            )}
                          </span>
                        ))}
                        <span className="ml-3 rounded-full bg-success/20 text-success border border-success/30 px-3 py-1 text-sm">
                          total = {queryDist}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No path exists between these nodes.</p>
                  )}
                </div>
              </div>
            </section>
          </>
        )}

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Built with Floyd–Warshall · O(V³) · works with positive & negative weights (no negative cycles)
        </footer>
      </div>
    </main>
  );
}
