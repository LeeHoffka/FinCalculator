import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transfersApi, incomesApi, accountsApi, expensesApi, type ScheduledTransfer, type MemberIncome, type Account, type FixedExpense } from "@/lib/tauri";

export function useScheduledTransfers() {
  return useQuery({
    queryKey: ["scheduled-transfers"],
    queryFn: transfersApi.getTransfers,
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transfersApi.createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-transfers"] });
    },
  });
}

export function useUpdateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Parameters<typeof transfersApi.updateTransfer>[1] }) =>
      transfersApi.updateTransfer(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-transfers"] });
    },
  });
}

export function useDeleteTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transfersApi.deleteTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-transfers"] });
    },
  });
}

// ============================================
// TIMELINE HELPERS
// ============================================
export interface TransfersByDay {
  day: number;
  transfers: ScheduledTransfer[];
  total: number;
}

export function useTransfersTimeline() {
  const { data: transfers, isLoading } = useScheduledTransfers();

  const timeline: TransfersByDay[] = [];
  const activeTransfers = (transfers || []).filter((t) => t.is_active);

  // Group by day
  const days = [...new Set(activeTransfers.map((t) => t.day_of_month))].sort((a, b) => a - b);

  for (const day of days) {
    const dayTransfers = activeTransfers
      .filter((t) => t.day_of_month === day)
      .sort((a, b) => a.display_order - b.display_order);

    timeline.push({
      day,
      transfers: dayTransfers,
      total: dayTransfers.reduce((sum, t) => sum + t.amount, 0),
    });
  }

  const totalAmount = activeTransfers.reduce((sum, t) => sum + t.amount, 0);

  return {
    transfers: transfers || [],
    timeline,
    totalAmount,
    isLoading,
  };
}

// ============================================
// CASH FLOW ANALYSIS
// ============================================
export interface CashFlowEvent {
  day: number;
  type: "income" | "transfer_out" | "transfer_in" | "expense";
  description: string;
  amount: number;
  accountId: number;
  relatedAccountId?: number;
}

export interface AccountCashFlow {
  accountId: number;
  initialBalance: number;
  events: CashFlowEvent[];
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
  runningBalances: { day: number; balance: number }[];
  minBalance: number;
  endOfMonthBalance: number;
  hasNegativeBalance: boolean;
}

export function useCashFlowAnalysis() {
  const { data: transfers, isLoading: transfersLoading } = useScheduledTransfers();
  const { data: incomes, isLoading: incomesLoading } = useQuery({
    queryKey: ["member-incomes"],
    queryFn: incomesApi.getIncomes,
  });
  const { data: expenses, isLoading: expensesLoading } = useQuery({
    queryKey: ["fixed-expenses"],
    queryFn: expensesApi.getExpenses,
  });
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => accountsApi.getAccounts(true),
  });

  const isLoading = transfersLoading || incomesLoading || expensesLoading || accountsLoading;

  // Build cash flow for each account
  const accountCashFlows: Map<number, AccountCashFlow> = new Map();

  if (!isLoading && accounts && transfers && incomes && expenses) {
    // Initialize accounts with their current balance
    for (const acc of accounts) {
      accountCashFlows.set(acc.id, {
        accountId: acc.id,
        initialBalance: acc.current_balance || 0,
        events: [],
        totalInflow: 0,
        totalOutflow: 0,
        netFlow: 0,
        runningBalances: [],
        minBalance: 0,
        endOfMonthBalance: 0,
        hasNegativeBalance: false,
      });
    }

    // Add incomes
    for (const income of incomes.filter(i => i.is_active && i.account_id)) {
      const flow = accountCashFlows.get(income.account_id!);
      if (flow) {
        // Convert to monthly amount
        let monthlyAmount = income.amount;
        if (income.frequency === "weekly") monthlyAmount *= 4;
        else if (income.frequency === "biweekly") monthlyAmount *= 2;
        else if (income.frequency === "yearly") monthlyAmount /= 12;

        flow.events.push({
          day: income.day_of_month || 1,
          type: "income",
          description: `${income.name} (příjem)`,
          amount: monthlyAmount,
          accountId: income.account_id!,
        });
        flow.totalInflow += monthlyAmount;
      }
    }

    // Add fixed expenses
    for (const expense of expenses.filter(e => e.is_active && e.account_id)) {
      const flow = accountCashFlows.get(expense.account_id!);
      if (flow) {
        // Convert to monthly amount
        let monthlyAmount = expense.amount;
        if (expense.frequency === "quarterly") monthlyAmount /= 3;
        else if (expense.frequency === "yearly") monthlyAmount /= 12;

        flow.events.push({
          day: expense.day_of_month || 1,
          type: "expense",
          description: `${expense.name} (${expense.category})`,
          amount: -monthlyAmount,
          accountId: expense.account_id!,
        });
        flow.totalOutflow += monthlyAmount;
      }
    }

    // Add transfers
    for (const transfer of transfers.filter(t => t.is_active)) {
      // Outflow from source
      const fromFlow = accountCashFlows.get(transfer.from_account_id);
      if (fromFlow) {
        fromFlow.events.push({
          day: transfer.day_of_month,
          type: "transfer_out",
          description: transfer.name,
          amount: -transfer.amount,
          accountId: transfer.from_account_id,
          relatedAccountId: transfer.to_account_id,
        });
        fromFlow.totalOutflow += transfer.amount;
      }

      // Inflow to destination
      const toFlow = accountCashFlows.get(transfer.to_account_id);
      if (toFlow) {
        toFlow.events.push({
          day: transfer.day_of_month,
          type: "transfer_in",
          description: transfer.name,
          amount: transfer.amount,
          accountId: transfer.to_account_id,
          relatedAccountId: transfer.from_account_id,
        });
        toFlow.totalInflow += transfer.amount;
      }
    }

    // Calculate running balances for each account
    for (const [, flow] of accountCashFlows) {
      // Sort events by day
      flow.events.sort((a, b) => a.day - b.day);
      flow.netFlow = flow.totalInflow - flow.totalOutflow;

      // Calculate running balance starting from current balance
      let balance = flow.initialBalance;
      const dayBalances: Map<number, number> = new Map();
      
      // Add initial balance at day 0
      dayBalances.set(0, balance);

      for (const event of flow.events) {
        balance += event.amount;
        dayBalances.set(event.day, balance);
      }

      // Convert to array
      flow.runningBalances = Array.from(dayBalances.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([day, bal]) => ({ day, balance: bal }));

      // Find minimum balance during the month
      flow.minBalance = Math.min(...flow.runningBalances.map(rb => rb.balance));
      flow.endOfMonthBalance = balance;
      flow.hasNegativeBalance = flow.minBalance < 0;
    }
  }

  // Calculate premium account status with incomes included
  const premiumStatus: {
    account: Account;
    inflow: number;
    minRequired: number;
    isOk: boolean;
    hasNegativeBalance: boolean;
  }[] = [];

  if (accounts) {
    for (const acc of accounts.filter(a => a.is_premium)) {
      const flow = accountCashFlows.get(acc.id);
      const inflow = flow?.totalInflow || 0;
      const minRequired = acc.premium_min_flow || 0;
      
      premiumStatus.push({
        account: acc,
        inflow,
        minRequired,
        isOk: inflow >= minRequired,
        hasNegativeBalance: flow?.hasNegativeBalance || false,
      });
    }
  }

  return {
    accountCashFlows,
    premiumStatus,
    accounts: accounts || [],
    isLoading,
  };
}

