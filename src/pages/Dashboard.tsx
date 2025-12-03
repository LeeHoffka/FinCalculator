import { useMemo } from "react";
import { BalanceWidget } from "@/components/dashboard/BalanceWidget";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { AccountList } from "@/components/accounts/AccountList";
import { TransactionList } from "@/components/transactions/TransactionList";
import { useAccounts } from "@/hooks/useAccounts";
import { useMonthlySummary } from "@/hooks/useReports";
import { getCurrentMonth } from "@/utils/date";

export function Dashboard() {
  const { data: accounts } = useAccounts();
  const now = new Date();
  const { data: summary } = useMonthlySummary(now.getFullYear(), now.getMonth() + 1);
  const { start, end } = useMemo(() => getCurrentMonth(), []);

  const totalBalance = useMemo(() => {
    if (!accounts) return 0;
    return accounts.reduce((sum, acc) => sum + acc.current_balance, 0);
  }, [accounts]);

  return (
    <div className="space-y-6">
      {/* Summary Widgets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <BalanceWidget
          title="Celkový zůstatek"
          amount={totalBalance}
          icon="wallet"
        />
        <BalanceWidget
          title="Příjmy tento měsíc"
          amount={summary?.total_income || 0}
          variant="income"
          icon="up"
        />
        <BalanceWidget
          title="Výdaje tento měsíc"
          amount={summary?.total_expense || 0}
          variant="expense"
          icon="down"
        />
        <BalanceWidget
          title="Čistá změna"
          amount={summary?.net_change || 0}
          icon={summary?.net_change && summary.net_change >= 0 ? "up" : "down"}
          variant={summary?.net_change && summary.net_change >= 0 ? "income" : "expense"}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CashFlowChart startDate={start} endDate={end} />
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold">Rychlé akce</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <button className="flex items-center gap-3 rounded-lg border border-income bg-income/5 p-4 text-left transition-colors hover:bg-income/10">
              <span className="text-2xl">💰</span>
              <div>
                <p className="font-medium">Přidat příjem</p>
                <p className="text-sm text-muted-foreground">Zaznamenat nový příjem</p>
              </div>
            </button>
            <button className="flex items-center gap-3 rounded-lg border border-expense bg-expense/5 p-4 text-left transition-colors hover:bg-expense/10">
              <span className="text-2xl">💸</span>
              <div>
                <p className="font-medium">Přidat výdaj</p>
                <p className="text-sm text-muted-foreground">Zaznamenat nový výdaj</p>
              </div>
            </button>
            <button className="flex items-center gap-3 rounded-lg border border-transfer bg-transfer/5 p-4 text-left transition-colors hover:bg-transfer/10">
              <span className="text-2xl">🔄</span>
              <div>
                <p className="font-medium">Převod</p>
                <p className="text-sm text-muted-foreground">Mezi účty</p>
              </div>
            </button>
            <button className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-slate-50">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-medium">Reporty</p>
                <p className="text-sm text-muted-foreground">Zobrazit statistiky</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Accounts Overview */}
      <div className="rounded-lg border bg-white p-6">
        <AccountList />
      </div>

      {/* Recent Transactions */}
      <div className="rounded-lg border bg-white p-6">
        <TransactionList limit={5} />
      </div>
    </div>
  );
}

