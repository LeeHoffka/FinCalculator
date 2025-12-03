import { useNavigate } from "react-router-dom";
import { Settings, HelpCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>

      <div className="flex items-center gap-4">
        {/* Help Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-5 w-5 text-slate-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Nápověda</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <Info className="mr-2 h-4 w-4" />
              Jak používat aplikaci
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-2 text-xs text-muted-foreground">
              <p className="font-medium mb-1">Jak začít:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Přidejte členy domácnosti</li>
                <li>Zadejte jejich příjmy</li>
                <li>Přidejte banky a účty</li>
                <li>Nastavte workflow převodů</li>
                <li>Přidejte stálé výdaje</li>
                <li>Nastavte rozpočty</li>
              </ol>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Settings */}
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
          <Settings className="h-5 w-5 text-slate-600" />
        </Button>
      </div>
    </header>
  );
}
