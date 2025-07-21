import React from "react";
import type { Metric } from "@/types/metric";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type SeriesChartProps = {
  title: string;
  data: Metric[];
};

const SeriesChart: React.FC<SeriesChartProps> = React.memo(
  ({ title, data }) => {
    const lastRound = data[data.length - 1]?.round ?? "-";
    return (
      <div className="flex flex-col p-6 bg-gray-800 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold capitalize">{title}</h2>
        <h3 className="text-md text-gray-200 mb-2">Last round: {lastRound}</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="round" />
            <YAxis domain={[0, 1]} />
            <Tooltip />
            <Legend verticalAlign="top" height={36} />
            <Line
              type="monotone"
              dataKey="accuracy"
              name="Accuracy"
              stroke="#82ca9d"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="loss"
              name="Loss"
              stroke="#8884d8"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
);

export default SeriesChart;
