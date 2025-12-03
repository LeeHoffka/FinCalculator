import { GitBranch } from "lucide-react";

export function Flows() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Peněžní toky</h1>
        <p className="text-muted-foreground">Propojené skupiny transakcí</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Flow skupiny</h3>
        <p className="text-muted-foreground mt-2">
          Propojujte související transakce do logických celků pro lepší přehled
        </p>
      </div>
    </div>
  );
}

