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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMembers } from "@/hooks/useHousehold";
import { useBanksWithAccounts } from "@/hooks/useBanksAccounts";
import { useTransfersTimeline } from "@/hooks/useTransfers";
import { useBudgetSummary } from "@/hooks/useBudget";
import { householdApi, type MemberIncome } from "@/lib/tauri";
import { formatCurrency } from "@/utils/currency";

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
  const { totalFixedExpenses, totalBudgets, isLoading: budgetLoading } = useBudgetSummary();

  // Store incomes per member
  const [memberIncomes, setMemberIncomes] = useState<Record<number, MemberIncome[]>>({});
  const [incomesLoading, setIncomesLoading] = useState(true);

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

  // Calculate total income
  const totalMonthlyIncome = (members || []).reduce((sum, member) => {
    const incomes = memberIncomes[member.id] || [];
    return sum + incomes
      .filter((i) => i.is_active)
      .reduce((s, i) => s + toMonthlyAmount(i.amount, i.frequency), 0);
  }, 0);

  const remaining = totalMonthlyIncome - totalFixedExpenses - totalBudgets;

  const hasMembers = (members || []).length > 0;
  const hasBanks = banks.length > 0;

  // Calculate percentages
  const fixedPercentage = totalMonthlyIncome > 0 ? (totalFixedExpenses / totalMonthlyIncome) * 100 : 0;
  const budgetsPercentage = totalMonthlyIncome > 0 ? (totalBudgets / totalMonthlyIncome) * 100 : 0;
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
              Příjmy domácnosti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(totalMonthlyIncome)}</p>
            <p className="text-sm opacity-80 mt-1">{(members || []).length} členů</p>
          </CardContent>
        </Card>

        {/* Fixed Expenses */}
        <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Stálé výdaje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(totalFixedExpenses)}</p>
            <p className="text-sm opacity-80 mt-1">{fixedPercentage.toFixed(0)}% příjmů</p>
          </CardContent>
        </Card>

        {/* Budgets */}
        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              Rozpočty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(totalBudgets)}</p>
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
              {remaining >= 0 ? "Zbývá" : "Přečerpáno"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(Math.abs(remaining))}</p>
            <p className="text-sm opacity-80 mt-1">
              {remaining >= 0 ? `${remainingPercentage.toFixed(0)}% rezerva` : "Deficit!"}
            </p>
          </CardContent>
        </Card>
      </div>

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
              <div className="space-y-2">
                {timeline.slice(0, 4).map(({ day, transfers: dayTransfers }) => (
                  <div key={day} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                      {day}.
                    </div>
                    <div className="flex-1">
                      {dayTransfers.slice(0, 2).map((t) => {
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
                      {dayTransfers.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{dayTransfers.length - 2} dalších
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {timeline.length > 4 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{timeline.length - 4} dalších dnů
                  </p>
                )}
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
