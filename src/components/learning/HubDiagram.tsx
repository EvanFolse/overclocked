type Side = "top" | "left" | "right" | "bottom";

export interface HubNode {
    side: Side;
    label: string;
    color: string; 
    width?: number; 
    arrowLabel?: string; 
}

interface HubDiagramProps {
    center: { label: string; color: string };
    nodes: HubNode[];
}

const ARROW = "#8A9AA3";
const LABEL = "#6B9BD8";
const FONT = "ui-monospace, SFMono-Regular, Menlo, monospace";


const C = { x: 160, y: 142, w: 100, h: 56 };
const NODE_H = 40;

function layout(node: HubNode) {
    const w = node.width ?? 64;
    switch (node.side) {
        case "top":
            return {
                box: { x: 210 - w / 2, y: 20, w },
                line: { x1: 210, y1: C.y, x2: 210, y2: 64 },
                label: { x: 222, y: 104, anchor: "start" as const },
            };
        case "bottom":
            return {
                box: { x: 210 - w / 2, y: 280, w },
                line: { x1: 210, y1: C.y + C.h, x2: 210, y2: 276 },
                label: { x: 222, y: 244, anchor: "start" as const },
            };
        case "left":
            return {
                box: { x: 84 - w, y: 150, w },
                line: { x1: C.x, y1: 170, x2: 88, y2: 170 },
                label: { x: 124, y: 160, anchor: "middle" as const },
            };
        case "right":
            return {
                box: { x: 336, y: 150, w },
                line: { x1: C.x + C.w, y1: 170, x2: 332, y2: 170 },
                label: { x: 296, y: 160, anchor: "middle" as const },
            };
    }
}

export function HubDiagram({ center, nodes }: HubDiagramProps) {
    return (
        <svg
            viewBox="0 0 420 340"
            className="h-auto w-full max-w-md"
            role="img"
            aria-label={`${center.label} connected to ${nodes.map((n) => n.label).join(", ")}`}
        >
            <defs>
                <marker id="hub-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 z" fill={ARROW} />
                </marker>
            </defs>

         
            {nodes.map((node) => {
                const { line, label } = layout(node);
                return (
                    <g key={`arrow-${node.side}`}>
                        <line
                            x1={line.x1}
                            y1={line.y1}
                            x2={line.x2}
                            y2={line.y2}
                            stroke={ARROW}
                            strokeWidth={2.5}
                            markerEnd="url(#hub-arrow)"
                        />
                        {node.arrowLabel && (
                            <text
                                x={label.x}
                                y={label.y}
                                textAnchor={label.anchor}
                                fill={LABEL}
                                fontSize={12}
                                fontFamily={FONT}
                            >
                                {node.arrowLabel}
                            </text>
                        )}
                    </g>
                );
            })}

            
            {nodes.map((node) => {
                const { box } = layout(node);
                return (
                    <g key={`node-${node.side}`}>
                        <rect x={box.x} y={box.y} width={box.w} height={NODE_H} rx={10} fill={node.color} />
                        <text
                            x={box.x + box.w / 2}
                            y={box.y + NODE_H / 2 + 5}
                            textAnchor="middle"
                            fill="#fff"
                            fontSize={14}
                            fontFamily={FONT}
                        >
                            {node.label}
                        </text>
                    </g>
                );
            })}

           
            <rect x={C.x} y={C.y} width={C.w} height={C.h} rx={12} fill={center.color} />
            <text
                x={C.x + C.w / 2}
                y={C.y + C.h / 2 + 5}
                textAnchor="middle"
                fill="#fff"
                fontSize={16}
                fontWeight={700}
                fontFamily={FONT}
            >
                {center.label}
            </text>
        </svg>
    );
}