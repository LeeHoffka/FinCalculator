import { Tags } from "lucide-react";
import { useCategoryTree } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

function CategoryItem({ category, level = 0 }: { category: Category; level?: number }) {
  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-slate-50",
          level > 0 && "ml-6"
        )}
        style={{ borderLeft: level > 0 ? `2px solid ${category.color}` : undefined }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-sm"
          style={{ backgroundColor: `${category.color}20` }}
        >
          {category.icon || <Tags className="h-4 w-4" style={{ color: category.color }} />}
        </div>
        <div className="flex-1">
          <p className="font-medium">{category.name}</p>
          <p className="text-xs text-muted-foreground">
            {category.category_type === "income" ? "Příjem" : category.category_type === "expense" ? "Výdaj" : "Oboje"}
          </p>
        </div>
      </div>
      {category.children?.map((child) => (
        <CategoryItem key={child.id} category={child} level={level + 1} />
      ))}
    </div>
  );
}

export function Categories() {
  const { data: categories, isLoading } = useCategoryTree();

  if (isLoading) {
    return <div className="animate-pulse">Načítání...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kategorie</h1>
        <p className="text-muted-foreground">Hierarchické kategorie pro transakce</p>
      </div>

      <div className="rounded-lg border bg-white">
        {categories?.map((category) => (
          <CategoryItem key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
}

