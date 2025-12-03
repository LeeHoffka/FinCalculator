import { Repeat } from "lucide-react";

export function Recurring() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Opakované platby</h1>
        <p className="text-muted-foreground">Automatické opakující se platby</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Repeat className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Opakované platby</h3>
        <p className="text-muted-foreground mt-2">
          Nastavte automatické platby pro nájemné, pojištění a další pravidelné výdaje
        </p>
      </div>
    </div>
  );
}

