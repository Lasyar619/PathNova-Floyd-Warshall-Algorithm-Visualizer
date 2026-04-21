export const INF = Infinity;

export interface Step {
  k: number;
  i: number;
  j: number;
  updated: boolean;
  matrix: number[][];
  next: (number | null)[][];
}

export function floydWarshall(n: number, edges: { from: number; to: number; weight: number }[]) {
  const dist: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : INF)),
  );
  const next: (number | null)[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => null),
  );

  for (const e of edges) {
    if (e.weight < dist[e.from][e.to]) {
      dist[e.from][e.to] = e.weight;
      next[e.from][e.to] = e.to;
    }
  }
  for (let i = 0; i < n; i++) next[i][i] = i;

  const steps: Step[] = [];

  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const through = dist[i][k] + dist[k][j];
        let updated = false;
        if (through < dist[i][j]) {
          dist[i][j] = through;
          next[i][j] = next[i][k];
          updated = true;
        }
        steps.push({
          k,
          i,
          j,
          updated,
          matrix: dist.map((r) => [...r]),
          next: next.map((r) => [...r]),
        });
      }
    }
  }

  return { dist, next, steps };
}

export function reconstructPath(next: (number | null)[][], u: number, v: number): number[] {
  if (
    u < 0 ||
    v < 0 ||
    u >= next.length ||
    v >= next.length ||
    !next[u] ||
    next[u][v] === undefined ||
    next[u][v] === null
  ) {
    return [];
  }

  const path = [u];
  let cur = u;
  while (cur !== v) {
    const row = next[cur];
    if (!row) return [];
    const nx = row[v];
    if (nx === null || nx === undefined) return [];
    path.push(nx);
    cur = nx;
  }
  return path;
}
