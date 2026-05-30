"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ReferenceFormProps = {
  mode?: "create" | "edit";
  reference?: {
    id: string;
    name: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function ReferenceForm({
  mode = "create",
  reference,
  onSuccess,
  onCancel,
}: ReferenceFormProps) {
  const router = useRouter();
  const [name, setName] = useState(reference?.name || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(reference?.name || "");
  }, [reference]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "edit" && reference
          ? `/api/references/${reference.id}`
          : "/api/references";
      const response = await fetch(endpoint, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(
          data?.error ||
            `Failed to ${mode === "edit" ? "update" : "create"} reference`,
        );
        return;
      }

      router.refresh();
      onSuccess?.();

      if (mode === "create") {
        setName("");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <Label htmlFor="name" className="font-medium text-slate-700">
          Reference Name *
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Walk-in, Referral, Online"
          required
          className="mt-1 h-11 rounded-xl border-slate-200"
        />
        <p className="mt-1.5 text-xs text-slate-500">
          A short label to identify how or where this customer was referred.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading || !name.trim()}
          className="rounded-xl bg-slate-900 hover:bg-slate-800"
        >
          {loading
            ? mode === "edit"
              ? "Saving…"
              : "Adding…"
            : mode === "edit"
              ? "Save Changes"
              : "Add Reference"}
        </Button>
      </div>
    </form>
  );
}
