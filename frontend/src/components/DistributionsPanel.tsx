// components/DistributionsPanel.tsx
import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface LoaderInfo {
  label_distribution: Record<string, number>;
  num_items: number;
}

type ClientDistributions = Record<string, Record<string, LoaderInfo>>;

type DistributionsPanelProps = {
  distributions: { client: ClientDistributions } | null | undefined;
};

export default function DistributionsPanel({
  distributions,
}: DistributionsPanelProps) {
  const clientsMap = distributions?.client;
  const clientIds = clientsMap ? Object.keys(clientsMap) : [];

  const [selectedClient, setSelectedClient] = useState<string>("");
  const [loaderIds, setLoaderIds] = useState<string[]>([]);
  const [selectedLoader, setSelectedLoader] = useState<string>("");

  // Initialize client selection once

  // When client changes, update loaders and reset loader selection
  useEffect(() => {
    if (clientsMap && selectedClient) {
      const lIds = Object.keys(clientsMap[selectedClient] || {});
      setLoaderIds(lIds);
      setSelectedLoader(lIds.length > 0 ? lIds[0] : "");
    } else {
      setLoaderIds([]);
      setSelectedLoader("");
    }
  }, [selectedClient, clientsMap]);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedClient(e.target.value);
  };

  const handleLoaderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLoader(e.target.value);
  };

  const renderChart = () => {
    if (!clientsMap || !selectedClient || !selectedLoader) {
      return <div className="text-gray-400">No data selected.</div>;
    }

    console.log(clientsMap[selectedClient]);
    const info = clientsMap[selectedClient][selectedLoader];
    if (!info) {
      return <div className="text-gray-400">Loader data missing.</div>;
    }

    console.log(info);
    const data = Object.entries(info.label_distribution).map(
      ([label, count]) => ({ label, count })
    );

    return (
      <div className="p-4 rounded-xl">
        <h4 className="text-md font-semibold mb-2 capitalize">
          {selectedLoader}
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="count"
              name="Count"
              fill="#82ca9d"
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="mb-6 p-4 bg-gray-800 rounded-xl">
      <h3 className="text-lg font-semibold mb-4">Data Distributions</h3>
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="mr-2 font-medium text-gray-200">Client:</label>
          <select
            value={selectedClient}
            onChange={handleClientChange}
            className="bg-gray-700 border border-gray-600 text-gray-200 rounded px-2 py-1"
          >
            {clientIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mr-2 font-medium text-gray-200">Loader:</label>
          <select
            value={selectedLoader}
            onChange={handleLoaderChange}
            className="bg-gray-700 border border-gray-600 text-gray-200 rounded px-2 py-1"
          >
            <option value="">-- Select Loader --</option>
            {loaderIds.map((lid) => (
              <option key={lid} value={lid}>
                {lid}
              </option>
            ))}
          </select>
        </div>
      </div>
      {renderChart()}
    </div>
  );
}
