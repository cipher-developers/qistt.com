"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CategoryDeleteButton({
  categoryId,
  compact = false,
}: {
  categoryId: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this category?")) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        alert(data?.error || "Failed to delete category");
        return;
      }

      router.refresh();
    } catch {
      alert("Error deleting category");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className={
        compact
          ? "rounded-lg px-3 text-red-600 hover:text-red-700"
          : "gap-2 text-red-600 hover:text-red-700"
      }
    >
      <Trash2 size={16} />
      {compact ? null : "Delete"}
    </Button>
  );
}
