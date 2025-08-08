import Seo from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const revenue = [
  { month: "Jan", income: 12000, expenses: 8000 },
  { month: "Feb", income: 14000, expenses: 9000 },
  { month: "Mar", income: 11000, expenses: 7500 },
  { month: "Apr", income: 15000, expenses: 9500 },
  { month: "May", income: 17000, expenses: 9800 },
  { month: "Jun", income: 16000, expenses: 10000 },
];

const Financials = () => {
  const exportCSV = () => {
    const header = "Month,Income,Expenses\n";
    const rows = revenue.map((r) => `${r.month},${r.income},${r.expenses}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "financials.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "CSV downloaded." });
  };

  const exportPDF = () => {
    window.print();
    toast({ title: "Print", description: "Use the dialog to save as PDF." });
  };

  return (
    <div className="space-y-6">
      <Seo title="Financials — WMS" description="Revenue, expenses, and reporting." canonical="/financials" />
      <h1 className="text-2xl font-semibold">Financial Management</h1>

      <div className="flex gap-3">
        <Button onClick={exportCSV}>Export CSV</Button>
        <Button variant="outline" onClick={exportPDF}>Export PDF</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Expenses vs Income</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="income" stroke="hsl(var(--primary))" strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Financials;
