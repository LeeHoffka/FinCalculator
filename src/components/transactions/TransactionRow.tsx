import type { Transaction } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight } from "lucide-react";

interface TransactionRowProps {
  transaction: Transaction;
  onClick?: () => void;
}

const typeConfig = {
  income: {
    icon: ArrowDownLeft,
    label: "Příjem",
    color: "text-income",
    bgColor: "bg-income/10",
  },
  expense: {
    icon: ArrowUpRight,
    label: "Výdaj",
    color: "text-expense",
    bgColor: "bg-expense/10",
  },
  transfer: {
    icon: ArrowLeftRight,
    label: "Převod",
    color: "text-transfer",
    bgColor: "bg-transfer/10",
  },
};

export function TransactionRow({ transaction, onClick }: TransactionRowProps) {
  const config = typeConfig[transaction.transaction_type as keyof typeof typeConfig] || typeConfig.expense;
  const Icon = config.icon;
  const isExpense = transaction.transaction_type === "expense";

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 rounded-lg border bg-white p-4 transition-colors",
        onClick && "cursor-pointer hover:bg-slate-50"
      )}
    >
      {/* Icon */}
      <div className={cn("rounded-full p-2", config.bgColor)}>
        <Icon className={cn("h-5 w-5", config.color)} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {transaction.description || config.label}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatDate(transaction.date)}
        </p>
      </div>

      {/* Status */}
      {transaction.status !== "completed" && (
        <Badge
          variant={transaction.status === "planned" ? "secondary" : "destructive"}
        >
          {transaction.status === "planned" ? "Plánováno" : "Zrušeno"}
        </Badge>
      )}

      {/* Amount */}
      <div className="text-right">
        <p
          className={cn(
            "font-semibold",
            isExpense ? "text-expense" : "text-income"
          )}
        >
          {isExpense ? "-" : "+"}
          {formatCurrency(transaction.amount, transaction.currency)}
        </p>
      </div>
    </div>
  );
}

