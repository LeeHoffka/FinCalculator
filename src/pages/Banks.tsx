import { useState } from "react";
import { Plus, Building2 } from "lucide-react";
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
import { useBanks, useCreateBank } from "@/hooks/useBanks";

export function Banks() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    color: "#10B981",
    notes: "",
  });

  const { data: banks, isLoading } = useBanks();
  const createBank = useCreateBank();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBank.mutateAsync(formData);
    setIsDialogOpen(false);
    setFormData({ name: "", color: "#10B981", notes: "" });
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Banky</h1>
          <p className="text-muted-foreground">Správa bankovních institucí</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Přidat banku
        </Button>
      </div>

      {banks && banks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {banks.map((bank) => (
            <Card
              key={bank.id}
              style={{ borderLeft: `4px solid ${bank.color}` }}
            >
              <CardHeader className="flex flex-row items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${bank.color}20` }}
                >
                  <Building2 className="h-5 w-5" style={{ color: bank.color }} />
                </div>
                <CardTitle className="text-lg">{bank.name}</CardTitle>
              </CardHeader>
              {bank.notes && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{bank.notes}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="text-6xl mb-4">🏦</div>
          <h3 className="text-lg font-semibold">Zatím nemáte žádné banky</h3>
          <p className="text-muted-foreground mt-2">
            Přidejte banky pro lepší organizaci účtů
          </p>
          <Button onClick={() => setIsDialogOpen(true)} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Přidat banku
          </Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nová banka</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Název banky</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="např. Česká spořitelna"
                required
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

            <div className="space-y-2">
              <Label htmlFor="notes">Poznámky</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Volitelné poznámky"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Zrušit
              </Button>
              <Button type="submit" disabled={createBank.isPending}>
                {createBank.isPending ? "Vytvářím..." : "Vytvořit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

