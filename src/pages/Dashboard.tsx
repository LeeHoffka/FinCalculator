import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Receipt,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Building2,
  GitBranch,
  Loader2,
  AlertTriangle,
  Calculator,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMembers } from "@/hooks/useHousehold";
import { useBanksWithAccounts } from "@/hooks/useBanksAccounts";
import { useTransfersTimeline, useScheduledTransfers, useCashFlowAnalysis, type AccountCashFlow } from "@/hooks/useTransfers";
import { useBudgetSummary } from "@/hooks/useBudget";
import { useFinancialGoals } from "@/hooks/useGoals";
import { householdApi, type MemberIncome } from "@/lib/tauri";
import { formatCurrency } from "@/utils/currency";
import { TRANSFER_CATEGORIES } from "@/pages/MoneyFlow";

// Helper to convert frequency to monthly
const toMonthlyAmount = (amount: number, frequency: string): number => {
  switch (frequency) {
    case "weekly": return amount * 4.33;
    case "biweekly": return amount * 2.17;
    case "monthly": return amount;
    case "quarterly": return amount / 3;
    case "yearly": return amount / 12;
    default: return amount;
  }
};

export function Dashboard() {
  const navigate = useNavigate();
  const { data: members, isLoading: membersLoading } = useMembers();
  const { banks, accounts } = useBanksWithAccounts();
  const { timeline } = useTransfersTimeline();
  const { data: allTransfers } = useScheduledTransfers();
  const { totalFixedExpenses, totalBudgets, isLoading: budgetLoading } = useBudgetSummary();
  const { accountCashFlows, isLoading: cashFlowLoading } = useCashFlowAnalysis();
  const { goals, isLoading: goalsLoading } = useFinancialGoals();
  
  // Calculate reserved amounts per account (from goals/funds)
  const reservedByAccount = (goals || []).reduce((acc, goal) => {
    if (!goal.account_id || !goal.is_active) return acc;
    
    let reserved = 0;
    if (goal.goal_type === "yearly_goal" && goal.current_saved) {
      // For yearly goals, use current_saved (already saved amount)
      reserved += goal.current_saved;
    } else if (goal.goal_type === "budget_fund" && goal.current_balance) {
      // For funds, use current_balance (money in the fund)
      reserved += goal.current_balance;
    }
    // weekly_variable doesn't reserve money - it's just a planned expense
    
    if (reserved > 0) {
      acc[goal.account_id] = (acc[goal.account_id] || 0) + reserved;
    }
    return acc;
  }, {} as Record<number, number>);

  // Calculate transfers by category
  const transfersByCategory = (allTransfers || []).reduce((acc, transfer) => {
    const category = transfer.category || "technical";
    acc[category] = (acc[category] || 0) + transfer.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const mortgageTotal = transfersByCategory["mortgage"] || 0;
  const savingsTotal = transfersByCategory["savings"] || 0;
  const budgetAllocations = transfersByCategory["budget"] || 0;

  // Store incomes per member
  const [memberIncomes, setMemberIncomes] = useState<Record<number, MemberIncome[]>>({});
  const [incomesLoading, setIncomesLoading] = useState(true);

  // Quick calculator state
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calculatorAmount, setCalculatorAmount] = useState<number>(0);
  const [calculatorAccountId, setCalculatorAccountId] = useState<number | undefined>(undefined);
  const [calculatorDay, setCalculatorDay] = useState<number>(1);

  // Fetch incomes for all members
  useEffect(() => {
    if (members && members.length > 0) {
      setIncomesLoading(true);
      Promise.all(
        members.map(async (member) => {
          try {
            const incomes = await householdApi.getIncomes(member.id);
            return { id: member.id, incomes };
          } catch {
            return { id: member.id, incomes: [] };
          }
        })
      ).then((results) => {
        const incomeMap: Record<number, MemberIncome[]> = {};
        results.forEach((r) => (incomeMap[r.id] = r.incomes));
        setMemberIncomes(incomeMap);
        setIncomesLoading(false);
      });
    } else {
      setIncomesLoading(false);
    }
  }, [members]);

  const getBankById = (bankId: number | undefined) => banks.find((b) => b.id === bankId);
  const getAccountById = (accountId: number) => accounts.find((a) => a.id === accountId);

  // Calculate cash flow with bonus income
  // For calculator: start from bonus amount (not current balance) and subtract planned payments
  const calculateWithBonusIncome = (
    bonusAmount: number,
    accountId: number,
    day: number
  ): Map<number, AccountCashFlow> => {
    const result = new Map<number, AccountCashFlow>();
    
    // Clone existing cash flows
    for (const [accId, flow] of accountCashFlows) {
      result.set(accId, {
        ...flow,
        events: [...flow.events],
        runningBalances: [],
      });
    }

    // For the target account, replace initial balance with bonus
    // This shows what remains after planned payments from the bonus
    const targetFlow = result.get(accountId);
    if (targetFlow) {
      // For calculator: start from bonus amount instead of current balance
      // Remove existing income events for this account (they're already in the bonus)
      // Keep expenses, transfers, and incoming transfers from other accounts
      targetFlow.events = targetFlow.events.filter(
        (e) => !(e.type === "income" && e.accountId === accountId)
      );
      
      // Reset totals to recalculate without existing incomes
      targetFlow.totalInflow = 0;
      targetFlow.totalOutflow = 0;
      
      // Recalculate totals from filtered events
      for (const event of targetFlow.events) {
        if (event.amount > 0) {
          targetFlow.totalInflow += event.amount;
        } else {
          targetFlow.totalOutflow += Math.abs(event.amount);
        }
      }
      
      // Set initial balance to bonus
      targetFlow.initialBalance = bonusAmount;
      
      // Add a marker event for display purposes (amount 0, just for description)
      targetFlow.events.push({
        day,
        type: "income",
        description: `Jednorázový příjem (bonus/prémie): ${formatCurrency(bonusAmount)}`,
        amount: 0, // Already included in initialBalance
        accountId,
      });
    }

    // Recalculate running balances for all accounts
    for (const [, flow] of result) {
      // Sort events by day
      flow.events.sort((a, b) => a.day - b.day);
      flow.netFlow = flow.totalInflow - flow.totalOutflow;

      // For target account with bonus, start from bonus amount
      // For other accounts, use their current balance
      let balance = flow.accountId === accountId ? bonusAmount : flow.initialBalance;
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

    return result;
  };

  // Calculate total income
  const totalMonthlyIncome = (members || []).reduce((sum, member) => {
    const incomes = memberIncomes[member.id] || [];
    return sum + incomes
      .filter((i) => i.is_active)
      .reduce((s, i) => s + toMonthlyAmount(i.amount, i.frequency), 0);
  }, 0);

  // Calculate remaining - subtract fixed expenses, budgets, mortgage, savings, and budget allocations
  const remaining = totalMonthlyIncome - totalFixedExpenses - totalBudgets - mortgageTotal - savingsTotal - budgetAllocations;

  const hasMembers = (members || []).length > 0;
  const hasBanks = banks.length > 0;

  // Calculate percentages
  const fixedPercentage = totalMonthlyIncome > 0 ? (totalFixedExpenses / totalMonthlyIncome) * 100 : 0;
  const budgetsPercentage = totalMonthlyIncome > 0 ? (totalBudgets / totalMonthlyIncome) * 100 : 0;
  const mortgagePercentage = totalMonthlyIncome > 0 ? (mortgageTotal / totalMonthlyIncome) * 100 : 0;
  const savingsPercentage = totalMonthlyIncome > 0 ? (savingsTotal / totalMonthlyIncome) * 100 : 0;
  const budgetAllocPercentage = totalMonthlyIncome > 0 ? (budgetAllocations / totalMonthlyIncome) * 100 : 0;
  const remainingPercentage = totalMonthlyIncome > 0 ? (remaining / totalMonthlyIncome) * 100 : 0;

  if (membersLoading || incomesLoading || budgetLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasMembers) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-8xl mb-6">👨‍👩‍👧‍👦</div>
        <h1 className="text-3xl font-bold mb-2">Vítejte ve FinCalculator</h1>
        <p className="text-muted-foreground text-center max-w-md mb-8">
          Začněte plánovat rodinný rozpočet přidáním členů domácnosti a jejich příjmů.
        </p>
        <Button size="lg" onClick={() => navigate("/members")}>
          <Users className="mr-2 h-5 w-5" />
          Přidat členy domácnosti
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Total Income */}
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Příjmy domácnosti (Kč)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold leading-tight" style={{ fontSize: 'clamp(1.25rem, 3.5vw, 1.875rem)' }}>{formatCurrency(totalMonthlyIncome).replace(/\s*Kč/g, '')}</p>
            <p className="text-sm opacity-80 mt-1">{(members || []).length} členů</p>
          </CardContent>
        </Card>

        {/* Fixed Expenses */}
        <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Stálé výdaje (Kč)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold leading-tight" style={{ fontSize: 'clamp(1.25rem, 3.5vw, 1.875rem)' }}>{formatCurrency(totalFixedExpenses).replace(/\s*Kč/g, '')}</p>
            <p className="text-sm opacity-80 mt-1">{fixedPercentage.toFixed(0)}% příjmů</p>
          </CardContent>
        </Card>

        {/* Budgets */}
        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              Rozpočty (Kč)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold leading-tight" style={{ fontSize: 'clamp(1.25rem, 3.5vw, 1.875rem)' }}>{formatCurrency(totalBudgets).replace(/\s*Kč/g, '')}</p>
            <p className="text-sm opacity-80 mt-1">{budgetsPercentage.toFixed(0)}% příjmů</p>
          </CardContent>
        </Card>

        {/* Remaining */}
        <Card
          className={`bg-gradient-to-br ${
            remaining >= 0 ? "from-blue-500 to-indigo-600" : "from-gray-700 to-gray-900"
          } text-white`}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              {remaining >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {remaining >= 0 ? "Zbývá (Kč)" : "Přečerpáno (Kč)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold leading-tight" style={{ fontSize: 'clamp(1.25rem, 3.5vw, 1.875rem)' }}>{formatCurrency(Math.abs(remaining)).replace(/\s*Kč/g, '')}</p>
            <p className="text-sm opacity-80 mt-1">
              {remaining >= 0 ? `${remainingPercentage.toFixed(0)}% rezerva` : "Deficit!"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Calculator */}
      <Card className="border-dashed border-blue-300 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-900">Rychlý výpočet</h3>
                <p className="text-sm text-blue-700">Zadejte jednorázový příjem (prémie, bonus) a uvidíte výsledné zůstatky</p>
              </div>
            </div>
            <Dialog 
              open={calculatorOpen} 
              onOpenChange={(open) => {
                setCalculatorOpen(open);
                if (!open) {
                  // Reset when closing
                  setCalculatorAmount(0);
                  setCalculatorAccountId(undefined);
                  setCalculatorDay(1);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
                  <Calculator className="mr-2 h-4 w-4" />
                  Otevřít kalkulačku
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Rychlý výpočet s jednorázovým příjmem</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="calc-amount">Částka (Kč)</Label>
                      <Input
                        id="calc-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={calculatorAmount || ""}
                        onChange={(e) => setCalculatorAmount(parseFloat(e.target.value) || 0)}
                        placeholder="130000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="calc-account">Účet (kam přijde)</Label>
                      <Select
                        value={calculatorAccountId?.toString() || ""}
                        onValueChange={(value) => setCalculatorAccountId(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Vyberte účet" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((acc) => {
                            const bank = getBankById(acc.bank_id);
                            return (
                              <SelectItem key={acc.id} value={acc.id.toString()}>
                                [{bank?.short_name || bank?.name?.slice(0, 2)}] {acc.name}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="calc-day">Den v měsíci</Label>
                      <Input
                        id="calc-day"
                        type="number"
                        min="1"
                        max="31"
                        value={calculatorDay}
                        onChange={(e) => setCalculatorDay(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>

                  {calculatorAmount > 0 && calculatorAccountId && (
                    <div className="mt-6 space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-700 font-medium">Jednorázový příjem:</p>
                            <p className="text-2xl font-bold text-blue-900">{formatCurrency(calculatorAmount)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-blue-700 font-medium">Celkem volných prostředků:</p>
                            <p className="text-2xl font-bold text-blue-900">
                              {formatCurrency(
                                (() => {
                                  const calculatedFlows = calculateWithBonusIncome(
                                    calculatorAmount,
                                    calculatorAccountId,
                                    calculatorDay
                                  );
                                  return Array.from(calculatedFlows.values())
                                    .filter(flow => {
                                      const acc = accounts.find(a => a.id === flow.accountId);
                                      return acc && acc.account_type !== "credit_card";
                                    })
                                    .reduce((sum, flow) => sum + Math.max(0, flow.endOfMonthBalance), 0);
                                })()
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-4">Výsledné zůstatky po přidání příjmu:</h3>
                        <div className="grid gap-3 md:grid-cols-2">
                          {(() => {
                            const calculatedFlows = calculateWithBonusIncome(
                              calculatorAmount,
                              calculatorAccountId,
                              calculatorDay
                            );
                            
                            return accounts.map((account) => {
                              const flow = calculatedFlows.get(account.id);
                              if (!flow) return null;
                              
                              const bank = getBankById(account.bank_id);
                              const isCreditCard = account.account_type === "credit_card";
                              const creditLimit = account.credit_limit || 0;
                              const expectedBalance = flow.endOfMonthBalance;
                              const originalFlow = accountCashFlows.get(account.id);
                              const originalBalance = originalFlow?.endOfMonthBalance ?? (account.current_balance || 0);
                              const difference = expectedBalance - originalBalance;
                              
                              return (
                                <div
                                  key={account.id}
                                  className="p-3 rounded-lg border bg-white"
                                  style={{ borderLeftWidth: 4, borderLeftColor: bank?.color || "#ccc" }}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs"
                                        style={{ borderColor: bank?.color, color: bank?.color }}
                                      >
                                        {bank?.short_name || bank?.name?.slice(0, 3)}
                                      </Badge>
                                      <span className="font-medium text-sm">{account.name}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-1">
                                    {isCreditCard ? (
                                      <>
                                        <div className="text-right">
                                          <p className={`text-lg font-bold ${expectedBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                                            {formatCurrency(expectedBalance)}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            Dostupný kredit | Dluh: {formatCurrency(Math.max(0, creditLimit - expectedBalance))}
                                          </p>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="text-right">
                                          <p className={`text-lg font-bold ${expectedBalance >= 0 ? "text-slate-900" : "text-red-600"}`}>
                                            {formatCurrency(expectedBalance)}
                                          </p>
                                          <p className="text-xs text-muted-foreground">Očekávaný zůstatek</p>
                                        </div>
                                      </>
                                    )}
                                    
                                    {difference !== 0 && (
                                      <div className="flex items-center justify-end gap-1 mt-1">
                                        {difference > 0 ? (
                                          <TrendingUp className="h-3 w-3 text-green-600" />
                                        ) : (
                                          <TrendingDown className="h-3 w-3 text-red-600" />
                                        )}
                                        <span className={`text-xs font-medium ${difference > 0 ? "text-green-600" : "text-red-600"}`}>
                                          {difference > 0 ? "+" : ""}{formatCurrency(difference)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Budget Flow Visualization */}
      {totalMonthlyIncome > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tok peněz v domácnosti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Progress bar visualization */}
              <div className="h-8 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-red-500 transition-all flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${Math.min(fixedPercentage, 100)}%` }}
                >
                  {fixedPercentage > 10 && "Stálé"}
                </div>
                <div
                  className="h-full bg-amber-500 transition-all flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${Math.min(budgetsPercentage, 100 - fixedPercentage)}%` }}
                >
                  {budgetsPercentage > 10 && "Rozpočty"}
                </div>
                <div
                  className={`h-full ${remaining >= 0 ? "bg-blue-500" : "bg-gray-500"} transition-all flex items-center justify-center text-white text-xs font-medium`}
                  style={{ width: `${Math.max(remainingPercentage, 0)}%` }}
                >
                  {remainingPercentage > 10 && "Rezerva"}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Příjmy: {formatCurrency(totalMonthlyIncome)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Stálé výdaje: {formatCurrency(totalFixedExpenses)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span>Rozpočty: {formatCurrency(totalBudgets)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Zbývá: {formatCurrency(remaining)}</span>
                </div>
              </div>

              {/* Transfer Categories Detail */}
              {(mortgageTotal > 0 || savingsTotal > 0 || budgetAllocations > 0) && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-2">📤 Převody (zahrnuty v rozpočtu):</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {mortgageTotal > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-slate-100 rounded text-sm">
                        <span>🏠</span>
                        <div>
                          <p className="text-xs text-muted-foreground">Hypotéka/Splátky</p>
                          <p className="font-semibold text-red-600">-{formatCurrency(mortgageTotal)}</p>
                        </div>
                      </div>
                    )}
                    {savingsTotal > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-slate-100 rounded text-sm">
                        <span>💰</span>
                        <div>
                          <p className="text-xs text-muted-foreground">Spoření</p>
                          <p className="font-semibold text-amber-600">-{formatCurrency(savingsTotal)}</p>
                        </div>
                      </div>
                    )}
                    {budgetAllocations > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-slate-100 rounded text-sm">
                        <span>🍽️</span>
                        <div>
                          <p className="text-xs text-muted-foreground">Budget alokace</p>
                          <p className="font-semibold text-orange-600">-{formatCurrency(budgetAllocations)}</p>
                        </div>
                      </div>
                    )}
                    {(transfersByCategory["technical"] || 0) > 0 && (
                      <div className="flex items-center gap-2 p-2 bg-slate-100 rounded text-sm">
                        <span>🔄</span>
                        <div>
                          <p className="text-xs text-muted-foreground">Technické převody</p>
                          <p className="font-semibold text-gray-600">{formatCurrency(transfersByCategory["technical"] || 0)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Members Income */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Příjmy podle členů</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/members")}>
              Upravit <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(members || []).map((member) => {
                const incomes = memberIncomes[member.id] || [];
                const income = incomes
                  .filter((i) => i.is_active)
                  .reduce((sum, i) => sum + toMonthlyAmount(i.amount, i.frequency), 0);
                const percentage = totalMonthlyIncome > 0 ? (income / totalMonthlyIncome) * 100 : 0;

                return (
                  <div key={member.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: member.color }}
                        />
                        <span className="font-medium">{member.name}</span>
                      </div>
                      <span>{formatCurrency(income)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${percentage}%`, backgroundColor: member.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Money Flow Timeline Preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Workflow převodů
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/flow")}>
              {hasBanks ? "Upravit" : "Nastavit"} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {timeline.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {timeline.map(({ day, transfers: dayTransfers }) => (
                  <div key={day} className="flex items-start gap-3 p-2 bg-slate-50 rounded-lg">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex-shrink-0">
                      {day}.
                    </div>
                    <div className="flex-1 space-y-1">
                      {dayTransfers.map((t) => {
                        const from = getAccountById(t.from_account_id);
                        const to = getAccountById(t.to_account_id);
                        const fromBank = from ? getBankById(from.bank_id) : undefined;
                        const toBank = to ? getBankById(to.bank_id) : undefined;

                        return (
                          <div key={t.id} className="flex items-center gap-1 text-sm">
                            <Badge
                              variant="outline"
                              className="text-xs px-1"
                              style={{ borderColor: fromBank?.color, color: fromBank?.color }}
                            >
                              {fromBank?.short_name || fromBank?.name?.slice(0, 2)}
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <Badge
                              variant="outline"
                              className="text-xs px-1"
                              style={{ borderColor: toBank?.color, color: toBank?.color }}
                            >
                              {toBank?.short_name || toBank?.name?.slice(0, 2)}
                            </Badge>
                            <span className="font-medium ml-1">{formatCurrency(t.amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {hasBanks ? "Nastavte workflow převodů mezi účty" : "Nejprve přidejte banky a účty"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => navigate(hasBanks ? "/flow" : "/banks")}
                >
                  {hasBanks ? "Přidat převody" : "Přidat banky"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Accounts Overview */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Přehled účtů
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/banks")}>
              Upravit <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => {
                const bank = getBankById(account.bank_id);
                const isCreditCard = account.account_type === "credit_card";
                const balance = account.current_balance || 0;
                const creditLimit = account.credit_limit || 0;
                
                // Find owner
                const owner = account.owner_user_id 
                  ? (members || []).find(m => m.id === account.owner_user_id)
                  : null;
                
                // Get cash flow analysis
                const cashFlow = accountCashFlows.get(account.id);
                const expectedBalance = cashFlow?.endOfMonthBalance ?? balance;
                const hasWarning = cashFlow?.hasNegativeBalance || (expectedBalance < 0 && !isCreditCard);
                const netChange = expectedBalance - balance;
                
                // Get goals linked to this account
                const accountGoals = (goals || []).filter(g => 
                  g.account_id === account.id && 
                  g.is_active && 
                  ((g.goal_type === "yearly_goal" && g.current_saved) || 
                   (g.goal_type === "budget_fund" && g.current_balance))
                );
                
                return (
                  <div
                    key={account.id}
                    className={`p-3 rounded-lg border ${hasWarning ? "border-red-300 bg-red-50" : ""}`}
                    style={{ borderLeftWidth: 4, borderLeftColor: bank?.color || "#ccc" }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ borderColor: bank?.color, color: bank?.color }}
                        >
                          {bank?.short_name || bank?.name?.slice(0, 3)}
                        </Badge>
                        <span className="font-medium text-sm">{account.name}</span>
                        {owner && (
                          <Badge variant="outline" className="text-xs" style={{ borderColor: owner.color, color: owner.color }}>
                            {owner.name}
                          </Badge>
                        )}
                      </div>
                      {account.is_premium && (
                        <Badge variant="secondary" className="text-xs">⭐</Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {isCreditCard ? (
                        <>
                          {/* Credit Card - show EXPECTED available balance as main number */}
                          {!cashFlowLoading && cashFlow ? (
                            <>
                              {/* Expected Available Balance (MAIN) */}
                              <div className="text-right">
                                <p className={`text-2xl font-bold ${expectedBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                                  {formatCurrency(expectedBalance)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Očekávaný dostupný kredit po všech transakcích
                                </p>
                              </div>
                              
                              {/* Current Balance (smaller) */}
                              <div className="pt-2 border-t border-slate-200 space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Aktuální dostupný kredit:</span>
                                  <span className="font-medium">{formatCurrency(balance)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Limit karty:</span>
                                  <span className="font-medium">{formatCurrency(creditLimit)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Aktuální dluh:</span>
                                  <span className="font-medium text-red-600">{formatCurrency(Math.max(0, creditLimit - balance))}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Očekávaný dluh:</span>
                                  <span className={`font-medium ${creditLimit - expectedBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                                    {formatCurrency(Math.max(0, creditLimit - expectedBalance))}
                                  </span>
                                </div>
                                
                                {netChange !== 0 && (
                                  <div className="flex items-center justify-end gap-1 mt-1">
                                    {netChange > 0 ? (
                                      <TrendingUp className="h-3 w-3 text-green-600" />
                                    ) : (
                                      <TrendingDown className="h-3 w-3 text-red-600" />
                                    )}
                                    <span className={`text-xs font-medium ${netChange > 0 ? "text-green-600" : "text-red-600"}`}>
                                      {netChange > 0 ? "+" : ""}{formatCurrency(netChange)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            /* Fallback if cash flow not loaded */
                            <div className="text-right">
                              <p className={`text-lg font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {formatCurrency(balance)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Limit: {formatCurrency(creditLimit)} | Dluh: {formatCurrency(Math.max(0, creditLimit - balance))}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Regular Account - show EXPECTED balance as main number */}
                          {!cashFlowLoading && cashFlow ? (
                            <>
                              {/* Expected Balance (MAIN) */}
                              <div className="text-right">
                                <p className={`text-2xl font-bold ${expectedBalance >= 0 ? "text-slate-900" : "text-red-600"}`}>
                                  {formatCurrency(expectedBalance)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Očekávaný zůstatek po všech transakcích
                                </p>
                              </div>
                              
                              {/* Current Balance (smaller) */}
                              <div className="pt-2 border-t border-slate-200 space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Aktuální zůstatek:</span>
                                  <span className="font-medium">{formatCurrency(balance)}</span>
                                </div>
                                
                                {/* Reserved for goals */}
                                {reservedByAccount[account.id] > 0 && (
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground">Rezervováno pro cíle:</span>
                                      <span className="font-medium text-amber-600">{formatCurrency(reservedByAccount[account.id])}</span>
                                    </div>
                                    {accountGoals.length > 0 && (
                                      <div className="pl-2 space-y-0.5">
                                        {accountGoals.map(goal => (
                                          <div key={goal.id} className="text-xs text-muted-foreground flex items-center justify-between">
                                            <span>• {goal.name}</span>
                                            <span className="text-amber-600">
                                              {formatCurrency(
                                                (goal.goal_type === "yearly_goal" ? goal.current_saved : goal.current_balance) || 0
                                              )}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Available balance */}
                                {reservedByAccount[account.id] > 0 && (
                                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                                    <span className="text-muted-foreground font-semibold">Volný zůstatek:</span>
                                    <span className={`font-bold ${expectedBalance - reservedByAccount[account.id] >= 0 ? "text-green-600" : "text-red-600"}`}>
                                      {formatCurrency(expectedBalance - reservedByAccount[account.id])}
                                    </span>
                                  </div>
                                )}
                                
                                {netChange !== 0 && (
                                  <div className="flex items-center justify-end gap-1 mt-1">
                                    {netChange > 0 ? (
                                      <TrendingUp className="h-3 w-3 text-green-600" />
                                    ) : (
                                      <TrendingDown className="h-3 w-3 text-red-600" />
                                    )}
                                    <span className={`text-xs font-medium ${netChange > 0 ? "text-green-600" : "text-red-600"}`}>
                                      {netChange > 0 ? "+" : ""}{formatCurrency(netChange)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            /* Fallback if cash flow not loaded */
                            <div className="text-right">
                              <p className={`text-lg font-bold ${balance >= 0 ? "text-slate-900" : "text-red-600"}`}>
                                {formatCurrency(balance)}
                              </p>
                              <p className="text-xs text-muted-foreground">Aktuální zůstatek</p>
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Warning */}
                      {hasWarning && (
                        <div className="flex items-center gap-1 text-xs text-red-600 bg-red-100 p-1 rounded mt-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Nedostatečný zůstatek!</span>
                        </div>
                      )}
                      
                      {/* Debug info - show what's being calculated */}
                      {!cashFlowLoading && cashFlow && (
                        <details className="mt-2 text-xs text-muted-foreground border-t border-slate-200 pt-2">
                          <summary className="cursor-pointer hover:text-slate-700">🔍 Zobrazit detaily výpočtu</summary>
                          <div className="mt-2 pl-2 space-y-1 bg-slate-50 p-2 rounded">
                            <div className="grid grid-cols-2 gap-2">
                              <div>Příjmy:</div>
                              <div className="text-right font-medium text-green-600">+{formatCurrency(cashFlow.totalInflow)}</div>
                              <div>Výdaje:</div>
                              <div className="text-right font-medium text-red-600">-{formatCurrency(cashFlow.totalOutflow)}</div>
                              <div>Čistý tok:</div>
                              <div className={`text-right font-medium ${cashFlow.netFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {formatCurrency(cashFlow.netFlow)}
                              </div>
                              <div>Počáteční zůstatek:</div>
                              <div className="text-right">{formatCurrency(cashFlow.initialBalance)}</div>
                              {isCreditCard && (
                                <>
                                  <div>Limit karty:</div>
                                  <div className="text-right">{formatCurrency(creditLimit)}</div>
                                  <div>Očekávaný dostupný kredit:</div>
                                  <div className={`text-right font-medium ${expectedBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                                    {formatCurrency(expectedBalance)}
                                  </div>
                                  <div>Očekávaný dluh:</div>
                                  <div className={`text-right font-medium ${creditLimit - expectedBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                                    {formatCurrency(Math.max(0, creditLimit - expectedBalance))}
                                  </div>
                                </>
                              )}
                            </div>
                            {cashFlow.events.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-200">
                                <div className="font-semibold mb-1">Plánované transakce ({cashFlow.events.length}):</div>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                  {cashFlow.events.map((e, i) => (
                                    <div key={i} className="pl-2 text-xs">
                                      <span className="font-mono">Den {e.day}:</span>{" "}
                                      <span className={e.amount >= 0 ? "text-green-600" : "text-red-600"}>
                                        {e.amount >= 0 ? "+" : ""}{formatCurrency(e.amount)}
                                      </span>{" "}
                                      <span className="text-muted-foreground">({e.description})</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Setup Cards */}
      {(!hasBanks || totalFixedExpenses === 0 || totalBudgets === 0) && (
        <div className="grid gap-4 md:grid-cols-3">
          {!hasBanks && (
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow border-dashed border-blue-300 bg-blue-50"
              onClick={() => navigate("/banks")}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="text-4xl">🏦</div>
                <div>
                  <h3 className="font-semibold">Přidejte banky a účty</h3>
                  <p className="text-sm text-muted-foreground">Pro nastavení workflow převodů</p>
                </div>
              </CardContent>
            </Card>
          )}

          {totalFixedExpenses === 0 && (
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow border-dashed"
              onClick={() => navigate("/expenses")}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="text-4xl">🏠</div>
                <div>
                  <h3 className="font-semibold">Přidejte stálé výdaje</h3>
                  <p className="text-sm text-muted-foreground">Nájem, energie, pojištění...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {totalBudgets === 0 && (
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow border-dashed"
              onClick={() => navigate("/budgets")}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="text-4xl">📊</div>
                <div>
                  <h3 className="font-semibold">Nastavte rozpočty</h3>
                  <p className="text-sm text-muted-foreground">Jídlo, zábava, oblečení...</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
