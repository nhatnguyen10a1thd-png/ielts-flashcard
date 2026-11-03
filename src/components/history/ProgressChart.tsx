"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export interface ChartDataPoint {
  index: number;
  dateStr: string;
  score: number;
  mode: string;
}

interface ProgressChartProps {
  data: ChartDataPoint[];
}

export function ProgressChart({ data }: ProgressChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-[var(--ink-muted)]">
        Chưa có dữ liệu bài thi để hiển thị biểu đồ.
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
          <XAxis
            dataKey="dateStr"
            tick={{ fontSize: 11, fill: "var(--ink-secondary)" }}
            tickLine={{ stroke: "var(--border-medium)" }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "var(--ink-secondary)" }}
            tickLine={{ stroke: "var(--border-medium)" }}
            unit="%"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as ChartDataPoint;
                return (
                  <div className="p-2.5 rounded-md bg-[var(--surface)] border border-[var(--border-medium)] shadow-sm text-xs space-y-1">
                    <p className="font-semibold text-[var(--ink)]">{item.dateStr}</p>
                    <p className="text-[var(--navy)] font-bold">
                      Điểm: {item.score}%
                    </p>
                    <p className="text-[11px] text-[var(--ink-secondary)]">
                      Hình thức: {item.mode}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            name="Điểm số (%)"
            stroke="var(--navy)"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "var(--navy)", strokeWidth: 1 }}
            activeDot={{ r: 6, fill: "var(--burgundy)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

