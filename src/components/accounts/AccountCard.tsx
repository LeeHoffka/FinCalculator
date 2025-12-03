import type { Account } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/currency";
import { cn } from "@/lib/utils";

interface AccountCardProps {
  account: Account;
  onClick?: () => void;
}

const accountTypeLabels: Record<string, string> = {
  checking: "Běžný účet",
  savings: "Spořicí účet",
  credit_card: "Kreditní karta",
  investment: "Investiční účet",
  cash: "Hotovost",
  other: "Ostatní",
};

export function AccountCard({ account, onClick }: AccountCardProps) {
  const isPositive = account.current_balance >= 0;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg",
        onClick && "hover:scale-[1.02]"
      )}
      onClick={onClick}
      style={{ borderLeft: `4px solid ${account.color || "#3B82F6"}` }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {account.icon && <span className="text-2xl">{account.icon}</span>}
            <CardTitle className="text-lg">{account.name}</CardTitle>
          </div>
          <Badge
            variant={account.account_type === "credit_card" ? "destructive" : "secondary"}
          >
            {accountTypeLabels[account.account_type] || account.account_type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Aktuální zůstatek</p>
            <p
              className={cn(
                "text-2xl font-bold",
                isPositive ? "text-income" : "text-expense"
              )}
            >
              {formatCurrency(account.current_balance, account.currency)}
            </p>
          </div>
          {account.account_number && (
            <p className="text-sm text-muted-foreground font-mono">
              {account.account_number}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

