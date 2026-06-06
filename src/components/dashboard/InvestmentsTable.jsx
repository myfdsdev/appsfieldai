import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown } from "lucide-react";

const investments = [
  { name: "AI Content Writer", shares: 20, invested: "$2,000", value: "$3,200", return: "+60%", up: true, category: "AI & ML" },
  { name: "CRM Dashboard Pro", shares: 5, invested: "$2,500", value: "$3,100", return: "+24%", up: true, category: "CRM" },
  { name: "Real Estate Agent SaaS", shares: 12, invested: "$1,200", value: "$1,416", return: "+18%", up: true, category: "Real Estate" },
  { name: "E-com Analytics", shares: 8, invested: "$800", value: "$720", return: "-10%", up: false, category: "Analytics" },
  { name: "Marketing Automator", shares: 0, invested: "$0", value: "$0", return: "0%", up: true, category: "Marketing" },
];

export default function InvestmentsTable() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
      <Card className="border-border/40 bg-card/60 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display">My Investments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/20 hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground">Asset</TableHead>
                <TableHead className="text-xs text-muted-foreground">Shares</TableHead>
                <TableHead className="text-xs text-muted-foreground">Invested</TableHead>
                <TableHead className="text-xs text-muted-foreground">Value</TableHead>
                <TableHead className="text-xs text-muted-foreground text-right">Return</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investments.map((inv) => (
                <TableRow key={inv.name} className="border-border/20">
                  <TableCell className="text-sm font-medium py-3">
                    <div>
                      {inv.name}
                      <div className="text-[11px] text-muted-foreground">{inv.category}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm py-3">{inv.shares}</TableCell>
                  <TableCell className="text-sm py-3">{inv.invested}</TableCell>
                  <TableCell className="text-sm py-3">{inv.value}</TableCell>
                  <TableCell className="text-sm py-3 text-right">
                    <span className={`inline-flex items-center gap-1 ${inv.up ? "text-emerald-400" : "text-red-400"}`}>
                      {inv.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {inv.return}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}