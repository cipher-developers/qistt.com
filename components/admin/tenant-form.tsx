"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface TenantFormProps {
  tenant?: {
    id: string;
    name: string;
    subdomain: string;
    ownerEmail: string;
    logo?: string | null;
    status: string;
  };
}

export function TenantForm({ tenant }: TenantFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: tenant?.name || "",
    subdomain: tenant?.subdomain || "",
    ownerEmail: tenant?.ownerEmail || "",
    logo: tenant?.logo || "",
    status: tenant?.status || "active",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = tenant ? `/api/admin/tenants/${tenant.id}` : "/api/admin/tenants";
      const method = tenant ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to save tenant");
      } else {
        router.push("/admin/tenants");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-4 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-slate-700 font-medium">
            Tenant Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="subdomain" className="text-slate-700 font-medium">
            Subdomain *
          </Label>
          <Input
            id="subdomain"
            value={formData.subdomain}
            onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
            placeholder="e.g., ar-corp"
            disabled={!!tenant}
            required
            className="mt-1"
          />
          <p className="text-xs text-slate-500 mt-1">Format: lowercase, hyphens only</p>
        </div>

        <div>
          <Label htmlFor="ownerEmail" className="text-slate-700 font-medium">
            Owner Email *
          </Label>
          <Input
            id="ownerEmail"
            type="email"
            value={formData.ownerEmail}
            onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="logo" className="text-slate-700 font-medium">
            Logo URL
          </Label>
          <Input
            id="logo"
            type="url"
            value={formData.logo}
            onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
            placeholder="https://example.com/logo.png"
            className="mt-1"
          />
        </div>

        {tenant && (
          <div>
            <Label htmlFor="status" className="text-slate-700 font-medium">
              Status
            </Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Saving..." : tenant ? "Update Tenant" : "Create Tenant"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
