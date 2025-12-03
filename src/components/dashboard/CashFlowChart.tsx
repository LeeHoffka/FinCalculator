import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCashFlowData } from "@/hooks/useReports";
import { formatCurrency } from "@/utils/currency";

interface CashFlowChartProps {
  startDate: string;
  endDate: string;
}

export function CashFlowChart({ startDate, endDate }: CashFlowChartProps) {
  const { data, isLoading } = useCashFlowData(startDate, endDate);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Načítání...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getDate()}.${date.getMonth() + 1}`;
              }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(value, "CZK").replace(/\s*Kč$/, "")}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value, "CZK")}
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleDateString("cs-CZ");
              }}
            />
            <Legend />
            <Bar dataKey="income" name="Příjmy" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Výdaje" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

