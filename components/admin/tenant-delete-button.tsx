"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function TenantDeleteButton({ tenantId }: { tenantId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete tenant");
      }

      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete tenant");
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  }

  if (showConfirm) {
    return (
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="destructive"
          disabled={isDeleting}
          onClick={handleDelete}
          className="text-xs"
        >
          {isDeleting ? "Deleting..." : "Confirm"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isDeleting}
          onClick={() => setShowConfirm(false)}
          className="text-xs"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-2 text-xs text-red-600 hover:text-red-700"
      onClick={() => setShowConfirm(true)}
    >
      <Trash2 size={14} />
      <span className="hidden sm:inline">Delete</span>
    </Button>
  );
}
