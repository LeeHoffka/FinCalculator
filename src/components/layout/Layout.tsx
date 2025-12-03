import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

const pageTitles: Record<string, string> = {
  "/": "Přehled rozpočtu",
  "/members": "Členové & Příjmy",
  "/banks": "Banky & Účty",
  "/flow": "Workflow převodů",
  "/expenses": "Stálé výdaje",
  "/budgets": "Rozpočty",
  "/settings": "Nastavení",
};

export function Layout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "FinCalculator";

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
