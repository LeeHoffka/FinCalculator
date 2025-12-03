import { Target } from "lucide-react";

export function Goals() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Spořicí cíle</h1>
        <p className="text-muted-foreground">Sledujte pokrok svých finančních cílů</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Target className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Spořicí cíle</h3>
        <p className="text-muted-foreground mt-2">
          Nastavte si cíle jako dovolená, nové auto nebo finanční rezerva
        </p>
      </div>
    </div>
  );
}

