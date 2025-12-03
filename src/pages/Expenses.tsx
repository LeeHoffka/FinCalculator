import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
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
  useDeleteExpense,
  useBudgetSummary,
  FIXED_EXPENSE_CATEGORIES,
} from "@/hooks/useBudget";
import { useMembers } from "@/hooks/useHousehold";
import { formatCurrency } from "@/utils/currency";

const FREQUENCY_LABELS: Record<string, string> = {
  monthly: "Měsíčně",
  quarterly: "Čtvrtletně",
  yearly: "Ročně",
};

export function Expenses() {
  const { expenses, totalFixedExpenses, expensesByCategory, isLoading, toMonthlyAmount } =
    useBudgetSummary();
  const { data: members } = useMembers();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    amount: 0,
    category: "other",
    frequency: "monthly",
    day_of_month: undefined as number | undefined,
    assigned_to: "shared",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createExpense.mutateAsync(form);
    setForm({
      name: "",
      amount: 0,
      category: "other",
      frequency: "monthly",
      day_of_month: undefined,
      assigned_to: "shared",
      notes: "",
    });
    setIsDialogOpen(false);
  };

  // Group expenses by category
  const groupedExpenses = FIXED_EXPENSE_CATEGORIES.map((cat) => ({
    ...cat,
    expenses: expenses.filter((e) => e.category === cat.value),
    total: expensesByCategory[cat.value] || 0,
  })).filter((g) => g.expenses.length > 0);

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
        <Button onClick={() => setIsDialogOpen(true)}>
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

      {/* Expenses by category */}
      {groupedExpenses.length > 0 ? (
        <div className="space-y-4">
          {groupedExpenses.map((group) => (
            <Card key={group.value}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-xl">{group.icon}</span>
                    {group.label}
                  </CardTitle>
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

                    return (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{expense.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {FREQUENCY_LABELS[expense.frequency]}
                            </Badge>
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
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold text-red-600">
                              {formatCurrency(expense.amount)}
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
            <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Přidat první výdaj
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Expense Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nový stálý výdaj</DialogTitle>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label>Přiřazeno</Label>
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
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Zrušit
              </Button>
              <Button type="submit" disabled={createExpense.isPending}>
                {createExpense.isPending ? "Ukládám..." : "Přidat výdaj"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
