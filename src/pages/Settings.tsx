import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSettingsStore } from "@/stores/settingsStore";
import { CURRENCIES } from "@/utils/currency";

export function Settings() {
  const { theme, setTheme, defaultCurrency, setDefaultCurrency } = useSettingsStore();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Nastavení</h1>
        <p className="text-muted-foreground">Upravte si aplikaci podle svých potřeb</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vzhled</CardTitle>
          <CardDescription>Nastavení zobrazení aplikace</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Téma</Label>
            <Select value={theme} onValueChange={(value: "light" | "dark" | "system") => setTheme(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Světlé</SelectItem>
                <SelectItem value="dark">Tmavé</SelectItem>
                <SelectItem value="system">Systémové</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Měna</CardTitle>
          <CardDescription>Výchozí měna pro nové transakce</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Výchozí měna</Label>
            <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name} ({currency.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>O aplikaci</CardTitle>
          <CardDescription>Informace o aplikaci</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Název:</strong> FinCalculator</p>
            <p><strong>Verze:</strong> 1.0.0</p>
            <p><strong>Technologie:</strong> Tauri + React + TypeScript + SQLite</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

