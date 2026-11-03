"use client";

import { Fragment, type CSSProperties, type ReactNode } from "react";
import type { Cell, Row, Stage } from "@/lib/pipelineMission";

export const STAGE_STYLE: Record<Stage, { bg: string; bd: string; fg: string }> = {
  IF: { bg: "#dbeafe", bd: "#7fa6d6", fg: "#1e4a7a" },
  ID: { bg: "#e4e3f7", bd: "#9a97d8", fg: "#3b3a8f" },
  EX: { bg: "#d9eddf", bd: "#7fb592", fg: "#1f5a37" },
  MEM: { bg: "#fbe9cc", bd: "#d9a94f", fg: "#7a5212" },
  WB: { bg: "#f0dcef", bd: "#b17cb0", fg: "#6a2a69" },
};

export interface CellLook {
  text?: string;
  style?: CSSProperties;
  className?: string;
}

interface Props {
  rows: Row[];
  cols: number;
  activeCycle?: number | null;
  headerBadge?: Record<number, string>;
  onCycleClick?: (c: number) => void;
  onCycleDrop?: (c: number) => void;
  look?: (row: Row, cell: Cell) => CellLook | undefined;
  note?: (row: Row) => ReactNode;
}

/** Time-space diagram: rows are instructions, columns are clock cycles. */
export function PipelineGrid({ rows, cols, activeCycle, headerBadge, onCycleClick, onCycleDrop, look, note }: Props) {
  const cycles = Array.from({ length: cols }, (_, i) => i + 1);
  const interactive = !!onCycleClick || !!onCycleDrop;

  return (
    <div className="overflow-x-auto">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `180px repeat(${cols}, minmax(52px, 1fr))`,
          gap: 6,
          minWidth: 180 + cols * 58,
        }}
      >
        <div />
        {cycles.map((c) => (
          <div key={c} className="flex flex-col items-center gap-1">
            <div className="h-4 font-mono text-[9px] font-bold uppercase tracking-wider text-accent-text">
              {headerBadge?.[c] ?? ""}
            </div>
            <button
              type="button"
              disabled={!interactive}
              onClick={() => onCycleClick?.(c)}
              onDragOver={(e) => {
                if (onCycleDrop) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                onCycleDrop?.(c);
              }}
              className={`w-full rounded-md border py-1 font-mono text-xs transition ${
                activeCycle === c
                  ? "border-foreground bg-foreground font-bold text-background"
                  : "border-edge text-muted"
              } ${interactive ? "hover:border-accent" : ""}`}
            >
              {c}
            </button>
          </div>
        ))}

        {rows.map((row) => (
          <Fragment key={row.instr.id}>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="rounded bg-panel-muted px-1.5 py-0.5 text-[10px] text-muted">{row.instr.id}</span>
                <span className="font-bold">{row.instr.text}</span>
              </div>
              {note && <div className="mt-0.5 pl-1 text-[10px] text-muted">{note(row)}</div>}
            </div>
            {cycles.map((c) => {
              const cell = row.cells.find((x) => x.cycle === c);
              if (!cell) return <div key={c} className="h-10" />;
              const s = STAGE_STYLE[cell.stage];
              const custom = look?.(row, cell);
              const style: CSSProperties = {
                background: s.bg,
                borderColor: s.bd,
                color: s.fg,
                borderStyle: cell.held ? "dashed" : "solid",
                opacity: cell.held ? 0.7 : 1,
                ...custom?.style,
              };
              return (
                <div
                  key={`${row.instr.id}-${c}-${cell.stage}-${cell.held ? "h" : "r"}`}
                  className={`fx-cell flex h-10 items-center justify-center rounded-lg border-2 font-mono text-xs font-bold ${custom?.className ?? ""}`}
                  style={{ ...style, animationDelay: `${c * 45}ms` }}
                >
                  {custom?.text ?? cell.stage}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
