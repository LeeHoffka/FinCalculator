import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/currency";
import { cn } from "@/lib/utils";

interface BalanceWidgetProps {
  title: string;
  amount: number;
  currency?: string;
  change?: number;
  changeLabel?: string;
  icon?: "wallet" | "up" | "down";
  variant?: "default" | "income" | "expense";
}

export function BalanceWidget({
  title,
  amount,
  currency = "CZK",
  change,
  changeLabel,
  icon = "wallet",
  variant = "default",
}: BalanceWidgetProps) {
  const Icon = icon === "up" ? TrendingUp : icon === "down" ? TrendingDown : Wallet;
  const isPositive = change !== undefined ? change >= 0 : amount >= 0;

  return (
    <Card
      className={cn(
        "transition-shadow hover:shadow-md",
        variant === "income" && "border-l-4 border-l-income",
        variant === "expense" && "border-l-4 border-l-expense"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon
          className={cn(
            "h-5 w-5",
            variant === "income" && "text-income",
            variant === "expense" && "text-expense",
            variant === "default" && "text-muted-foreground"
          )}
        />
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-2xl font-bold",
            variant === "income" && "text-income",
            variant === "expense" && "text-expense"
          )}
        >
          {formatCurrency(amount, currency)}
        </div>
        {change !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            <span className={isPositive ? "text-income" : "text-expense"}>
              {isPositive ? "+" : ""}
              {change.toFixed(1)}%
            </span>
            {changeLabel && ` ${changeLabel}`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

