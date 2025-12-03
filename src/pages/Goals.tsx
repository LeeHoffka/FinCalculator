import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Loader2, Calendar, PiggyBank, Target, Clock, Pencil, TrendingUp, Minus, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  useFinancialGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useAddContribution,
  useCreateWithdrawal,
  useGoalsSummary,
  getDayName,
  getMonthName,
  calculateWeeklyRecommendation,
  calculateYearlyGoalRecommendation,
} from "@/hooks/useGoals";
import { useBanksWithAccounts } from "@/hooks/useBanksAccounts";
import { formatCurrency } from "@/utils/currency";
import { goalsApi, type FinancialGoal, type MonthlyPlan } from "@/lib/tauri";

const GOAL_TYPES = [
  { value: "weekly_variable", label: "📅 Variabilní týdenní", description: "Uklízečka, masér..." },
  { value: "fund", label: "💰 Fond/Budget", description: "Kadeřník, oblečení..." },
  { value: "yearly_goal", label: "🎯 Roční cíl", description: "Pojištění, dovolená..." },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Pondělí" },
  { value: 1, label: "Úterý" },
  { value: 2, label: "Středa" },
  { value: 3, label: "Čtvrtek" },
  { value: 4, label: "Pátek" },
  { value: 5, label: "Sobota" },
  { value: 6, label: "Neděle" },
];

const MONTHS = [
  { value: 1, label: "Leden" },
  { value: 2, label: "Únor" },
  { value: 3, label: "Březen" },
  { value: 4, label: "Duben" },
  { value: 5, label: "Květen" },
  { value: 6, label: "Červen" },
  { value: 7, label: "Červenec" },
  { value: 8, label: "Srpen" },
  { value: 9, label: "Září" },
  { value: 10, label: "Říjen" },
  { value: 11, label: "Listopad" },
  { value: 12, label: "Prosinec" },
];

const emptyForm = {
  name: "",
  goal_type: "weekly_variable",
  icon: "",
  color: "#3B82F6",
  weekly_amount: undefined as number | undefined,
  day_of_week: 1, // Úterý
  monthly_contribution: undefined as number | undefined,
  current_balance: 0,
  yearly_amount: undefined as number | undefined,
  target_month: 4, // Duben
  current_saved: 0, // Pro roční cíle - kolik už mám naspořeno
  account_id: undefined as number | undefined,
  notes: "",
};

export function Goals() {
  const { recommendations, totalRecommended, isLoading } = useGoalsSummary();
  const { accounts, banks } = useBanksWithAccounts();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const addContribution = useAddContribution();
  const createWithdrawal = useCreateWithdrawal();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [form, setForm] = useState(emptyForm);
  
  // Quick action dialogs
  const [contributionGoal, setContributionGoal] = useState<FinancialGoal | null>(null);
  const [contributionAmount, setContributionAmount] = useState(0);
  const [withdrawalGoal, setWithdrawalGoal] = useState<FinancialGoal | null>(null);
  
  // Monthly plans for weekly variable goals
  const [monthlyPlans, setMonthlyPlans] = useState<Record<number, MonthlyPlan>>({});
  const [planDialogGoal, setPlanDialogGoal] = useState<FinancialGoal | null>(null);
  const [planRealizedCount, setPlanRealizedCount] = useState(0);
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  // Load monthly plans for weekly goals
  useEffect(() => {
    const loadPlans = async () => {
      const weeklyGoals = recommendations.filter(r => r.type === "weekly").map(r => r.goal);
      for (const goal of weeklyGoals) {
        try {
          const plan = await goalsApi.getMonthlyPlan(goal.id, currentYear, currentMonth);
          if (plan) {
            setMonthlyPlans(prev => ({ ...prev, [goal.id]: plan }));
          }
        } catch (e) {
          // Plan doesn't exist yet
        }
      }
    };
    if (recommendations.length > 0) {
      loadPlans();
    }
  }, [recommendations, currentYear, currentMonth]);
  
  const openPlanDialog = (goal: FinancialGoal) => {
    const plan = monthlyPlans[goal.id];
    const { count } = calculateWeeklyRecommendation(goal.weekly_amount || 0, goal.day_of_week || 0);
    setPlanDialogGoal(goal);
    setPlanRealizedCount(plan?.realized_count ?? count); // Default to all realized
  };
  
  const handleSavePlan = async () => {
    if (!planDialogGoal) return;
    const { count, total } = calculateWeeklyRecommendation(planDialogGoal.weekly_amount || 0, planDialogGoal.day_of_week || 0);
    const realizedAmount = planRealizedCount * (planDialogGoal.weekly_amount || 0);
    const saved = total - realizedAmount;
    
    try {
      const plan = await goalsApi.updateMonthlyPlan(
        planDialogGoal.id,
        currentYear,
        currentMonth,
        count,
        planRealizedCount,
        total,
        realizedAmount
      );
      
      // Update state to refresh UI
      setMonthlyPlans(prev => ({ ...prev, [planDialogGoal.id]: plan }));
      setPlanDialogGoal(null);
      
      // Show success message
      if (saved > 0) {
        alert(`✅ Uloženo!\n\nRealizováno: ${planRealizedCount} / ${count}\n🎉 Ušetřeno: ${formatCurrency(saved)}`);
      } else {
        alert(`✅ Uloženo!\n\nRealizováno: ${planRealizedCount} / ${count}`);
      }
    } catch (e) {
      console.error("Error saving plan:", e);
      alert("❌ Chyba při ukládání plánu: " + (e as Error).message);
    }
  };
  const [withdrawalAmount, setWithdrawalAmount] = useState(0);
  const [withdrawalDescription, setWithdrawalDescription] = useState("");

  const getBankById = (id: number | undefined) => banks.find((b) => b.id === id);

  const openNewDialog = () => {
    setEditingGoal(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setForm({
      name: goal.name,
      goal_type: goal.goal_type,
      icon: goal.icon || "",
      color: goal.color || "#3B82F6",
      weekly_amount: goal.weekly_amount,
      day_of_week: goal.day_of_week ?? 1,
      monthly_contribution: goal.monthly_contribution,
      current_balance: goal.current_balance || 0,
      yearly_amount: goal.yearly_amount,
      target_month: goal.target_month ?? 4,
      current_saved: goal.current_saved || 0,
      account_id: goal.account_id,
      notes: goal.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        await updateGoal.mutateAsync({
          id: editingGoal.id,
          input: { ...form, is_active: true },
        });
      } else {
        await createGoal.mutateAsync(form);
      }
      setIsDialogOpen(false);
      setEditingGoal(null);
      setForm(emptyForm);
    } catch (error) {
      console.error("Failed to save goal:", error);
      alert("Chyba: " + (error as Error).message);
    }
  };

  const handleAddContribution = async () => {
    if (!contributionGoal || contributionAmount <= 0) return;
    try {
      await addContribution.mutateAsync({ goalId: contributionGoal.id, amount: contributionAmount });
      setContributionGoal(null);
      setContributionAmount(0);
    } catch (error) {
      alert("Chyba: " + (error as Error).message);
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawalGoal || withdrawalAmount <= 0) return;
    try {
      await createWithdrawal.mutateAsync({
        goal_id: withdrawalGoal.id,
        amount: withdrawalAmount,
        description: withdrawalDescription || undefined,
      });
      setWithdrawalGoal(null);
      setWithdrawalAmount(0);
      setWithdrawalDescription("");
    } catch (error) {
      alert("Chyba: " + (error as Error).message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Finanční cíle & Fondy</h1>
          <p className="text-muted-foreground">Variabilní výdaje, fondy a roční cíle</p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Přidat cíl
        </Button>
      </div>

      {/* Recommendation Summary */}
      {recommendations.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Doporučení pro tento měsíc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(totalRecommended)}</p>
            <p className="text-sm opacity-80 mt-1">Celkem na alokace a cíle</p>
          </CardContent>
        </Card>
      )}

      {/* Goals by Type */}
      {recommendations.length > 0 ? (
        <div className="space-y-4">
          {/* Weekly Variable */}
          {recommendations.filter(r => r.type === "weekly").length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  📅 Variabilní týdenní výdaje
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.filter(r => r.type === "weekly").map(({ goal, recommended, detail }) => {
                  const plan = monthlyPlans[goal.id];
                  const { count } = calculateWeeklyRecommendation(goal.weekly_amount || 0, goal.day_of_week || 0);
                  const realizedCount = plan?.realized_count ?? count;
                  const saved = (count - realizedCount) * (goal.weekly_amount || 0);
                  const hasUnrealized = realizedCount < count;
                  
                  return (
                    <div key={goal.id} className="p-3 bg-blue-50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{goal.name}</p>
                          <p className="text-sm text-muted-foreground">{detail}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(goal.weekly_amount || 0)} × {getDayName(goal.day_of_week || 0)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Plán měsíce</p>
                            <p className="text-xl font-bold text-blue-600">{formatCurrency(recommended)}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(goal)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteGoal.mutate(goal.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Monthly tracking */}
                      <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            Realizováno: <strong>{realizedCount}</strong> / {count}
                          </span>
                          {hasUnrealized && (
                            <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                              🎉 Ušetřeno {formatCurrency(saved)}
                            </Badge>
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openPlanDialog(goal)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Upravit realizace
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Funds */}
          {recommendations.filter(r => r.type === "fund").length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PiggyBank className="h-5 w-5 text-green-500" />
                  💰 Fondy / Budget
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.filter(r => r.type === "fund").map(({ goal, recommended, detail }) => (
                  <div key={goal.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">{goal.name}</p>
                      <p className="text-sm text-green-600 font-medium">{detail}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Měsíční příspěvek</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(recommended)}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-green-600 border-green-300"
                          onClick={() => {
                            setContributionGoal(goal);
                            setContributionAmount(goal.monthly_contribution || 0);
                          }}
                        >
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Přidat
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 border-red-300"
                          onClick={() => {
                            setWithdrawalGoal(goal);
                            setWithdrawalAmount(0);
                          }}
                        >
                          <Minus className="h-4 w-4 mr-1" />
                          Čerpat
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(goal)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteGoal.mutate(goal.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Yearly Goals */}
          {recommendations.filter(r => r.type === "yearly").length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-5 w-5 text-amber-500" />
                  🎯 Roční cíle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.filter(r => r.type === "yearly").map(({ goal, recommended, detail }) => {
                  const { progress, remaining } = calculateYearlyGoalRecommendation(
                    goal.yearly_amount || 0,
                    goal.target_month || 4,
                    goal.current_saved || 0
                  );
                  
                  return (
                    <div key={goal.id} className="p-3 bg-amber-50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{goal.name}</p>
                          <p className="text-sm text-muted-foreground">{detail}</p>
                          <p className="text-xs text-muted-foreground">
                            Cíl: {formatCurrency(goal.yearly_amount || 0)} | Naspořeno: {formatCurrency(goal.current_saved || 0)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Měsíčně odkládat</p>
                            <p className="text-xl font-bold text-amber-600">{formatCurrency(recommended)}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(goal)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteGoal.mutate(goal.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="space-y-1">
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{progress.toFixed(0)}% splněno</span>
                          <span>Zbývá: {formatCurrency(remaining)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold">Přidejte finanční cíle</h3>
            <p className="text-muted-foreground mt-2 text-center max-w-md">
              Variabilní výdaje (uklízečka), fondy (kadeřník), roční cíle (pojištění)
            </p>
            <Button onClick={openNewDialog} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Přidat první cíl
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Goal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Upravit cíl" : "Nový finanční cíl"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Název</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="např. Uklízečka, Kadeřník, Pojištění domu"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Typ cíle</Label>
              <Select
                value={form.goal_type}
                onValueChange={(value) => setForm({ ...form, goal_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <span>{type.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Weekly Variable Fields */}
            {form.goal_type === "weekly_variable" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Částka za týden</Label>
                    <Input
                      type="number"
                      value={form.weekly_amount || ""}
                      onChange={(e) => setForm({ ...form, weekly_amount: parseFloat(e.target.value) || undefined })}
                      placeholder="1150"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Den v týdnu</Label>
                    <Select
                      value={form.day_of_week.toString()}
                      onValueChange={(value) => setForm({ ...form, day_of_week: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={day.value.toString()}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                  💡 Aplikace spočítá kolik {getDayName(form.day_of_week)}ů je v aktuálním měsíci
                </p>
              </>
            )}

            {/* Fund Fields */}
            {form.goal_type === "fund" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Měsíční příspěvek</Label>
                    <Input
                      type="number"
                      value={form.monthly_contribution || ""}
                      onChange={(e) => setForm({ ...form, monthly_contribution: parseFloat(e.target.value) || undefined })}
                      placeholder="2000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Aktuální zůstatek fondu</Label>
                    <Input
                      type="number"
                      value={form.current_balance || ""}
                      onChange={(e) => setForm({ ...form, current_balance: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <p className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  💡 Můžete sledovat zůstatek fondu a zaznamenávat čerpání
                </p>
              </>
            )}

            {/* Yearly Goal Fields */}
            {form.goal_type === "yearly_goal" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Roční částka</Label>
                    <Input
                      type="number"
                      value={form.yearly_amount || ""}
                      onChange={(e) => setForm({ ...form, yearly_amount: parseFloat(e.target.value) || undefined })}
                      placeholder="10000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Měsíc splátky</Label>
                    <Select
                      value={form.target_month.toString()}
                      onValueChange={(value) => setForm({ ...form, target_month: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((month) => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Už mám naspořeno</Label>
                  <Input
                    type="number"
                    value={form.current_saved || ""}
                    onChange={(e) => setForm({ ...form, current_saved: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Kolik už máte naspořeno na tento cíl (odečte se od potřebné částky)
                  </p>
                </div>
                <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                  💡 Aplikace spočítá kolik měsíčně odkládat aby bylo v {getMonthName(form.target_month)} dost
                </p>
              </>
            )}

            <div className="space-y-2">
              <Label>Z účtu (volitelné)</Label>
              <Select
                value={form.account_id?.toString() || "none"}
                onValueChange={(value) => setForm({ ...form, account_id: value === "none" ? undefined : parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte účet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Neurčeno</SelectItem>
                  {accounts.map((acc) => {
                    const bank = getBankById(acc.bank_id);
                    return (
                      <SelectItem key={acc.id} value={acc.id.toString()}>
                        [{bank?.short_name}] {acc.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Zrušit
              </Button>
              <Button type="submit" disabled={createGoal.isPending || updateGoal.isPending}>
                {createGoal.isPending || updateGoal.isPending ? "Ukládám..." : editingGoal ? "Uložit" : "Vytvořit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contribution Dialog */}
      <Dialog open={!!contributionGoal} onOpenChange={() => setContributionGoal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Přidat příspěvek do fondu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Fond: <strong>{contributionGoal?.name}</strong>
            </p>
            <div className="space-y-2">
              <Label>Částka</Label>
              <Input
                type="number"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(parseFloat(e.target.value) || 0)}
                placeholder="2000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContributionGoal(null)}>Zrušit</Button>
            <Button onClick={handleAddContribution} disabled={addContribution.isPending}>
              {addContribution.isPending ? "Ukládám..." : "Přidat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Dialog */}
      <Dialog open={!!withdrawalGoal} onOpenChange={() => setWithdrawalGoal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Čerpání z fondu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Fond: <strong>{withdrawalGoal?.name}</strong> 
              (zůstatek: {formatCurrency(withdrawalGoal?.current_balance || 0)})
            </p>
            <div className="space-y-2">
              <Label>Částka</Label>
              <Input
                type="number"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(parseFloat(e.target.value) || 0)}
                placeholder="500"
              />
            </div>
            <div className="space-y-2">
              <Label>Popis (volitelné)</Label>
              <Input
                value={withdrawalDescription}
                onChange={(e) => setWithdrawalDescription(e.target.value)}
                placeholder="např. Střih + barva"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawalGoal(null)}>Zrušit</Button>
            <Button onClick={handleWithdrawal} disabled={createWithdrawal.isPending} variant="destructive">
              {createWithdrawal.isPending ? "Ukládám..." : "Odečíst"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Monthly Plan Dialog */}
      <Dialog open={!!planDialogGoal} onOpenChange={() => setPlanDialogGoal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>📅 Realizace tento měsíc</DialogTitle>
          </DialogHeader>
          {planDialogGoal && (() => {
            const { count, total } = calculateWeeklyRecommendation(
              planDialogGoal.weekly_amount || 0, 
              planDialogGoal.day_of_week || 0
            );
            const realizedAmount = planRealizedCount * (planDialogGoal.weekly_amount || 0);
            const saved = total - realizedAmount;
            
            return (
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="font-medium">{planDialogGoal.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(planDialogGoal.weekly_amount || 0)} × {count} {getDayName(planDialogGoal.day_of_week || 0)} = {formatCurrency(total)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Kolik realizací proběhlo?</Label>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPlanRealizedCount(Math.max(0, planRealizedCount - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-2xl font-bold w-12 text-center">{planRealizedCount}</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPlanRealizedCount(Math.min(count, planRealizedCount + 1))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <span className="text-muted-foreground">/ {count}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Realizováno</p>
                    <p className="text-lg font-bold">{formatCurrency(realizedAmount)}</p>
                  </div>
                  {saved > 0 ? (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-xs text-green-600">🎉 Ušetřeno</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(saved)}</p>
                    </div>
                  ) : (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-600">Vše realizováno</p>
                      <p className="text-lg font-bold text-blue-600">✓</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogGoal(null)}>Zrušit</Button>
            <Button onClick={handleSavePlan}>Uložit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

