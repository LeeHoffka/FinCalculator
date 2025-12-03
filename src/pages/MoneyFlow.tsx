import { useState } from "react";
import { Plus, Trash2, ArrowRight, Calendar, ChevronDown, ChevronUp, Loader2, AlertTriangle, TrendingUp, TrendingDown, Pencil } from "lucide-react";
import type { ScheduledTransfer } from "@/lib/tauri";
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
import { useTransfersTimeline, useCreateTransfer, useUpdateTransfer, useDeleteTransfer, useCashFlowAnalysis } from "@/hooks/useTransfers";
import { useBanksWithAccounts } from "@/hooks/useBanksAccounts";
import { formatCurrency } from "@/utils/currency";

// Kategorie převodů
export const TRANSFER_CATEGORIES = [
  { value: "technical", label: "Technický převod", icon: "🔄", description: "Prémiové podmínky, mezi partnery" },
  { value: "mortgage", label: "Hypotéka/Splátka", icon: "🏠", description: "Splátky úvěrů a hypoték" },
  { value: "savings", label: "Spoření", icon: "💰", description: "Odkládání na spořicí účet" },
  { value: "budget", label: "Budget alokace", icon: "🍽️", description: "Jídlo, zábava, transport..." },
  { value: "credit_card", label: "Splátka kreditky", icon: "💎", description: "Úhrada kreditní karty" },
];

const emptyTransferForm = {
  name: "",
  from_account_id: 0,
  to_account_id: 0,
  amount: 0,
  day_of_month: 1,
  description: "",
  category: "technical",
};

export function MoneyFlow() {
  const { timeline, totalAmount, isLoading: timelineLoading } = useTransfersTimeline();
  const { accounts, banks } = useBanksWithAccounts();
  const { premiumStatus, accountCashFlows, isLoading: cashFlowLoading } = useCashFlowAnalysis();
  const createTransfer = useCreateTransfer();
  const updateTransfer = useUpdateTransfer();
  const deleteTransfer = useDeleteTransfer();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<ScheduledTransfer | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [showCashFlow, setShowCashFlow] = useState(false);

  const [form, setForm] = useState(emptyTransferForm);

  const openNewDialog = () => {
    setEditingTransfer(null);
    setForm(emptyTransferForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (transfer: ScheduledTransfer) => {
    setEditingTransfer(transfer);
    setForm({
      name: transfer.name,
      from_account_id: transfer.from_account_id,
      to_account_id: transfer.to_account_id,
      amount: transfer.amount,
      day_of_month: transfer.day_of_month,
      description: transfer.description || "",
      category: transfer.category || "technical",
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTransfer(null);
    setForm(emptyTransferForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTransfer) {
        await updateTransfer.mutateAsync({ id: editingTransfer.id, input: form });
      } else {
        await createTransfer.mutateAsync(form);
      }
      setForm(emptyTransferForm);
      setEditingTransfer(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to save transfer:", error);
      alert("Chyba při ukládání převodu: " + (error as Error).message);
    }
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

  // Find accounts with problems
  const problemAccounts = Array.from(accountCashFlows.values()).filter(
    (flow) => flow.hasNegativeBalance
  );

  const isLoading = timelineLoading || cashFlowLoading;

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
        <Button onClick={openNewDialog} disabled={accounts.length < 2}>
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
          {/* Problem accounts warning */}
          {problemAccounts.length > 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Varování: Záporné zůstatky!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {problemAccounts.map((flow) => {
                    const account = getAccountById(flow.accountId);
                    const bank = account ? getBankById(account.bank_id) : undefined;
                    return (
                      <div key={flow.accountId} className="flex items-center justify-between p-2 bg-white rounded border border-red-200">
                        <div className="flex items-center gap-2">
                          <div
                            className="px-2 py-0.5 rounded text-xs font-bold text-white"
                            style={{ backgroundColor: bank?.color || "#666" }}
                          >
                            {bank?.short_name || bank?.name?.slice(0, 2)}
                          </div>
                          <span className="font-medium">{account?.name}</span>
                        </div>
                        <span className="text-red-600 font-bold">
                          Min. zůstatek: {formatCurrency(flow.minBalance)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-red-600 mt-3">
                  Tyto účty budou během měsíce v mínusu. Upravte částky převodů nebo jejich načasování.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Premium accounts status */}
          {premiumStatus.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">⭐ Prémiové účty - stav obratu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {premiumStatus.map(({ account, inflow, minRequired, isOk, hasNegativeBalance }) => {
                    const bank = getBankById(account.bank_id);

                    return (
                      <div
                        key={account.id}
                        className={`p-3 rounded-lg border ${
                          hasNegativeBalance
                            ? "bg-red-50 border-red-200"
                            : isOk
                            ? "bg-green-50 border-green-200"
                            : "bg-amber-50 border-amber-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{account.name}</p>
                            <p className="text-xs text-muted-foreground">{bank?.name}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant={isOk ? "default" : "destructive"}>
                              {isOk ? "✓ Splněno" : "✗ Nesplněno"}
                            </Badge>
                            {hasNegativeBalance && (
                              <Badge variant="destructive" className="text-xs">
                                ⚠️ Záporný zůstatek
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-sm">
                          <span className={`font-medium ${inflow >= minRequired ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(inflow)}
                          </span>
                          {minRequired > 0 && (
                            <span className="text-muted-foreground">
                              {" "}
                              / {formatCurrency(minRequired)} min.
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

          {/* Cash Flow Analysis Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={showCashFlow ? "default" : "outline"}
              onClick={() => setShowCashFlow(!showCashFlow)}
            >
              {showCashFlow ? "Skrýt" : "Zobrazit"} cash flow analýzu
            </Button>
          </div>

          {/* Cash Flow Analysis */}
          {showCashFlow && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 Cash Flow Analýza
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accounts.map((account) => {
                    const flow = accountCashFlows.get(account.id);
                    const bank = getBankById(account.bank_id);
                    if (!flow || flow.events.length === 0) return null;

                    return (
                      <div key={account.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="px-2 py-0.5 rounded text-xs font-bold text-white"
                              style={{ backgroundColor: bank?.color || "#666" }}
                            >
                              {bank?.short_name || bank?.name?.slice(0, 2)}
                            </div>
                            <span className="font-semibold">{account.name}</span>
                            {account.is_premium && (
                              <Badge variant="secondary">⭐ Prémium</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              Počátek: <strong>{formatCurrency(flow.initialBalance)}</strong>
                            </span>
                            <span className="text-green-600 flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              +{formatCurrency(flow.totalInflow)}
                            </span>
                            <span className="text-red-600 flex items-center gap-1">
                              <TrendingDown className="h-4 w-4" />
                              -{formatCurrency(flow.totalOutflow)}
                            </span>
                            <span className={`font-bold ${flow.endOfMonthBalance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                              Konec: {formatCurrency(flow.endOfMonthBalance)}
                            </span>
                          </div>
                        </div>

                        {/* Events table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-2">Den</th>
                                <th className="text-left py-2 px-2">Popis</th>
                                <th className="text-right py-2 px-2">Částka</th>
                                <th className="text-right py-2 px-2">Zůstatek</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* Initial balance row */}
                              <tr className="border-b bg-blue-50">
                                <td className="py-2 px-2 font-mono">0.</td>
                                <td className="py-2 px-2">
                                  🏦 Počáteční zůstatek
                                </td>
                                <td className="py-2 px-2 text-right font-mono text-muted-foreground">
                                  —
                                </td>
                                <td className="py-2 px-2 text-right font-mono font-bold text-blue-600">
                                  {formatCurrency(flow.initialBalance)}
                                </td>
                              </tr>
                              {(() => {
                                let balance = flow.initialBalance;
                                return flow.events.map((event, idx) => {
                                  balance += event.amount;
                                  const isNegative = balance < 0;
                                  return (
                                    <tr key={idx} className={`border-b ${isNegative ? "bg-red-50" : ""}`}>
                                      <td className="py-2 px-2 font-mono">{event.day}.</td>
                                      <td className="py-2 px-2">
                                        {event.type === "income" && "💰 "}
                                        {event.type === "transfer_in" && "⬇️ "}
                                        {event.type === "transfer_out" && "⬆️ "}
                                        {event.type === "expense" && "🏠 "}
                                        {event.description}
                                      </td>
                                      <td className={`py-2 px-2 text-right font-mono ${event.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                                        {event.amount >= 0 ? "+" : ""}{formatCurrency(event.amount)}
                                      </td>
                                      <td className={`py-2 px-2 text-right font-mono font-bold ${isNegative ? "text-red-600" : ""}`}>
                                        {formatCurrency(balance)}
                                        {isNegative && " ⚠️"}
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                              {/* End of month summary */}
                              <tr className="bg-slate-100 font-semibold">
                                <td className="py-2 px-2 font-mono">31.</td>
                                <td className="py-2 px-2">
                                  📊 Konec měsíce (před dalším příjmem)
                                </td>
                                <td className="py-2 px-2 text-right font-mono">
                                  —
                                </td>
                                <td className={`py-2 px-2 text-right font-mono font-bold ${flow.endOfMonthBalance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                                  {formatCurrency(flow.endOfMonthBalance)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {flow.hasNegativeBalance && (
                          <div className="mt-3 p-2 bg-red-100 rounded text-red-700 text-sm flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Tento účet bude během měsíce v mínusu! Minimální zůstatek: {formatCurrency(flow.minBalance)}
                          </div>
                        )}
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
                  <Badge variant="secondary">Celkem převodů: {formatCurrency(totalAmount)}</Badge>
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
                                  {transfer.category && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {TRANSFER_CATEGORIES.find(c => c.value === transfer.category)?.icon}{" "}
                                      {TRANSFER_CATEGORIES.find(c => c.value === transfer.category)?.label}
                                    </Badge>
                                  )}
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
                                <div className="flex items-center gap-1 ml-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditDialog(transfer)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600"
                                    onClick={() => deleteTransfer.mutate(transfer.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
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
                <Button onClick={openNewDialog} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Přidat první převod
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add/Edit Transfer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTransfer ? "Upravit převod" : "Nový naplánovaný převod"}</DialogTitle>
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
              <Label>Kategorie převodu</Label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSFER_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {TRANSFER_CATEGORIES.find(c => c.value === form.category)?.description}
              </p>
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
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Zrušit
              </Button>
              <Button
                type="submit"
                disabled={
                  !form.from_account_id || !form.to_account_id || form.amount <= 0 || createTransfer.isPending || updateTransfer.isPending
                }
              >
                {createTransfer.isPending || updateTransfer.isPending
                  ? "Ukládám..."
                  : editingTransfer
                  ? "Uložit změny"
                  : "Přidat převod"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
