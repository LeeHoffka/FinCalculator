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
  useBudgetCategories,
  useCreateBudgetCategory,
  useDeleteBudgetCategory,
  useBudgetSummary,
  BUDGET_CATEGORY_TYPES,
} from "@/hooks/useBudget";
import { useMembers } from "@/hooks/useHousehold";
import { formatCurrency } from "@/utils/currency";

export function Budgets() {
  const { budgets, totalBudgets, isLoading } = useBudgetSummary();
  const { data: members } = useMembers();
  const createBudget = useCreateBudgetCategory();
  const deleteBudget = useDeleteBudgetCategory();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    budget_type: "food",
    monthly_limit: 0,
    color: "#F97316",
    icon: "🛒",
    assigned_to: "shared",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBudget.mutateAsync(form);
    setForm({
      name: "",
      budget_type: "food",
      monthly_limit: 0,
      color: "#F97316",
      icon: "🛒",
      assigned_to: "shared",
    });
    setIsDialogOpen(false);
  };

  const handleTypeChange = (value: string) => {
    const typeInfo = BUDGET_CATEGORY_TYPES.find((t) => t.value === value);
    setForm({
      ...form,
      budget_type: value,
      color: typeInfo?.color || "#6B7280",
      icon: typeInfo?.icon || "📦",
      name: form.name || typeInfo?.label || "",
    });
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
          <h1 className="text-2xl font-bold">Rozpočty</h1>
          <p className="text-muted-foreground">Plánujte výdaje na jídlo, zábavu a další</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Přidat rozpočet
        </Button>
      </div>

      {/* Total Card */}
      <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
        <CardHeader>
          <CardTitle className="text-lg font-medium opacity-90">
            Celkové měsíční rozpočty
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{formatCurrency(totalBudgets)}</p>
          <p className="mt-2 text-sm opacity-80">{budgets.length} kategorií</p>
        </CardContent>
      </Card>

      {/* Budget Cards */}
      {budgets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const typeInfo = BUDGET_CATEGORY_TYPES.find((t) => t.value === budget.budget_type);
            const owner =
              budget.assigned_to !== "shared"
                ? members?.find((m) => m.id.toString() === budget.assigned_to)
                : null;

            return (
              <Card key={budget.id} className="overflow-hidden">
                <div className="h-2" style={{ backgroundColor: budget.color }} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-2xl">{budget.icon || typeInfo?.icon}</span>
                      {budget.name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => deleteBudget.mutate(budget.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold" style={{ color: budget.color }}>
                    {formatCurrency(budget.monthly_limit)}
                    <span className="text-sm font-normal text-muted-foreground ml-1">/měsíc</span>
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {typeInfo?.label || budget.budget_type}
                    </Badge>
                    {owner && (
                      <Badge className="text-xs" style={{ backgroundColor: owner.color }}>
                        {owner.name}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold">Nastavte rozpočty</h3>
            <p className="text-muted-foreground mt-2 text-center max-w-md">
              Rozdělte zbývající peníze do kategorií jako jídlo, zábava nebo úspory.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Přidat první rozpočet
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Budget Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nový rozpočet</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Typ rozpočtu</Label>
              <Select value={form.budget_type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_CATEGORY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Název</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="např. Jídlo a potraviny"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyLimit">Měsíční limit</Label>
                <Input
                  id="monthlyLimit"
                  type="number"
                  min="0"
                  step="100"
                  value={form.monthly_limit || ""}
                  onChange={(e) =>
                    setForm({ ...form, monthly_limit: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="8000"
                  required
                />
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

            <div className="space-y-2">
              <Label>Barva</Label>
              <div className="flex gap-2 flex-wrap">
                {BUDGET_CATEGORY_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: type.color,
                      borderColor: form.color === type.color ? "#1f2937" : "transparent",
                    }}
                    onClick={() => setForm({ ...form, color: type.color })}
                  />
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Zrušit
              </Button>
              <Button type="submit" disabled={createBudget.isPending}>
                {createBudget.isPending ? "Ukládám..." : "Přidat rozpočet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
