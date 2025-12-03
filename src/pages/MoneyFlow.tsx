import { useState } from "react";
import { Plus, Trash2, ArrowRight, Calendar, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
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
import { useTransfersTimeline, useCreateTransfer, useDeleteTransfer } from "@/hooks/useTransfers";
import { useBanksWithAccounts } from "@/hooks/useBanksAccounts";
import { formatCurrency } from "@/utils/currency";

export function MoneyFlow() {
  const { timeline, totalAmount, isLoading } = useTransfersTimeline();
  const { accounts, banks } = useBanksWithAccounts();
  const createTransfer = useCreateTransfer();
  const deleteTransfer = useDeleteTransfer();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());

  const [form, setForm] = useState({
    name: "",
    from_account_id: 0,
    to_account_id: 0,
    amount: 0,
    day_of_month: 1,
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTransfer.mutateAsync(form);
    setForm({
      name: "",
      from_account_id: 0,
      to_account_id: 0,
      amount: 0,
      day_of_month: 1,
      description: "",
    });
    setIsDialogOpen(false);
  };

  const toggleDay = (day: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(day)) {
      newExpanded.delete(day);
    } else {
      newExpanded.add(day);
    }
    setExpandedDays(newExpanded);
  };

  const getBankById = (bankId: number | undefined) => banks.find((b) => b.id === bankId);
  const getAccountById = (accountId: number) => accounts.find((a) => a.id === accountId);

  const getAccountDisplay = (accountId: number) => {
    const account = getAccountById(accountId);
    const bank = account ? getBankById(account.bank_id) : undefined;
    return {
      account,
      bank,
      label: account ? `${account.name}` : "Neznámý účet",
      bankLabel: bank?.short_name || bank?.name?.slice(0, 2) || "",
      color: bank?.color || "#666",
    };
  };

  // Calculate premium account status
  const accountsWithInflow = accounts.filter((acc) => {
    if (!acc.is_premium) return false;
    const inflow = timeline
      .flatMap((t) => t.transfers)
      .filter((t) => t.to_account_id === acc.id)
      .reduce((sum, t) => sum + t.amount, 0);
    return inflow > 0 || acc.premium_min_flow;
  });

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
          <h1 className="text-2xl font-bold">Workflow převodů</h1>
          <p className="text-muted-foreground">Naplánujte měsíční tok peněz mezi účty</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} disabled={accounts.length < 2}>
          <Plus className="mr-2 h-4 w-4" />
          Přidat převod
        </Button>
      </div>

      {accounts.length < 2 ? (
        <Card className="border-dashed border-amber-300 bg-amber-50">
          <CardContent className="flex items-center gap-4 py-6">
            <span className="text-4xl">⚠️</span>
            <div>
              <h3 className="font-semibold">Nejprve přidejte účty</h3>
              <p className="text-sm text-muted-foreground">
                Pro vytvoření workflow převodů potřebujete alespoň 2 účty. Přidejte je v sekci
                "Banky & Účty".
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Premium accounts status */}
          {accountsWithInflow.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">⭐ Prémiové účty - stav obratu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {accountsWithInflow.map((acc) => {
                    const bank = getBankById(acc.bank_id);
                    const inflow = timeline
                      .flatMap((t) => t.transfers)
                      .filter((t) => t.to_account_id === acc.id)
                      .reduce((sum, t) => sum + t.amount, 0);
                    const isOk = !acc.premium_min_flow || inflow >= acc.premium_min_flow;

                    return (
                      <div
                        key={acc.id}
                        className={`p-3 rounded-lg border ${
                          isOk ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{acc.name}</p>
                            <p className="text-xs text-muted-foreground">{bank?.name}</p>
                          </div>
                          <Badge variant={isOk ? "default" : "destructive"}>
                            {isOk ? "✓ OK" : "✗ Nesplněno"}
                          </Badge>
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="font-medium">{formatCurrency(inflow)}</span>
                          {acc.premium_min_flow && (
                            <span className="text-muted-foreground">
                              {" "}
                              / {formatCurrency(acc.premium_min_flow)} min.
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {timeline.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Měsíční timeline
                  </CardTitle>
                  <Badge variant="secondary">Celkem: {formatCurrency(totalAmount)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {timeline.map(({ day, transfers: dayTransfers, total }) => {
                  const isExpanded = expandedDays.has(day) || timeline.length <= 5;

                  return (
                    <div key={day} className="border rounded-lg overflow-hidden">
                      {/* Day header */}
                      <button
                        onClick={() => toggleDay(day)}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold">
                            {day}.
                          </div>
                          <div className="text-left">
                            <p className="font-medium">{day}. den v měsíci</p>
                            <p className="text-sm text-muted-foreground">
                              {dayTransfers.length} převod{dayTransfers.length > 1 ? "y" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{formatCurrency(total)}</span>
                          {timeline.length > 5 &&
                            (isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ))}
                        </div>
                      </button>

                      {/* Transfers */}
                      {isExpanded && (
                        <div className="p-4 space-y-3 border-t">
                          {dayTransfers.map((transfer) => {
                            const from = getAccountDisplay(transfer.from_account_id);
                            const to = getAccountDisplay(transfer.to_account_id);

                            return (
                              <div
                                key={transfer.id}
                                className="flex items-center gap-3 p-3 bg-white border rounded-lg"
                              >
                                {/* From Account */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="px-2 py-0.5 rounded text-xs font-bold text-white"
                                      style={{ backgroundColor: from.color }}
                                    >
                                      {from.bankLabel}
                                    </div>
                                    <span className="font-medium truncate">{from.label}</span>
                                  </div>
                                  {from.account?.account_number && (
                                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                      {from.account.account_number}
                                    </p>
                                  )}
                                </div>

                                {/* Arrow & Amount */}
                                <div className="flex flex-col items-center px-4">
                                  <span className="font-bold text-lg">
                                    {formatCurrency(transfer.amount)}
                                  </span>
                                  <ArrowRight className="h-5 w-5 text-blue-500" />
                                </div>

                                {/* To Account */}
                                <div className="flex-1 min-w-0 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="font-medium truncate">{to.label}</span>
                                    <div
                                      className="px-2 py-0.5 rounded text-xs font-bold text-white"
                                      style={{ backgroundColor: to.color }}
                                    >
                                      {to.bankLabel}
                                    </div>
                                  </div>
                                  {to.account?.account_number && (
                                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                      {to.account.account_number}
                                    </p>
                                  )}
                                </div>

                                {/* Actions */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-600 ml-2"
                                  onClick={() => deleteTransfer.mutate(transfer.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-4">🔄</div>
                <h3 className="text-lg font-semibold">Nastavte workflow převodů</h3>
                <p className="text-muted-foreground mt-2 text-center max-w-md">
                  Přidejte naplánované převody mezi účty. Uvidíte kdy a kolik peněz kam posíláte.
                </p>
                <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Přidat první převod
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add Transfer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nový naplánovaný převod</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transferName">Název převodu</Label>
              <Input
                id="transferName"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="např. Převod na hypotéku, Na spoření"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Z účtu</Label>
                <Select
                  value={form.from_account_id.toString()}
                  onValueChange={(value) =>
                    setForm({ ...form, from_account_id: parseInt(value) })
                  }
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
                <Label>Na účet</Label>
                <Select
                  value={form.to_account_id.toString()}
                  onValueChange={(value) => setForm({ ...form, to_account_id: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte účet" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter((a) => a.id !== form.from_account_id)
                      .map((acc) => {
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
                  placeholder="10000"
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

            <div className="space-y-2">
              <Label htmlFor="description">Poznámka (volitelné)</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="např. Pro splnění podmínek prémia"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Zrušit
              </Button>
              <Button
                type="submit"
                disabled={
                  !form.from_account_id || !form.to_account_id || form.amount <= 0 || createTransfer.isPending
                }
              >
                {createTransfer.isPending ? "Ukládám..." : "Přidat převod"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
