"use client";

import React, { useMemo, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Panel,
  BackgroundVariant,
  useReactFlow,
} from "@xyflow/react";
import { ClaimNode } from "./claim-node";
import { SourceNode } from "./source-node";
import { useReviewStore } from "@/store/review-store";
import { buildGraph } from "@/lib/derive/graph";
import { FilterState } from "@/lib/types";
import { Maximize2, Minimize2, RotateCcw, Filter, AlertCircle, Scan } from "lucide-react";
import { useTheme } from "next-themes";

const nodeTypes = {
  claimNode: ClaimNode,
  sourceNode: SourceNode,
};

interface GraphCanvasProps {
  filters: FilterState;
  selectedId: string | null;
  onSelect: (item: { type: "claim" | "source" | "claim_source" | "source_relationship"; id: string } | null) => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onSwitchToList?: () => void;
}

// Inner canvas controls component utilizing React Flow hooks
function GraphPanelControls({
  hiddenCount,
  onResetLayout,
  isFullScreen,
  onToggleFullScreen,
}: {
  hiddenCount: number;
  onResetLayout: () => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}) {
  const { fitView } = useReactFlow();

  return (
    <Panel position="top-right" className="flex items-center gap-2">
      {hiddenCount > 0 && (
        <div className="glass-pill flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
          <Filter className="h-3 w-3 text-teal-600" />
          <span>{hiddenCount} hidden by filters</span>
        </div>
      )}

      <button
        type="button"
        onClick={() => fitView({ padding: 0.2, duration: 400 })}
        className="glass-pill flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
        title="Fit entire graph in viewport"
      >
        <Scan className="h-3 w-3" />
        <span>Fit View</span>
      </button>

      <button
        type="button"
        onClick={onResetLayout}
        className="glass-pill flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
        title="Reset node positions to default column layout"
      >
        <RotateCcw className="h-3 w-3" />
        <span>Reset Layout</span>
      </button>

      {onToggleFullScreen && (
        <button
          type="button"
          onClick={onToggleFullScreen}
          className="glass-pill flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-slate-900 transition hover:bg-white dark:text-white dark:hover:bg-slate-800"
          title={isFullScreen ? "Exit Full Page" : "Expand Graph to Full Page"}
        >
          {isFullScreen ? (
            <>
              <Minimize2 className="h-3.5 w-3.5" />
              <span>Exit Full Page</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Full Page ⤢</span>
            </>
          )}
        </button>
      )}
    </Panel>
  );
}

// Internal Graph Canvas implementation
function GraphCanvasInner({
  filters,
  selectedId,
  onSelect,
  isFullScreen = false,
  onToggleFullScreen,
}: GraphCanvasProps) {
  const store = useReviewStore();
  const setNodePosition = useReviewStore((state) => state.setNodePosition);
  const resetNodePositions = useReviewStore((state) => state.resetNodePositions);

  // Derive graph
  const graphData = useMemo(() => {
    return buildGraph(store, filters, store.ui.nodePositions);
  }, [store, filters]);

  const [nodes, setNodes, onNodesChange] = useNodesState(graphData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphData.edges);

  useEffect(() => {
    setNodes(graphData.nodes);
    setEdges(graphData.edges);
  }, [graphData, setNodes, setEdges]);

  // Handle drag stop
  const onNodeDragStop = useCallback(
    (_: MouseEvent | TouchEvent, node: Node) => {
      setNodePosition(node.id, { x: Math.round(node.position.x), y: Math.round(node.position.y) });
    },
    [setNodePosition]
  );

  // Handle node selection
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === "claimNode") {
        const claimId = node.id.replace("claim-", "");
        onSelect({ type: "claim", id: claimId });
      } else if (node.type === "sourceNode") {
        const sourceId = node.id.replace("source-", "");
        onSelect({ type: "source", id: sourceId });
      }
    },
    [onSelect]
  );

  // Handle edge selection
  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      if (edge.data?.kind === "claim_source") {
        onSelect({ type: "claim_source", id: edge.id });
      } else if (edge.data?.kind === "source_relationship") {
        onSelect({ type: "source_relationship", id: edge.id });
      }
    },
    [onSelect]
  );

  // Dim unrelated nodes when a node is selected
  const activeNodeIds = useMemo(() => {
    if (!selectedId) return null;
    const matchClaim = `claim-${selectedId}`;
    const matchSource = `source-${selectedId}`;
    const targetKey = nodes.some((n) => n.id === matchClaim) ? matchClaim : matchSource;
    const connected = new Set<string>([targetKey]);
    edges.forEach((e) => {
      if (e.source === targetKey) connected.add(e.target);
      if (e.target === targetKey) connected.add(e.source);
    });
    return connected;
  }, [selectedId, nodes, edges]);

  const displayNodes = useMemo(() => {
    if (!activeNodeIds) return nodes;
    return nodes.map((node) => ({
      ...node,
      style: {
        ...node.style,
        opacity: activeNodeIds.has(node.id) ? 1 : 0.28,
        filter: activeNodeIds.has(node.id) ? "none" : "grayscale(50%)",
        transition: "opacity 0.2s ease, filter 0.2s ease",
      },
    }));
  }, [nodes, activeNodeIds]);

  const displayEdges = useMemo(() => {
    if (!activeNodeIds) return edges;
    return edges.map((edge) => ({
      ...edge,
      style: {
        ...edge.style,
        opacity: activeNodeIds.has(edge.source) && activeNodeIds.has(edge.target) ? 1 : 0.15,
        transition: "opacity 0.2s ease",
      },
    }));
  }, [edges, activeNodeIds]);

  const containerClass = isFullScreen
    ? "relative h-full w-full bg-transparent"
    : "relative h-[420px] md:h-[580px] w-full overflow-hidden rounded-3xl border border-white/80 bg-white/50 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/50";

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className={containerClass}>
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={() => onSelect(null)}
        nodeTypes={nodeTypes}
        colorMode={isDark ? "dark" : "light"}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color={isDark ? "#475569" : "#94a3b8"} />
        <Controls showInteractive={false} position="bottom-left" />

        <GraphPanelControls
          hiddenCount={graphData.hiddenCount}
          onResetLayout={resetNodePositions}
          isFullScreen={isFullScreen}
          onToggleFullScreen={onToggleFullScreen}
        />

        {/* Legend panel bottom right */}
        <Panel position="bottom-right" className="glass-pill rounded-2xl p-2.5 text-[10px] text-slate-600 dark:text-slate-400">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
              <span>Edge Styles:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-0.5 w-4 bg-teal-600" />
              <span>Supports (Solid: Documented)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-0.5 w-4 bg-rose-600" />
              <span>Contradicts</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-0.5 w-4 border-t border-dashed border-amber-600" />
              <span>Repeats (Dashed: Suspected)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-0.5 w-4 border-t border-dotted border-slate-500" />
              <span>Unverified / Dotted</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

// Error Boundary for React Flow Canvas
class GraphErrorBoundary extends React.Component<
  { onSwitchToList?: () => void; children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("GraphCanvas encountered error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-[420px] md:h-[580px] w-full flex-col items-center justify-center rounded-3xl border border-amber-300 bg-amber-50/90 p-6 text-center dark:border-amber-900/60 dark:bg-amber-950/40">
          <AlertCircle className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          <h3 className="mt-3 text-sm font-bold text-amber-950 dark:text-amber-200">
            Graph Canvas Error
          </h3>
          <p className="mt-1 max-w-md text-xs text-amber-900/80 dark:text-amber-300/80">
            An unexpected error occurred while rendering the interactive nodes. You can continue reviewing all evidence chains in the List view.
          </p>
          {this.props.onSwitchToList && (
            <button
              type="button"
              onClick={this.props.onSwitchToList}
              className="mt-4 rounded-full bg-slate-950 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 dark:bg-white dark:text-slate-950"
            >
              Switch to list view
            </button>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export function GraphCanvas(props: GraphCanvasProps) {
  return (
    <GraphErrorBoundary onSwitchToList={props.onSwitchToList}>
      <GraphCanvasInner {...props} />
    </GraphErrorBoundary>
  );
}
