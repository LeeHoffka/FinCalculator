import { Plus } from "lucide-react";
import { AccountCard } from "./AccountCard";
import { Button } from "@/components/ui/button";
import { useAccounts } from "@/hooks/useAccounts";

interface AccountListProps {
  onAddAccount?: () => void;
  onSelectAccount?: (id: number) => void;
}

export function AccountList({ onAddAccount, onSelectAccount }: AccountListProps) {
  const { data: accounts, isLoading, error } = useAccounts();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-lg bg-slate-200"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        Chyba při načítání účtů: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Vaše účty</h3>
        {onAddAccount && (
          <Button onClick={onAddAccount} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Přidat účet
          </Button>
        )}
      </div>

      {accounts && accounts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onClick={() => onSelectAccount?.(account.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">Zatím nemáte žádné účty</p>
          {onAddAccount && (
            <Button onClick={onAddAccount} variant="outline" className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Vytvořit první účet
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

