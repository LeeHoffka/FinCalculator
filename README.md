# FinCalculator 💰

Domácí finanční kalkulačka - nativní desktopová aplikace pro správu osobních financí.

## 🛠️ Technologie

### Frontend
- **React 19** + **TypeScript**
- **Vite** - build tool
- **Tailwind CSS** - styling
- **shadcn/ui** - UI komponenty
- **Zustand** - state management
- **TanStack Query** - data fetching
- **Recharts** - grafy a vizualizace
- **React Hook Form + Zod** - formuláře & validace
- **date-fns** - práce s daty
- **React Router** - navigace

### Backend
- **Tauri 2.0** - nativní desktop framework
- **Rust** - backend logika
- **SQLite** - lokální databáze
- **rusqlite** - Rust SQLite driver

## 🚀 Instalace a spuštění

### Prerekvizity
- Node.js 18+
- Rust 1.70+
- npm nebo pnpm

### Instalace závislostí

```bash
# Frontend dependencies
npm install

# Rust dependencies (automaticky při prvním spuštění)
```

### Vývoj

```bash
# Spuštění Tauri aplikace v dev módu
npm run tauri:dev

# Nebo pouze frontend
npm run dev
```

### Produkční build

```bash
npm run tauri:build
```

Výstup najdete v `src-tauri/target/release/bundle/`

## 📁 Struktura projektu

```
FinCalculator/
├── src/                          # React Frontend
│   ├── components/               # UI komponenty
│   │   ├── ui/                   # shadcn/ui komponenty
│   │   ├── accounts/             # Komponenty pro účty
│   │   ├── transactions/         # Komponenty pro transakce
│   │   ├── dashboard/            # Dashboard widgety
│   │   └── layout/               # Layout komponenty
│   ├── pages/                    # Stránky aplikace
│   ├── hooks/                    # Custom React hooks
│   ├── stores/                   # Zustand stores
│   ├── types/                    # TypeScript typy
│   ├── utils/                    # Utility funkce
│   └── lib/                      # Knihovny (Tauri API)
├── src-tauri/                    # Rust Backend
│   ├── src/
│   │   ├── commands/             # Tauri commands (API)
│   │   ├── db/                   # Databázové schema
│   │   ├── models/               # Datové modely
│   │   └── utils/                # Utility funkce
│   └── Cargo.toml
└── package.json
```

## ✨ Funkce

### Implementováno ✅
- **Dashboard** - přehled financí s grafy
- **Účty** - správa bankovních účtů (běžné, spořicí, kreditní karty, hotovost)
- **Transakce** - příjmy, výdaje, převody mezi účty
- **Banky** - definice bankovních institucí
- **Kategorie** - hierarchické kategorie transakcí
- **Tagy** - volné tagování transakcí
- **Reporty** - vizualizace výdajů podle kategorií
- **Nastavení** - téma, výchozí měna

### Plánováno 🔄
- Opakované platby
- Peněžní toky (flow groups)
- Spořicí cíle
- Export/Import dat
- Kreditní karty s konfiguracemi

## 📊 Databázové schéma

Aplikace používá SQLite databázi s těmito hlavními tabulkami:
- `users` - uživatelé
- `banks` - banky
- `accounts` - účty
- `categories` - kategorie (hierarchické)
- `transactions` - transakce
- `tags` - tagy
- `recurring_payments` - opakované platby
- `savings_goals` - spořicí cíle
- `flow_groups` - skupiny transakcí

## 🌐 API

Aplikace komunikuje přes Tauri IPC. Všechny CRUD operace jsou dostupné jako Tauri commands:

```typescript
// Příklad použití
import { invoke } from "@tauri-apps/api/core";

// Získat účty
const accounts = await invoke<Account[]>("get_accounts", { activeOnly: true });

// Vytvořit transakci
const transaction = await invoke<Transaction>("create_transaction", { input: {...} });
```

## 📝 Licence

MIT
