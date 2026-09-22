"use client";

interface BottleneckToastProps {
  visible: boolean;
  onDiagnose: () => void;
  onDismiss: () => void;
}

export function BottleneckToast({
  visible,
  onDiagnose,
  onDismiss,
}: BottleneckToastProps) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-30 w-[min(92vw,22rem)] -translate-x-1/2 animate-toast-in sm:bottom-6">
      <div className="rounded-2xl border border-warning/50 bg-panel/95 p-4 shadow-xl backdrop-blur-md">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-warning">
          ⚠ CPU Bottleneck Detected
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          Architecture pressure is cutting throughput. Diagnose the scenario to unlock
          or improve the right component.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onDiagnose}
            className="flex-1 rounded-lg border border-warning/50 bg-warning/15 px-3 py-2 font-mono text-xs font-semibold text-warning transition hover:opacity-90"
          >
            Diagnose
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg border border-edge px-3 py-2 text-xs text-muted hover:text-foreground"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
