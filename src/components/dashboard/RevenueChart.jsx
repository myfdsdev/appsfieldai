import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

const revenueData = [
  { month: "Jan", revenue: 1800 },
  { month: "Feb", revenue: 2100 },
  { month: "Mar", revenue: 1950 },
  { month: "Apr", revenue: 2400 },
  { month: "May", revenue: 2650 },
  { month: "Jun", revenue: 2840 },
];

export default function RevenueChart() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Monthly Revenue
          </CardTitle>
          <Badge variant="outline" className="text-[10px] border-border/40">Last 6 months</Badge>
        </CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(267, 80%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(267, 80%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 10%, 16%)" />
                <XAxis dataKey="month" tick={{ fill: "hsl(260, 5%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(260, 5%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: "hsl(220, 15%, 8%)", border: "1px solid hsl(220, 10%, 16%)", borderRadius: 8, fontSize: 13 }}
                  formatter={(value) => [`$${value}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(267, 80%, 60%)" strokeWidth={2} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}