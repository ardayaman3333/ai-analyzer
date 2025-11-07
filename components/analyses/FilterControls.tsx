"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const statusFilters = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
];

type Props = {
  currentFilter: string;
  sortOrder: "asc" | "desc";
};

export function FilterControls({ currentFilter, sortOrder }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-300">
        {statusFilters.map((filter) => {
          const active = filter.value === currentFilter;
          return (
            <button
              key={filter.value}
              onClick={() => update({ status: filter.value })}
              className={`rounded-full border px-3 py-1 transition ${
                active ? "border-white text-white" : "border-white/20 text-slate-400 hover:border-white/40 hover:text-white"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
      <button
        onClick={() =>
          update({
            status: currentFilter,
            sort: sortOrder === "asc" ? "desc" : "asc",
          })
        }
        className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-300 transition hover:border-white/40 hover:text-white"
      >
        {sortOrder === "asc" ? "Oldest → Newest" : "Newest → Oldest"}
      </button>
    </div>
  );
}
