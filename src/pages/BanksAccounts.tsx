import { useState } from "react";
import { Plus, Trash2, Building2, Loader2, Pencil } from "lucide-react";
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
  useBanksWithAccounts,
  useCreateBank,
  useDeleteBank,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from "@/hooks/useBanksAccounts";
import { useMembers } from "@/hooks/useHousehold";
import { formatCurrency } from "@/utils/currency";
import type { BankAccount } from "@/lib/tauri";

const COMMON_BANKS = [
  { name: "Česká spořitelna", shortName: "ČS", color: "#0066b3" },
  { name: "Komerční banka", shortName: "KB", color: "#cc0000" },
  { name: "ČSOB", shortName: "ČSOB", color: "#003366" },
  { name: "Raiffeisenbank", shortName: "RB", color: "#ffcc00" },
  { name: "mBank", shortName: "mBank", color: "#009ee0" },
  { name: "Fio banka", shortName: "Fio", color: "#2fa13e" },
  { name: "Air Bank", shortName: "Air", color: "#6dc067" },
  { name: "Moneta", shortName: "Moneta", color: "#0072bc" },
];

const ACCOUNT_TYPES = [
  { value: "checking", label: "Běžný účet", icon: "💳" },
  { value: "savings", label: "Spořicí účet", icon: "🏦" },
  { value: "mortgage", label: "Hypoteční účet", icon: "🏠" },
  { value: "premium", label: "Prémiový účet", icon: "⭐" },
  { value: "credit_card", label: "Kreditní karta", icon: "💎" },
];

export function BanksAccounts() {
  const { banksWithAccounts, banks, accounts, isLoading } = useBanksWithAccounts();
  const { data: members } = useMembers();
  
  // Debug logging
  console.log("[BanksAccounts] isLoading:", isLoading, "banks:", banks?.length, "accounts:", accounts?.length, "banksWithAccounts:", banksWithAccounts?.length);
  const createBank = useCreateBank();
  const deleteBank = useDeleteBank();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  const [bankForm, setBankForm] = useState({
    name: "",
    short_name: "",
    color: "#0066b3",
    notes: "",
  });

  const [accountForm, setAccountForm] = useState({
    name: "",
    account_type: "checking",
    account_number: "",
    owner_user_id: undefined as number | undefined,
    initial_balance: 0,
    is_premium: false,
    premium_min_flow: undefined as number | undefined,
    credit_limit: undefined as number | undefined,
  });

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBank.mutateAsync(bankForm);
      setBankForm({ name: "", short_name: "", color: "#0066b3", notes: "" });
      setIsBankDialogOpen(false);
    } catch (error) {
      console.error("Failed to create bank:", error);
      alert("Chyba při vytváření banky: " + (error as Error).message);
    }
  };

  const handleSelectCommonBank = (bank: (typeof COMMON_BANKS)[0]) => {
    setBankForm({
      name: bank.name,
      short_name: bank.shortName,
      color: bank.color,
      notes: "",
    });
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        // Update existing account
        await updateAccount.mutateAsync({
          id: editingAccount.id,
          input: {
            name: accountForm.name,
            account_type: accountForm.account_type,
            bank_id: editingAccount.bank_id,
            owner_user_id: accountForm.owner_user_id,
            account_number: accountForm.account_number,
            currency: "CZK",
            is_premium: accountForm.is_premium,
            premium_min_flow: accountForm.premium_min_flow,
            credit_limit: accountForm.credit_limit,
            current_balance: accountForm.initial_balance,
            active: true,
          },
        });
      } else if (selectedBankId) {
        // Create new account
        const newAccountData = {
          ...accountForm,
          bank_id: selectedBankId,
          currency: "CZK",
        };
        console.log("[BanksAccounts] Creating account:", newAccountData);
        await createAccount.mutateAsync(newAccountData);
        console.log("[BanksAccounts] Account created successfully");
      }
      resetAccountForm();
      setIsAccountDialogOpen(false);
    } catch (error) {
      console.error("Failed to save account:", error);
      alert("Chyba při ukládání účtu: " + (error as Error).message);
    }
  };

  const resetAccountForm = () => {
    setAccountForm({
      name: "",
      account_type: "checking",
      account_number: "",
      owner_user_id: undefined,
      initial_balance: 0,
      is_premium: false,
      premium_min_flow: undefined,
      credit_limit: undefined,
    });
    setEditingAccount(null);
    setSelectedBankId(null);
  };

  const openAccountDialog = (bankId: number) => {
    setEditingAccount(null);
    // Reset form first, then set bankId (resetAccountForm sets selectedBankId to null)
    setAccountForm({
      name: "",
      account_type: "checking",
      account_number: "",
      owner_user_id: undefined,
      initial_balance: 0,
      is_premium: false,
      premium_min_flow: undefined,
      credit_limit: undefined,
    });
    setSelectedBankId(bankId);
    setIsAccountDialogOpen(true);
  };

  const openEditAccountDialog = (account: BankAccount) => {
    setEditingAccount(account);
    setSelectedBankId(account.bank_id);
    setAccountForm({
      name: account.name,
      account_type: account.account_type,
      account_number: account.account_number || "",
      owner_user_id: account.owner_user_id,
      initial_balance: account.current_balance || 0,
      is_premium: account.is_premium || false,
      premium_min_flow: account.premium_min_flow,
      credit_limit: account.credit_limit,
    });
    setIsAccountDialogOpen(true);
  };

  const handleCloseAccountDialog = () => {
    setIsAccountDialogOpen(false);
    resetAccountForm();
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
          <h1 className="text-2xl font-bold">Banky & Účty</h1>
          <p className="text-muted-foreground">
            Nastavte své banky a účty pro workflow převodů
          </p>
        </div>
        <Button onClick={() => setIsBankDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Přidat banku
        </Button>
      </div>

      {/* Banks Grid */}
      {banksWithAccounts.length > 0 ? (
        <div className="space-y-6">
          {banksWithAccounts.map(({ bank, accounts }) => (
            <Card key={bank.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-lg text-white font-bold text-sm"
                      style={{ backgroundColor: bank.color }}
                    >
                      {bank.short_name || bank.name.slice(0, 2)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{bank.name}</CardTitle>
                      {bank.notes && (
                        <p className="text-sm text-muted-foreground">{bank.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAccountDialog(bank.id)}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Účet
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => deleteBank.mutate(bank.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {accounts.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {accounts.map((account) => {
                      const owner = members?.find((m) => m.id === account.owner_user_id);
                      const typeInfo = ACCOUNT_TYPES.find((t) => t.value === account.account_type);

                      return (
                        <div
                          key={account.id}
                          className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{typeInfo?.icon || "💳"}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{account.name}</p>
                                <span className="text-sm font-semibold text-blue-600">
                                  {formatCurrency(account.current_balance || 0)}
                                </span>
                              </div>
                              {account.account_number && (
                                <p className="text-xs font-mono text-muted-foreground">
                                  {account.account_number}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1 mt-1">
                                {account.account_type === "credit_card" && account.credit_limit && (
                                  <Badge variant="outline" className="text-xs border-purple-400 text-purple-600">
                                    💎 Limit: {formatCurrency(account.credit_limit)}
                                  </Badge>
                                )}
                                {account.is_premium && (
                                  <Badge variant="secondary" className="text-xs">
                                    ⭐ Prémium {account.premium_min_flow && `(min. ${formatCurrency(account.premium_min_flow)})`}
                                  </Badge>
                                )}
                                {owner && (
                                  <Badge className="text-xs" style={{ backgroundColor: owner.color }}>
                                    {owner.name}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => openEditAccountDialog(account)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 h-8 w-8 p-0"
                              onClick={() => deleteAccount.mutate(account.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Zatím žádné účty u této banky
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Začněte přidáním banky</h3>
            <p className="text-muted-foreground mt-2 text-center max-w-md">
              Přidejte banky kde máte účty a nastavte workflow převodů.
            </p>
            <Button onClick={() => setIsBankDialogOpen(true)} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Přidat banku
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Bank Dialog */}
      <Dialog open={isBankDialogOpen} onOpenChange={setIsBankDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Přidat banku</DialogTitle>
          </DialogHeader>

          {/* Quick select common banks */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Rychlý výběr:</Label>
            <div className="flex flex-wrap gap-2">
              {COMMON_BANKS.slice(0, 6).map((bank) => (
                <Button
                  key={bank.shortName}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectCommonBank(bank)}
                  className="text-xs"
                  style={{
                    borderColor:
                      bankForm.short_name === bank.shortName ? bank.color : undefined,
                    color: bankForm.short_name === bank.shortName ? bank.color : undefined,
                  }}
                >
                  {bank.shortName}
                </Button>
              ))}
            </div>
          </div>

          <form onSubmit={handleAddBank} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Název banky</Label>
                <Input
                  id="bankName"
                  value={bankForm.name}
                  onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })}
                  placeholder="Česká spořitelna"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shortName">Zkratka</Label>
                <Input
                  id="shortName"
                  value={bankForm.short_name}
                  onChange={(e) => setBankForm({ ...bankForm, short_name: e.target.value })}
                  placeholder="ČS"
                  maxLength={5}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Barva</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="color"
                  value={bankForm.color}
                  onChange={(e) => setBankForm({ ...bankForm, color: e.target.value })}
                  className="w-16 h-10"
                />
                <div
                  className="flex-1 h-10 rounded-md flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: bankForm.color }}
                >
                  {bankForm.short_name || "XX"}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBankDialogOpen(false)}
              >
                Zrušit
              </Button>
              <Button type="submit" disabled={createBank.isPending}>
                {createBank.isPending ? "Ukládám..." : "Přidat banku"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Account Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={handleCloseAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? "Upravit účet" : "Přidat účet"}
              {selectedBankId && (
                <span className="text-muted-foreground font-normal ml-2">
                  ({banksWithAccounts.find((b) => b.bank.id === selectedBankId)?.bank.name})
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAccount} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountName">Název účtu</Label>
              <Input
                id="accountName"
                value={accountForm.name}
                onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                placeholder="např. Hlavní účet, Hypotéka, Spoření"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Číslo účtu (volitelné)</Label>
              <Input
                id="accountNumber"
                value={accountForm.account_number}
                onChange={(e) =>
                  setAccountForm({ ...accountForm, account_number: e.target.value })
                }
                placeholder="123456789/0800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Typ účtu</Label>
                <Select
                  value={accountForm.account_type}
                  onValueChange={(value) =>
                    setAccountForm({ ...accountForm, account_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Vlastník</Label>
                <Select
                  value={accountForm.owner_user_id?.toString() || "shared"}
                  onValueChange={(value) =>
                    setAccountForm({
                      ...accountForm,
                      owner_user_id: value === "shared" ? undefined : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shared">Společný</SelectItem>
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
              <Label htmlFor="initialBalance">Aktuální zůstatek na účtu</Label>
              <Input
                id="initialBalance"
                type="number"
                step="100"
                value={accountForm.initial_balance || ""}
                onChange={(e) =>
                  setAccountForm({
                    ...accountForm,
                    initial_balance: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="např. 50000"
              />
              <p className="text-xs text-muted-foreground">
                Zadejte kolik máte aktuálně na účtu. Používá se pro výpočet cash flow.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accountForm.is_premium}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, is_premium: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm">Prémiový účet (s podmínkami)</span>
              </label>
            </div>

            {accountForm.is_premium && (
              <div className="space-y-2">
                <Label htmlFor="premiumMinFlow">Minimální měsíční obrat pro prémium</Label>
                <Input
                  id="premiumMinFlow"
                  type="number"
                  value={accountForm.premium_min_flow || ""}
                  onChange={(e) =>
                    setAccountForm({
                      ...accountForm,
                      premium_min_flow: parseFloat(e.target.value) || undefined,
                    })
                  }
                  placeholder="např. 25000"
                />
              </div>
            )}

            {accountForm.account_type === "credit_card" && (
              <div className="space-y-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <Label htmlFor="creditLimit" className="text-purple-700">💎 Limit kreditní karty</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  step="1000"
                  value={accountForm.credit_limit || ""}
                  onChange={(e) =>
                    setAccountForm({
                      ...accountForm,
                      credit_limit: parseFloat(e.target.value) || undefined,
                    })
                  }
                  placeholder="např. 50000"
                />
                <p className="text-xs text-purple-600">
                  Maximální částka kterou můžete z karty čerpat. Zůstatek = kolik vám zbývá.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseAccountDialog}
              >
                Zrušit
              </Button>
              <Button type="submit" disabled={createAccount.isPending || updateAccount.isPending}>
                {createAccount.isPending || updateAccount.isPending
                  ? "Ukládám..."
                  : editingAccount
                  ? "Uložit změny"
                  : "Přidat účet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
