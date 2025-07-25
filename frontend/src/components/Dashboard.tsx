import { useEffect, useState, useRef } from "react";

import SeriesChart from "./SeriesChart";
import MetadataPanel from "./MetadataPanel";
import DistributionsPanel from "./DistributionsPanel";
import Topology from "./Topology";
import type { Metric } from "@/types/metric";

interface ExperimentContent {
  metrics: Record<string, Metric[]>;
  metadata: Record<string, any>;
  distributions: Record<string, any>;
  topology: Record<string, any>;
}

export default function Dashboard() {
  const [expList, setExpList] = useState<string[]>([]);
  const [dataMap, setDataMap] = useState<Record<string, ExperimentContent>>({});
  const [currentExp, setCurrentExp] = useState<string>("");
  const dataRef = useRef(dataMap);
  dataRef.current = dataMap;

  // Load experiments once
  useEffect(() => {
    async function loadExperiments() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/experiments`,
          {
            headers: {
              "ngrok-skip-browser-warning": "true",
            },
          }
        );
        const exps: string[] = await res.json();
        setExpList(exps);
        if (exps.length === 0) return;
        setCurrentExp((prev) => prev || exps[0]);

        const map: Record<string, ExperimentContent> = {};
        await Promise.all(
          exps.map(async (exp) => {
            const [mRes, metaRes, distRes, topoRes] = await Promise.all([
              fetch(
                `${import.meta.env.VITE_BACKEND_URL}/experiment/${exp}/metrics`,
                {
                  headers: {
                    "ngrok-skip-browser-warning": "true",
                  },
                }
              ),
              fetch(
                `${import.meta.env.VITE_BACKEND_URL}/experiment/${exp}/meta`,
                {
                  headers: {
                    "ngrok-skip-browser-warning": "true",
                  },
                }
              ),
              fetch(
                `${
                  import.meta.env.VITE_BACKEND_URL
                }/experiment/${exp}/distributions`,
                {
                  headers: {
                    "ngrok-skip-browser-warning": "true",
                  },
                }
              ),
              fetch(
                `${
                  import.meta.env.VITE_BACKEND_URL
                }/experiment/${exp}/topology`,
                {
                  headers: {
                    "ngrok-skip-browser-warning": "true",
                  },
                }
              ),
            ]);
            const [metricsRaw, metadata, distributions, topology] =
              await Promise.all([
                mRes.json(),
                metaRes.json(),
                distRes.json(),
                topoRes.json(),
              ]);
            const flatMetrics: Record<string, Metric[]> = {};
            for (const role of Object.keys(metricsRaw)) {
              const devices = (metricsRaw as any)[role];
              for (const device of Object.keys(devices)) {
                flatMetrics[`${role}-${device}`] = devices[device];
              }
            }
            map[exp] = {
              metrics: flatMetrics,
              metadata,
              distributions,
              topology,
            };
          })
        );
        setDataMap(map);
      } catch (e) {
        console.error("Failed to load experiments", e);
      }
    }
    loadExperiments();
  }, []);

  // WebSocket listener once
  useEffect(() => {
    const socket = new WebSocket(
      `${import.meta.env.VITE_BACKEND_URL_WS}?ngrok-skip-browser-warning=true`
    );
    socket.onmessage = (event) => {
      const msg: Metric = JSON.parse(event.data);
      const existing = dataRef.current[msg.exp_id];

      if (!existing) {
        // handle new experiment (omitted for brevity)
      } else {
        setDataMap((prev) => {
          const content = prev[msg.exp_id];
          const key = `${msg.role}-${msg.device}`;
          const arr = content.metrics[key] || [];
          return {
            ...prev,
            [msg.exp_id]: {
              ...content,
              metrics: {
                ...content.metrics,
                [key]: [...arr, msg],
              },
            },
          };
        });
      }
    };
    return () => socket.close();
  }, []);

  // const roleOrder: Record<string, number> = { central: 0, edge: 1, client: 2 };
  // const sortedMetrics = (exp: string) => {
  //   const content = dataMap[exp];
  //   return Object.entries(content.metrics).sort(
  //     ([a], [b]) => roleOrder[a.split("-")[0]] - roleOrder[b.split("-")[0]]
  //   );
  // };

  const groupedMetrics = (exp: string) => {
    const content = dataMap[exp]?.metrics || {};
    const entries = Object.entries(content);
    const central = entries.filter(([key]) => key.startsWith("central-"));
    const edge = entries.filter(([key]) => key.startsWith("edge-"));
    const clients = entries.filter(([key]) => key.startsWith("client-"));
    return { central, edge, clients };
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {expList.map((exp) => (
          <button
            key={exp}
            onClick={() => setCurrentExp(exp)}
            className={`px-4 py-1 rounded-full border text-sm font-medium ${
              exp === currentExp
                ? "bg-blue-500 border-blue-700"
                : "bg-gray-700 border-gray-500 hover:bg-gray-600"
            }`}
          >
            {exp}
          </button>
        ))}
      </div>

      {/* Content */}
      {currentExp && dataMap[currentExp] && (
        <>
          {/* Metadata */}
          <MetadataPanel metadata={dataMap[currentExp].metadata} />

          {/* Distributions */}
          <DistributionsPanel
            distributions={dataMap[currentExp].distributions as { client: {} }}
          />

          {/* Topology */}
          {dataMap[currentExp].topology && (
            <Topology topology={dataMap[currentExp].topology} />
          )}

          {/* Charts Sections */}
          <div className="p-4 space-y-8">
            {/* Central Server */}
            <div>
              <h2 className="text-xl font-semibold mb-2">Central Server</h2>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {groupedMetrics(currentExp).central.map(([key, metrics]) => (
                  <SeriesChart key={key} title={key} data={metrics} />
                ))}
              </div>
            </div>

            {/* Edge Servers */}
            <div>
              <h2 className="text-xl font-semibold mb-2">Edge Servers</h2>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {groupedMetrics(currentExp).edge.map(([key, metrics]) => (
                  <SeriesChart key={key} title={key} data={metrics} />
                ))}
              </div>
            </div>

            {/* Clients */}
            <div>
              <h2 className="text-xl font-semibold mb-2">Clients</h2>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {groupedMetrics(currentExp).clients.map(([key, metrics]) => (
                  <SeriesChart key={key} title={key} data={metrics} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
