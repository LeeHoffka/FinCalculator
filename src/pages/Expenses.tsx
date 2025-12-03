import { useState, useMemo } from "react";
import { Plus, Trash2, Loader2, Calendar, ArrowUpDown, Building2, Pencil, Filter, Check, Calculator } from "lucide-react";
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
import {
  useFixedExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  useBudgetSummary,
  FIXED_EXPENSE_CATEGORIES,
} from "@/hooks/useBudget";
import { useMembers } from "@/hooks/useHousehold";
import { useBanksWithAccounts } from "@/hooks/useBanksAccounts";
import { formatCurrency } from "@/utils/currency";
import type { FixedExpense } from "@/lib/tauri";

const FREQUENCY_LABELS: Record<string, string> = {
  monthly: "Měsíčně",
  quarterly: "Čtvrtletně",
  yearly: "Ročně",
};

type SortBy = "day" | "category" | "account" | "amount";

const emptyForm = {
  name: "",
  amount: 0,
  category: "other",
  frequency: "monthly",
  day_of_month: 1,
  account_id: undefined as number | undefined,
  assigned_to: "shared",
  notes: "",
};

export function Expenses() {
  const { expenses, totalFixedExpenses, expensesByCategory, isLoading, toMonthlyAmount } =
    useBudgetSummary();
  const { data: members } = useMembers();
  const { accounts, banks } = useBanksWithAccounts();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("day");
  const [form, setForm] = useState(emptyForm);
  
  // Selection and filter state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [dayFilterFrom, setDayFilterFrom] = useState<number | undefined>(undefined);
  const [dayFilterTo, setDayFilterTo] = useState<number | undefined>(undefined);
  const [accountFilter, setAccountFilter] = useState<number | "all" | "credit_cards">("all");

  const openEditDialog = (expense: FixedExpense) => {
    setEditingExpense(expense);
    setForm({
      name: expense.name,
      amount: expense.amount,
      category: expense.category,
      frequency: expense.frequency,
      day_of_month: expense.day_of_month || 1,
      account_id: expense.account_id,
      assigned_to: expense.assigned_to || "shared",
      notes: expense.notes || "",
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingExpense(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await updateExpense.mutateAsync({ id: editingExpense.id, input: form });
      } else {
        await createExpense.mutateAsync(form);
      }
      setForm(emptyForm);
      setEditingExpense(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to save expense:", error);
      alert("Chyba při ukládání výdaje: " + (error as Error).message);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingExpense(null);
    setForm(emptyForm);
  };

  // Helper functions
  const getAccountById = (id: number | undefined) => accounts.find((a) => a.id === id);
  const getBankById = (id: number | undefined) => banks.find((b) => b.id === id);
  
  // Get credit card accounts
  const creditCardAccounts = useMemo(() => 
    accounts.filter(a => a.account_type === "credit_card"), 
    [accounts]
  );
  
  // Selection helpers
  const toggleSelection = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  const selectAll = (expenseIds: number[]) => {
    setSelectedIds(new Set(expenseIds));
  };
  
  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Filter expenses by day range and account
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      // Day filter
      if (dayFilterFrom !== undefined && (exp.day_of_month || 0) < dayFilterFrom) return false;
      if (dayFilterTo !== undefined && (exp.day_of_month || 31) > dayFilterTo) return false;
      
      // Account filter
      if (accountFilter === "credit_cards") {
        const account = exp.account_id ? getAccountById(exp.account_id) : undefined;
        if (!account || account.account_type !== "credit_card") return false;
      } else if (typeof accountFilter === "number") {
        if (exp.account_id !== accountFilter) return false;
      }
      
      return true;
    });
  }, [expenses, dayFilterFrom, dayFilterTo, accountFilter, accounts]);

  // Sort expenses
  const sortedExpenses = useMemo(() => {
    const sorted = [...filteredExpenses];
    switch (sortBy) {
      case "day":
        return sorted.sort((a, b) => (a.day_of_month || 0) - (b.day_of_month || 0));
      case "category":
        return sorted.sort((a, b) => a.category.localeCompare(b.category));
      case "account":
        return sorted.sort((a, b) => (a.account_id || 0) - (b.account_id || 0));
      case "amount":
        return sorted.sort((a, b) => b.amount - a.amount);
      default:
        return sorted;
    }
  }, [filteredExpenses, sortBy]);
  
  // Calculate selected total
  const selectedTotal = useMemo(() => {
    return expenses
      .filter(e => selectedIds.has(e.id))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, selectedIds]);

  // Group by selected criteria
  const groupedExpenses = useMemo(() => {
    if (sortBy === "category") {
      return FIXED_EXPENSE_CATEGORIES.map((cat) => ({
        key: cat.value,
        label: `${cat.icon} ${cat.label}`,
        expenses: sortedExpenses.filter((e) => e.category === cat.value),
        total: expensesByCategory[cat.value] || 0,
      })).filter((g) => g.expenses.length > 0);
    }
    
    if (sortBy === "account") {
      const byAccount = new Map<number | undefined, typeof expenses>();
      for (const exp of sortedExpenses) {
        const list = byAccount.get(exp.account_id) || [];
        list.push(exp);
        byAccount.set(exp.account_id, list);
      }
      
      return Array.from(byAccount.entries()).map(([accountId, exps]) => {
        const account = accountId ? getAccountById(accountId) : undefined;
        const bank = account ? getBankById(account.bank_id) : undefined;
        return {
          key: accountId?.toString() || "none",
          label: account ? `${bank?.short_name || bank?.name} - ${account.name}` : "Bez účtu",
          expenses: exps,
          total: exps.reduce((sum, e) => sum + toMonthlyAmount(e.amount, e.frequency), 0),
        };
      });
    }

    // Default: single group sorted by day
    return [{
      key: "all",
      label: "Všechny výdaje (seřazené podle dne)",
      expenses: sortedExpenses,
      total: totalFixedExpenses,
    }];
  }, [sortedExpenses, sortBy, expensesByCategory, totalFixedExpenses, accounts, banks]);

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
          <h1 className="text-2xl font-bold">Stálé výdaje</h1>
          <p className="text-muted-foreground">Nájem, energie, pojištění a další pravidelné platby</p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Přidat výdaj
        </Button>
      </div>

      {/* Total Card */}
      <Card className="bg-gradient-to-r from-red-500 to-rose-600 text-white">
        <CardHeader>
          <CardTitle className="text-lg font-medium opacity-90">
            Celkové měsíční stálé výdaje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{formatCurrency(totalFixedExpenses)}</p>
          <p className="mt-2 text-sm opacity-80">{expenses.length} položek</p>
        </CardContent>
      </Card>

      {/* Filters and controls */}
      {expenses.length > 0 && (
        <Card className="bg-slate-50">
          <CardContent className="pt-4 space-y-4">
            {/* Day filter */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtr podle dne:</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Od"
                  value={dayFilterFrom || ""}
                  onChange={(e) => setDayFilterFrom(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-20 h-8"
                />
                <span className="text-muted-foreground">—</span>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Do"
                  value={dayFilterTo || ""}
                  onChange={(e) => setDayFilterTo(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-20 h-8"
                />
              </div>
              
              {/* Quick day filters */}
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setDayFilterFrom(1); setDayFilterTo(18); }}
                  className={dayFilterFrom === 1 && dayFilterTo === 18 ? "border-blue-500" : ""}
                >
                  1.—18.
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setDayFilterFrom(19); setDayFilterTo(31); }}
                  className={dayFilterFrom === 19 && dayFilterTo === 31 ? "border-blue-500" : ""}
                >
                  19.—31.
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setDayFilterFrom(undefined); setDayFilterTo(undefined); }}
                >
                  Vše
                </Button>
              </div>
            </div>

            {/* Account filter */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Účet:</span>
              </div>
              <Select
                value={accountFilter.toString()}
                onValueChange={(v) => setAccountFilter(v === "all" ? "all" : v === "credit_cards" ? "credit_cards" : parseInt(v))}
              >
                <SelectTrigger className="w-[200px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny účty</SelectItem>
                  <SelectItem value="credit_cards">💎 Pouze kreditní karty</SelectItem>
                  {accounts.map((acc) => {
                    const bank = getBankById(acc.bank_id);
                    return (
                      <SelectItem key={acc.id} value={acc.id.toString()}>
                        {acc.account_type === "credit_card" ? "💎 " : ""}
                        [{bank?.short_name}] {acc.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Sort controls */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Řadit podle:</span>
              <div className="flex gap-1">
                {[
                  { value: "day", label: "📅 Den" },
                  { value: "category", label: "📂 Kategorie" },
                  { value: "account", label: "🏦 Účet" },
                  { value: "amount", label: "💰 Částka" },
                ].map((opt) => (
                  <Button
                    key={opt.value}
                    variant={sortBy === opt.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy(opt.value as SortBy)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection summary */}
      {selectedIds.size > 0 && (
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calculator className="h-5 w-5 text-purple-600" />
                <div>
                  <span className="font-medium text-purple-800">
                    Vybráno {selectedIds.size} položek
                  </span>
                  <span className="mx-2 text-purple-400">•</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {formatCurrency(selectedTotal)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectAll(sortedExpenses.map(e => e.id))}
                >
                  <Check className="mr-1 h-4 w-4" />
                  Vybrat vše ({sortedExpenses.length})
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                >
                  Zrušit výběr
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses list */}
      {groupedExpenses.length > 0 ? (
        <div className="space-y-4">
          {groupedExpenses.map((group) => (
            <Card key={group.key}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{group.label}</CardTitle>
                  <Badge variant="secondary">{formatCurrency(group.total)}/měsíc</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.expenses.map((expense) => {
                    const monthlyAmount = toMonthlyAmount(expense.amount, expense.frequency);
                    const owner =
                      expense.assigned_to !== "shared"
                        ? members?.find((m) => m.id.toString() === expense.assigned_to)
                        : null;
                    const account = expense.account_id ? getAccountById(expense.account_id) : null;
                    const bank = account ? getBankById(account.bank_id) : null;
                    const category = FIXED_EXPENSE_CATEGORIES.find((c) => c.value === expense.category);

                    return (
                      <div
                        key={expense.id}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                          selectedIds.has(expense.id) 
                            ? "bg-purple-100 border border-purple-300" 
                            : "bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedIds.has(expense.id)}
                            onChange={() => toggleSelection(expense.id)}
                            className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                          
                          {/* Day badge */}
                          <div className="flex flex-col items-center min-w-[40px]">
                            <span className="text-xs text-muted-foreground">den</span>
                            <span className="text-lg font-bold text-blue-600">
                              {expense.day_of_month || "—"}
                            </span>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <span>{category?.icon}</span>
                              <p className="font-medium">{expense.name}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {FREQUENCY_LABELS[expense.frequency]}
                              </Badge>
                              {account && (
                                <Badge 
                                  className="text-xs"
                                  style={{ backgroundColor: bank?.color || "#666" }}
                                >
                                  {bank?.short_name || bank?.name} - {account.name}
                                </Badge>
                              )}
                              {owner && (
                                <Badge
                                  className="text-xs"
                                  style={{ backgroundColor: owner.color }}
                                >
                                  {owner.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="font-semibold text-red-600">
                              -{formatCurrency(expense.amount)}
                            </p>
                            {expense.frequency !== "monthly" && (
                              <p className="text-xs text-muted-foreground">
                                ({formatCurrency(monthlyAmount)}/měsíc)
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(expense)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => deleteExpense.mutate(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-lg font-semibold">Přidejte stálé výdaje</h3>
            <p className="text-muted-foreground mt-2 text-center max-w-md">
              Zadejte pravidelné platby jako nájem, energie, pojištění nebo splátky.
            </p>
            <Button onClick={openNewDialog} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Přidat první výdaj
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Expense Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Upravit výdaj" : "Nový stálý výdaj"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Název</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="např. Nájem, Elektřina, Netflix"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Částka</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="100"
                  value={form.amount || ""}
                  onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="15000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dayOfMonth">Den v měsíci</Label>
                <Input
                  id="dayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                  value={form.day_of_month}
                  onChange={(e) =>
                    setForm({ ...form, day_of_month: parseInt(e.target.value) || 1 })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frekvence</Label>
                <Select
                  value={form.frequency}
                  onValueChange={(value) => setForm({ ...form, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Měsíčně</SelectItem>
                    <SelectItem value="quarterly">Čtvrtletně</SelectItem>
                    <SelectItem value="yearly">Ročně</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kategorie</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm({ ...form, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIXED_EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Z účtu (odkud se platí)</Label>
              <Select
                value={form.account_id?.toString() || "none"}
                onValueChange={(value) =>
                  setForm({ ...form, account_id: value === "none" ? undefined : parseInt(value) })
                }
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
                        [{bank?.short_name || bank?.name?.slice(0, 2)}] {acc.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Přiřazeno (kdo platí)</Label>
              <Select
                value={form.assigned_to}
                onValueChange={(value) => setForm({ ...form, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shared">Společné</SelectItem>
                  {(members || []).map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Zrušit
              </Button>
              <Button type="submit" disabled={createExpense.isPending || updateExpense.isPending}>
                {createExpense.isPending || updateExpense.isPending
                  ? "Ukládám..."
                  : editingExpense
                  ? "Uložit změny"
                  : "Přidat výdaj"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
