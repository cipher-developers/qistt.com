"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Building2, Globe, Mail, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TenantSettingsFormProps {
  tenant: {
    id: string;
    name: string;
    subdomain: string;
    ownerEmail: string;
    logo: string | null;
  };
}

export function TenantSettingsForm({ tenant }: TenantSettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: tenant.name,
    ownerEmail: tenant.ownerEmail,
    logo: tenant.logo ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Tenant name is required.");
      return;
    }

    if (!formData.ownerEmail.trim()) {
      setError("Owner email is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          ownerEmail: formData.ownerEmail.trim(),
          logo: formData.logo.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update settings.");
        return;
      }

      setSuccess("Settings updated successfully.");
      router.refresh();
    } catch {
      setError("Failed to update settings.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5">
        <div>
          <Label htmlFor="tenantName" className="text-slate-700 font-medium">
            Workspace Name
          </Label>
          <div className="relative mt-1.5">
            <Building2
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              id="tenantName"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="pl-9"
              placeholder="Enter your workspace name"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="ownerEmail" className="text-slate-700 font-medium">
            Owner Email
          </Label>
          <div className="relative mt-1.5">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              id="ownerEmail"
              type="email"
              value={formData.ownerEmail}
              onChange={(e) =>
                setFormData({ ...formData, ownerEmail: e.target.value })
              }
              className="pl-9"
              placeholder="owner@company.com"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="logoUrl" className="text-slate-700 font-medium">
            Logo URL
          </Label>
          <div className="relative mt-1.5">
            <Globe
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <Input
              id="logoUrl"
              type="url"
              value={formData.logo}
              onChange={(e) =>
                setFormData({ ...formData, logo: e.target.value })
              }
              className="pl-9"
              placeholder="https://example.com/logo.png"
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Leave blank to use the default workspace monogram.
          </p>
        </div>

        <div>
          <Label className="text-slate-700 font-medium">Workspace URL</Label>
          <div className="mt-1.5 flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
            https://{tenant.subdomain}.qistt.com
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Subdomain changes are restricted because they affect your login and
            public workspace address.
          </p>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="flex items-center gap-3 pt-1">
        <Button
          type="submit"
          disabled={loading}
          className="bg-slate-900 hover:bg-slate-800 gap-2"
        >
          <Save size={16} />
          {loading ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => {
            setFormData({
              name: tenant.name,
              ownerEmail: tenant.ownerEmail,
              logo: tenant.logo ?? "",
            });
            setError("");
            setSuccess("");
          }}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
