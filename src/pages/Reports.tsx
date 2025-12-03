import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCategoryBreakdown } from "@/hooks/useReports";
import { getCurrentMonth } from "@/utils/date";
import { formatCurrency } from "@/utils/currency";

export function Reports() {
  const { start, end } = useMemo(() => getCurrentMonth(), []);
  const { data: breakdown, isLoading } = useCategoryBreakdown(start, end);

  if (isLoading) {
    return <div className="animate-pulse">Načítání...</div>;
  }

  const chartData = breakdown?.map((item) => ({
    name: item.category_name,
    value: item.amount,
    color: item.category_color,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reporty</h1>
        <p className="text-muted-foreground">Analýza vašich financí</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Výdaje podle kategorií</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value, "CZK")}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Zatím nejsou žádná data
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rozpad výdajů</CardTitle>
          </CardHeader>
          <CardContent>
            {breakdown && breakdown.length > 0 ? (
              <div className="space-y-3">
                {breakdown.map((item) => (
                  <div key={item.category_id} className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.category_color }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{item.category_name}</span>
                        <span>{formatCurrency(item.amount, "CZK")}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: item.category_color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Zatím nejsou žádná data
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

