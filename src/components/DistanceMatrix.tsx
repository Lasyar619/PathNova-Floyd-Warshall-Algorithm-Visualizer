interface Props {
  matrix: number[][];
  highlight?: { i: number; j: number; k?: number } | null;
  title?: string;
}

export function DistanceMatrix({ matrix, highlight, title = "Distance Matrix" }: Props) {
  const n = matrix.length;
  if (n === 0) return null;
  return (
    <div className="rounded-xl bg-gradient-card border border-border/50 shadow-elegant p-5">
      <h3 className="font-semibold mb-3 text-foreground">{title}</h3>
      <div className="overflow-auto">
        <table className="text-sm border-separate border-spacing-1 mx-auto">
          <thead>
            <tr>
              <th className="w-10 h-10"></th>
              {Array.from({ length: n }).map((_, j) => (
                <th
                  key={j}
                  className="w-12 h-10 text-center text-xs font-semibold text-primary"
                >
                  {j}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <th className="w-10 h-10 text-center text-xs font-semibold text-primary">{i}</th>
                {row.map((v, j) => {
                  const isCell = highlight?.i === i && highlight?.j === j;
                  const isK =
                    highlight && (highlight.k === i || highlight.k === j);
                  return (
                    <td
                      key={j}
                      className={`w-12 h-10 text-center rounded-md text-xs font-mono transition-smooth ${
                        isCell
                          ? "bg-accent text-accent-foreground shadow-glow-accent font-bold"
                          : isK
                            ? "bg-primary/30 text-foreground"
                            : i === j
                              ? "bg-muted/40 text-muted-foreground"
                              : "bg-muted/20 text-foreground"
                      }`}
                    >
                      {v === Infinity ? "∞" : v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
