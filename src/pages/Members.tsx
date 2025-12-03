import { useState, useEffect } from "react";
import { Plus, Trash2, Banknote, Calendar, Building2, Loader2, Pencil } from "lucide-react";
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
  useMembers,
  useCreateMember,
  useUpdateMember,
  useDeleteMember,
  useCreateIncome,
  useUpdateIncome,
  useDeleteIncome,
} from "@/hooks/useHousehold";
import { useBanksWithAccounts } from "@/hooks/useBanksAccounts";
import { householdApi, type MemberIncome } from "@/lib/tauri";
import { formatCurrency } from "@/utils/currency";

const FREQUENCY_LABELS: Record<string, string> = {
  monthly: "Měsíčně",
  weekly: "Týdně",
  biweekly: "Každé 2 týdny",
  yearly: "Ročně",
};

// Helper to convert frequency to monthly
const toMonthlyAmount = (amount: number, frequency: string): number => {
  switch (frequency) {
    case "weekly":
      return amount * 4.33;
    case "biweekly":
      return amount * 2.17;
    case "monthly":
      return amount;
    case "quarterly":
      return amount / 3;
    case "yearly":
      return amount / 12;
    default:
      return amount;
  }
};

export function Members() {
  const { data: members, isLoading } = useMembers();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();
  const createIncome = useCreateIncome();
  const updateIncome = useUpdateIncome();
  const deleteIncome = useDeleteIncome();
  const { accounts, banks } = useBanksWithAccounts();

  // Store incomes per member
  const [memberIncomes, setMemberIncomes] = useState<Record<number, MemberIncome[]>>({});

  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [editingMember, setEditingMember] = useState<{ id: number; name: string; color: string; avatar?: string } | null>(null);
  const [editingIncome, setEditingIncome] = useState<MemberIncome | null>(null);

  const [memberForm, setMemberForm] = useState({ name: "", color: "#3B82F6", avatar: "" });
  const [incomeForm, setIncomeForm] = useState({
    name: "",
    amount: 0,
    frequency: "monthly",
    day_of_month: undefined as number | undefined,
    account_id: undefined as number | undefined,
  });

  // Fetch incomes for all members
  useEffect(() => {
    if (members) {
      members.forEach(async (member) => {
        try {
          const incomes = await householdApi.getIncomes(member.id);
          setMemberIncomes((prev) => ({ ...prev, [member.id]: incomes }));
        } catch (e) {
          console.error("Failed to fetch incomes for member", member.id, e);
        }
      });
    }
  }, [members]);

  const getMemberMonthlyIncome = (memberId: number) => {
    const incomes = memberIncomes[memberId] || [];
    return incomes
      .filter((i) => i.is_active)
      .reduce((sum, i) => sum + toMonthlyAmount(i.amount, i.frequency), 0);
  };

  const totalHouseholdIncome = (members || []).reduce(
    (sum, m) => sum + getMemberMonthlyIncome(m.id),
    0
  );

  const openMemberDialog = (member?: { id: number; name: string; color: string; avatar?: string }) => {
    if (member) {
      setEditingMember(member);
      setMemberForm({ name: member.name, color: member.color, avatar: member.avatar || "" });
    } else {
      setEditingMember(null);
      setMemberForm({ name: "", color: "#3B82F6", avatar: "" });
    }
    setIsMemberDialogOpen(true);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      await updateMember.mutateAsync({ id: editingMember.id, input: memberForm });
    } else {
      await createMember.mutateAsync(memberForm);
    }
    setMemberForm({ name: "", color: "#3B82F6", avatar: "" });
    setEditingMember(null);
    setIsMemberDialogOpen(false);
  };

  const openIncomeDialog = (memberId: number, income?: MemberIncome) => {
    setSelectedMemberId(memberId);
    if (income) {
      setEditingIncome(income);
      setIncomeForm({
        name: income.name,
        amount: income.amount,
        frequency: income.frequency,
        day_of_month: income.day_of_month,
        account_id: income.account_id,
      });
    } else {
      setEditingIncome(null);
      setIncomeForm({
        name: "",
        amount: 0,
        frequency: "monthly",
        day_of_month: undefined,
        account_id: undefined,
      });
    }
    setIsIncomeDialogOpen(true);
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMemberId) {
      if (editingIncome) {
        await updateIncome.mutateAsync({ id: editingIncome.id, input: incomeForm });
      } else {
        await createIncome.mutateAsync({
          member_id: selectedMemberId,
          ...incomeForm,
        });
      }
      // Refresh incomes
      const incomes = await householdApi.getIncomes(selectedMemberId);
      setMemberIncomes((prev) => ({ ...prev, [selectedMemberId]: incomes }));

      setIncomeForm({
        name: "",
        amount: 0,
        frequency: "monthly",
        day_of_month: undefined,
        account_id: undefined,
      });
      setEditingIncome(null);
      setIsIncomeDialogOpen(false);
    }
  };

  const handleDeleteIncome = async (memberId: number, incomeId: number) => {
    await deleteIncome.mutateAsync(incomeId);
    // Refresh incomes
    const incomes = await householdApi.getIncomes(memberId);
    setMemberIncomes((prev) => ({ ...prev, [memberId]: incomes }));
  };

  const getBankById = (bankId: number) => banks.find((b) => b.id === bankId);
  const getAccountById = (accountId: number) => accounts.find((a) => a.id === accountId);

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
          <h1 className="text-2xl font-bold">Členové domácnosti</h1>
          <p className="text-muted-foreground">
            Přidejte členy a jejich příjmy pro výpočet rozpočtu
          </p>
        </div>
        <Button onClick={() => openMemberDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Přidat člena
        </Button>
      </div>

      {/* Total Income Card */}
      <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <CardHeader>
          <CardTitle className="text-lg font-medium opacity-90">
            Celkový měsíční příjem domácnosti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{formatCurrency(totalHouseholdIncome)}</p>
          <p className="mt-2 text-sm opacity-80">
            {(members || []).length}{" "}
            {(members || []).length === 1 ? "člen" : (members || []).length < 5 ? "členové" : "členů"}
          </p>
        </CardContent>
      </Card>

      {/* Members Grid */}
      {(members || []).length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {(members || []).map((member) => {
            const monthlyIncome = getMemberMonthlyIncome(member.id);
            const incomes = memberIncomes[member.id] || [];
            const incomePercentage =
              totalHouseholdIncome > 0 ? (monthlyIncome / totalHouseholdIncome) * 100 : 0;

            return (
              <Card key={member.id} className="overflow-hidden">
                <div className="h-2" style={{ backgroundColor: member.color }} />
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full text-white text-xl font-bold"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.avatar || member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{member.name}</h3>
                      <p className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(monthlyIncome)}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          /měsíc
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openMemberDialog({ id: member.id, name: member.name, color: member.color, avatar: member.avatar })}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deleteMember.mutate(member.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Income percentage bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Podíl na příjmech</span>
                      <span className="font-medium">{incomePercentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${incomePercentage}%`,
                          backgroundColor: member.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Incomes list */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-muted-foreground">Příjmy</h4>
                      <Button variant="ghost" size="sm" onClick={() => openIncomeDialog(member.id)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Přidat příjem
                      </Button>
                    </div>

                    {incomes.length > 0 ? (
                      <div className="space-y-2">
                        {incomes.map((income) => {
                          const incomeAccount = income.account_id
                            ? getAccountById(income.account_id)
                            : undefined;
                          const incomeBank = incomeAccount
                            ? getBankById(incomeAccount.bank_id!)
                            : undefined;

                          return (
                            <div
                              key={income.id}
                              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Banknote className="h-5 w-5 text-emerald-600" />
                                <div>
                                  <p className="font-medium">{income.name}</p>
                                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                    <Badge variant="secondary" className="text-xs">
                                      {FREQUENCY_LABELS[income.frequency]}
                                    </Badge>
                                    {income.day_of_month && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {income.day_of_month}. den
                                      </span>
                                    )}
                                    {incomeBank && incomeAccount && (
                                      <span className="flex items-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        <span
                                          className="px-1.5 py-0.5 rounded text-xs font-semibold text-white"
                                          style={{ backgroundColor: incomeBank.color }}
                                        >
                                          {incomeBank.short_name || incomeBank.name.slice(0, 2)}
                                        </span>
                                        {incomeAccount.name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-emerald-600">
                                  {formatCurrency(income.amount)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => openIncomeDialog(member.id, income)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                  onClick={() => handleDeleteIncome(member.id, income.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4 bg-slate-50 rounded-lg">
                        Zatím žádné příjmy
                      </p>
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
            <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 className="text-lg font-semibold">Začněte přidáním členů domácnosti</h3>
            <p className="text-muted-foreground mt-2 text-center max-w-md">
              Přidejte sebe, partnera nebo další členy domácnosti a zadejte jejich příjmy pro
              výpočet rodinného rozpočtu.
            </p>
            <Button onClick={() => openMemberDialog()} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Přidat prvního člena
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Member Dialog */}
      <Dialog open={isMemberDialogOpen} onOpenChange={(open) => {
        setIsMemberDialogOpen(open);
        if (!open) {
          setEditingMember(null);
          setMemberForm({ name: "", color: "#3B82F6", avatar: "" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMember ? "Upravit člena" : "Nový člen domácnosti"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Jméno</Label>
              <Input
                id="name"
                value={memberForm.name}
                onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                placeholder="např. Jan"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Barva</Label>
              <div className="flex gap-2 flex-wrap">
                {[
                  "#3B82F6",
                  "#10B981",
                  "#F59E0B",
                  "#EF4444",
                  "#8B5CF6",
                  "#EC4899",
                  "#06B6D4",
                  "#84CC16",
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="h-10 w-10 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: memberForm.color === color ? "#1f2937" : "transparent",
                    }}
                    onClick={() => setMemberForm({ ...memberForm, color })}
                  />
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsMemberDialogOpen(false);
                  setEditingMember(null);
                  setMemberForm({ name: "", color: "#3B82F6", avatar: "" });
                }}
              >
                Zrušit
              </Button>
              <Button type="submit" disabled={createMember.isPending || updateMember.isPending}>
                {createMember.isPending || updateMember.isPending
                  ? "Ukládám..."
                  : editingMember
                  ? "Uložit změny"
                  : "Přidat"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Income Dialog */}
      <Dialog open={isIncomeDialogOpen} onOpenChange={(open) => {
        setIsIncomeDialogOpen(open);
        if (!open) {
          setEditingIncome(null);
          setIncomeForm({
            name: "",
            amount: 0,
            frequency: "monthly",
            day_of_month: undefined,
            account_id: undefined,
          });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIncome ? "Upravit příjem" : "Přidat příjem"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddIncome} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="incomeName">Název příjmu</Label>
              <Input
                id="incomeName"
                value={incomeForm.name}
                onChange={(e) => setIncomeForm({ ...incomeForm, name: e.target.value })}
                placeholder="např. Výplata, Brigáda, Důchod"
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
                  value={incomeForm.amount || ""}
                  onChange={(e) =>
                    setIncomeForm({ ...incomeForm, amount: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="35000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Frekvence</Label>
                <Select
                  value={incomeForm.frequency}
                  onValueChange={(value) => setIncomeForm({ ...incomeForm, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Měsíčně</SelectItem>
                    <SelectItem value="biweekly">Každé 2 týdny</SelectItem>
                    <SelectItem value="weekly">Týdně</SelectItem>
                    <SelectItem value="yearly">Ročně</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dayOfMonth">Den příchodu</Label>
                <Input
                  id="dayOfMonth"
                  type="number"
                  min="1"
                  max="31"
                  value={incomeForm.day_of_month || ""}
                  onChange={(e) =>
                    setIncomeForm({
                      ...incomeForm,
                      day_of_month: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder="např. 15"
                />
              </div>

              <div className="space-y-2">
                <Label>Cílový účet</Label>
                <Select
                  value={incomeForm.account_id?.toString() || "none"}
                  onValueChange={(value) =>
                    setIncomeForm({
                      ...incomeForm,
                      account_id: value === "none" ? undefined : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte účet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Neurčeno</SelectItem>
                    {accounts.map((acc) => {
                      const bank = getBankById(acc.bank_id!);
                      return (
                        <SelectItem key={acc.id} value={acc.id.toString()}>
                          [{bank?.short_name || bank?.name.slice(0, 2)}] {acc.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsIncomeDialogOpen(false);
                  setEditingIncome(null);
                  setIncomeForm({
                    name: "",
                    amount: 0,
                    frequency: "monthly",
                    day_of_month: undefined,
                    account_id: undefined,
                  });
                }}
              >
                Zrušit
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={createIncome.isPending || updateIncome.isPending}
              >
                {createIncome.isPending || updateIncome.isPending
                  ? "Ukládám..."
                  : editingIncome
                  ? "Uložit změny"
                  : "Přidat příjem"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
