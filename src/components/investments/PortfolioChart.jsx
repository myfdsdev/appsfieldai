import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PieChart as PieIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6"];

export default function PortfolioChart({ holdings }) {
  const chartData = holdings.map((h) => ({
    name: h.title,
    value: h.totalInvested,
  }));

  if (chartData.length === 0) {
    return (
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
        <CardHeader><CardTitle className="text-base font-display flex items-center gap-2"><PieIcon className="w-4 h-4 text-violet-400" /> Portfolio Allocation</CardTitle></CardHeader>
        <CardContent className="text-center py-8 text-sm text-muted-foreground">No holdings to display.</CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
      <CardHeader><CardTitle className="text-base font-display flex items-center gap-2"><PieIcon className="w-4 h-4 text-violet-400" /> Portfolio Allocation</CardTitle></CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "hsl(20 10% 7%)",
                border: "1px solid hsl(20 8% 14%)",
                borderRadius: "12px",
                fontSize: "13px",
              }}
              formatter={(val) => [`$${val.toLocaleString()}`, "Invested"]}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px" }}
              iconType="circle"
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}