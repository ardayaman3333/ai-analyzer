"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (loading) return;
    const sure = window.confirm("Delete this analysis permanently?");
    if (!sure) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/analyses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        disabled={loading}
        className="border-white/30 text-slate-200 hover:border-white hover:text-white"
      >
        {loading ? "Deleting..." : "Delete"}
      </Button>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}
