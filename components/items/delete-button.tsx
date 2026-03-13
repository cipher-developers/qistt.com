"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ItemDeleteButton({
  itemId,
  compact = false,
}: {
  itemId: number;
  compact?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json().catch(() => null);
        alert(data?.error || "Failed to delete item");
      }
    } catch {
      alert("Error deleting item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={
        compact
          ? "rounded-lg px-3 text-red-600 hover:text-red-700"
          : "gap-2 text-red-600 hover:text-red-700"
      }
      onClick={handleDelete}
      disabled={loading}
    >
      <Trash2 size={16} />
      {compact ? null : "Delete"}
    </Button>
  );
}
