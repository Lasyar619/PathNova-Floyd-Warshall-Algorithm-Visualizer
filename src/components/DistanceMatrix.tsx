interface Props {
  matrix: number[][];
  highlight?: { i: number; j: number; k?: number } | null;
  title?: string;
  /** When true, replace remaining ∞ with "—" and style as unreachable. */
  isFinal?: boolean;
}

export function DistanceMatrix({
  matrix,
  highlight,
  title = "Distance Matrix",
  isFinal = false,
}: Props) {
  const n = matrix.length;
  if (n === 0) return null;
  return (
    <div className="rounded-xl bg-gradient-card border border-border/50 shadow-elegant p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {isFinal && (
          <span className="text-xs text-muted-foreground">
            <span className="inline-block w-3 h-3 rounded bg-destructive/30 border border-destructive/50 align-middle mr-1.5" />
            unreachable pair
          </span>
        )}
      </div>
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
                  const isK = highlight && (highlight.k === i || highlight.k === j);
                  const isUnreachable = isFinal && v === Infinity && i !== j;
                  const display =
                    v === Infinity ? (isFinal && i !== j ? "—" : "∞") : v;
                  return (
                    <td
                      key={j}
                      className={`w-12 h-10 text-center rounded-md text-xs font-mono transition-smooth ${
                        isCell
                          ? "bg-accent text-accent-foreground shadow-glow-accent font-bold"
                          : isUnreachable
                            ? "bg-destructive/20 text-destructive border border-destructive/40"
                            : isK
                              ? "bg-primary/30 text-foreground"
                              : i === j
                                ? "bg-muted/40 text-muted-foreground"
                                : "bg-muted/20 text-foreground"
                      }`}
                    >
                      {display}
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
