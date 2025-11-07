"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

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

function buildHref(
  pathname: string,
  searchParams: URLSearchParams,
  updates: Record<string, string | undefined>
) {
  const next = new URLSearchParams(searchParams.toString());
  Object.entries(updates).forEach(([key, value]) => {
    if (!value || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  });
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function FilterControls({ currentFilter, sortOrder }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-300">
        {statusFilters.map((filter) => {
          const active = filter.value === currentFilter;
          const href = buildHref(pathname, searchParams, {
            status: filter.value,
            sort: sortOrder === "asc" ? "asc" : undefined,
          });
          return (
            <Link
              key={filter.value}
              href={href}
              prefetch={false}
              scroll={false}
              className={`rounded-full border px-3 py-1 transition ${
                active ? "border-white text-white" : "border-white/20 text-slate-400 hover:border-white/40 hover:text-white"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>
      <Link
        href={buildHref(pathname, searchParams, {
          status: currentFilter,
          sort: sortOrder === "asc" ? "desc" : "asc",
        })}
        prefetch={false}
        scroll={false}
        className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-300 transition hover:border-white/40 hover:text-white"
      >
        {sortOrder === "asc" ? "Oldest → Newest" : "Newest → Oldest"}
      </Link>
    </div>
  );
}
