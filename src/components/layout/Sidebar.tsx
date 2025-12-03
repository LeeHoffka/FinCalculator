import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Receipt,
  PiggyBank,
  Building2,
  GitBranch,
  Settings,
  ChevronLeft,
  ChevronRight,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navigation = [
  { name: "Přehled", href: "/", icon: LayoutDashboard },
  { name: "Členové & Příjmy", href: "/members", icon: Users },
  { name: "Banky & Účty", href: "/banks", icon: Building2 },
  { name: "Workflow převodů", href: "/flow", icon: GitBranch },
  { name: "Stálé výdaje", href: "/expenses", icon: Receipt },
  { name: "Rozpočty", href: "/budgets", icon: PiggyBank },
  { name: "Cíle & Fondy", href: "/goals", icon: Target },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col bg-slate-900 text-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
        {!collapsed && (
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            FinCalculator
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                    isActive
                      ? "bg-emerald-600 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="font-medium">{item.name}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Settings */}
      <div className="border-t border-slate-800 p-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
              isActive
                ? "bg-emerald-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )
          }
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Nastavení</span>}
        </NavLink>
      </div>
    </aside>
  );
}
