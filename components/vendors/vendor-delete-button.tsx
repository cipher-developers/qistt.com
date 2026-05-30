"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function VendorDeleteButton({
  vendorId,
  compact = false,
}: {
  vendorId: number;
  compact?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this vendor?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        alert(data?.error || "Failed to delete vendor");
        return;
      }

      router.refresh();
    } catch {
      alert("Error deleting vendor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={handleDelete}
      className={
        compact ? "rounded-lg px-3 text-red-600" : "gap-2 text-red-600"
      }
    >
      <Trash2 size={16} />
      {compact ? null : "Delete"}
    </Button>
  );
}
