import { useState } from "react";
import { Plus } from "lucide-react";
import { AccountCard } from "@/components/accounts/AccountCard";
import { Button } from "@/components/ui/button";
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
import { useAccounts, useCreateAccount } from "@/hooks/useAccounts";
import { useBanks } from "@/hooks/useBanks";
import type { AccountType } from "@/types";

const accountTypes: { value: AccountType; label: string }[] = [
  { value: "checking", label: "Běžný účet" },
  { value: "savings", label: "Spořicí účet" },
  { value: "credit_card", label: "Kreditní karta" },
  { value: "investment", label: "Investiční účet" },
  { value: "cash", label: "Hotovost" },
  { value: "other", label: "Ostatní" },
];

export function Accounts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    account_type: "checking" as AccountType,
    bank_id: undefined as number | undefined,
    currency: "CZK",
    initial_balance: 0,
    color: "#3B82F6",
  });

  const { data: accounts, isLoading } = useAccounts();
  const { data: banks } = useBanks();
  const createAccount = useCreateAccount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAccount.mutateAsync(formData);
    setIsDialogOpen(false);
    setFormData({
      name: "",
      account_type: "checking",
      bank_id: undefined,
      currency: "CZK",
      initial_balance: 0,
      color: "#3B82F6",
    });
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-lg bg-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Účty</h1>
          <p className="text-muted-foreground">Správa vašich bankovních účtů</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nový účet
        </Button>
      </div>

      {accounts && accounts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="text-6xl mb-4">💳</div>
          <h3 className="text-lg font-semibold">Zatím nemáte žádné účty</h3>
          <p className="text-muted-foreground mt-2">
            Vytvořte svůj první účet pro sledování financí
          </p>
          <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Vytvořit účet
          </Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nový účet</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Název účtu</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="např. Hlavní účet"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Typ účtu</Label>
              <Select
                value={formData.account_type}
                onValueChange={(value: AccountType) =>
                  setFormData({ ...formData, account_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank">Banka (volitelné)</Label>
              <Select
                value={formData.bank_id?.toString()}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    bank_id: value ? parseInt(value) : undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte banku" />
                </SelectTrigger>
                <SelectContent>
                  {banks?.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id.toString()}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="balance">Počáteční zůstatek</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  value={formData.initial_balance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initial_balance: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Barva</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="h-10"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Zrušit
              </Button>
              <Button type="submit" disabled={createAccount.isPending}>
                {createAccount.isPending ? "Vytvářím..." : "Vytvořit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

