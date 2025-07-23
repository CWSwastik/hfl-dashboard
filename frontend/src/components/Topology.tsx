import React, { useEffect, useMemo, useState } from "react";
import ReactFlow, { Background, Controls, Position } from "reactflow";
import type { Node, Edge } from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";

// Hide ReactFlow attribution
const globalStyles = `
  .react-flow__attribution { display: none !important; }
`;

type NodeType = {
  kind: string;
  host: string;
  port?: number;
  partition_id?: number;
  server?: { host: string; port: number };
  client?: { host: string; port: number };
};

type TopologyProps = { topology: Record<string, NodeType> };

// Dagre layout
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
const NODE_WIDTH = 172;
const NODE_HEIGHT = 36;

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  dagreGraph.setGraph({ rankdir: "TB", marginx: 50, marginy: 50 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - NODE_WIDTH / 2,
      y: nodeWithPosition.y - NODE_HEIGHT / 2,
    };
    node.sourcePosition = Position.Bottom;
    node.targetPosition = Position.Top;
    return node;
  });

  return { nodes: layoutedNodes, edges };
}

const Topology: React.FC<TopologyProps> = ({ topology }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // build raw elements
  const { nodes: rawNodes, edges: rawEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const entries = Object.entries(topology);
    const clients = entries.filter(([, n]) => n.kind === "client");
    const edgesList = entries.filter(([, n]) => n.kind === "edge");
    const coordinatorEntry = entries.find(([, n]) => n.kind === "server");
    if (!coordinatorEntry) return { nodes, edges };

    const [coordId] = coordinatorEntry;
    nodes.push({
      id: coordId,
      data: { label: coordId },
      position: { x: 0, y: 0 },
    });

    edgesList.forEach(([edgeId, edgeNode]) => {
      nodes.push({
        id: edgeId,
        data: { label: edgeId },
        position: { x: 0, y: 0 },
      });
      edges.push({
        id: `${coordId}->${edgeId}`,
        source: coordId,
        target: edgeId,
        style: { stroke: "#9ca3af", strokeWidth: 2 },
      });

      const matchingClients = clients.filter(
        ([, c]) => c.port === edgeNode.client?.port
      );
      matchingClients.forEach(([clientId, clientNode]) => {
        nodes.push({
          id: clientId,
          data: { label: `${clientId} (P${clientNode.partition_id})` },
          position: { x: 0, y: 0 },
          style: { width: NODE_WIDTH },
        });
        edges.push({
          id: `${edgeId}->${clientId}`,
          source: edgeId,
          target: clientId,

          style: { strokeDasharray: "4 2" },
        });
      });
    });

    return { nodes, edges };
  }, [topology]);

  const { nodes, edges } = useMemo(
    () => getLayoutedElements(rawNodes, rawEdges),
    [rawNodes, rawEdges]
  );

  return (
    <>
      <style>{globalStyles}</style>
      <div className="w-full flex justify-center p-2">
        <div className="bg-gray-800 rounded-xl shadow-lg p-4 w-full max-w-6xl">
          <h2 className="text-xl font-semibold text-white mb-4">Topology</h2>
          <div
            className={`${
              isMobile ? "h-[800px]" : "h-[600px]"
            } rounded-md overflow-auto`}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              className="bg-transparent"
            >
              <Background color="#374151" gap={16} />
              <Controls />
            </ReactFlow>
          </div>
        </div>
      </div>
    </>
  );
};

export default Topology;
