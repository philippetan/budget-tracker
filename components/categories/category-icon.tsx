import { cn } from "cn";

import { categoryIcon, DEFAULT_CATEGORY_COLOR } from "@/lib/categories";

/** A category's icon in a softly tinted circle of its colour. */
export function CategoryIcon({
  icon,
  color,
  className,
}: {
  icon: string;
  color: string | null;
  className?: string;
}) {
  const Icon = categoryIcon(icon);
  const hex = color ?? DEFAULT_CATEGORY_COLOR;

  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full",
        className,
      )}
      // "26" = ~15% opacity background in the category's colour.
      style={{ backgroundColor: `${hex}26`, color: hex }}
    >
      <Icon className="size-5" />
    </div>
  );
}
