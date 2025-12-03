import { Plus } from "lucide-react";
import { TransactionRow } from "./TransactionRow";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/hooks/useTransactions";

interface TransactionListProps {
  onAddTransaction?: () => void;
  onSelectTransaction?: (id: number) => void;
  limit?: number;
}

export function TransactionList({
  onAddTransaction,
  onSelectTransaction,
  limit,
}: TransactionListProps) {
  const { data: transactions, isLoading, error } = useTransactions();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg bg-slate-200"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        Chyba při načítání transakcí: {error.message}
      </div>
    );
  }

  const displayedTransactions = limit
    ? transactions?.slice(0, limit)
    : transactions;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Transakce</h3>
        {onAddTransaction && (
          <Button onClick={onAddTransaction} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Přidat transakci
          </Button>
        )}
      </div>

      {displayedTransactions && displayedTransactions.length > 0 ? (
        <div className="space-y-2">
          {displayedTransactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              onClick={() => onSelectTransaction?.(transaction.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">Zatím nemáte žádné transakce</p>
          {onAddTransaction && (
            <Button onClick={onAddTransaction} variant="outline" className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Přidat první transakci
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

