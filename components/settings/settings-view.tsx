import {
  Building2,
  CreditCard,
  Globe,
  ImageIcon,
  Package,
  ReceiptText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { TenantSettingsForm } from "@/components/settings/tenant-settings-form";

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function SettingsView({
  tenant,
  metrics,
}: {
  tenant: {
    id: string;
    name: string;
    subdomain: string;
    ownerEmail: string;
    logo: string | null;
    status: string;
    createdAt: string | Date;
  };
  metrics: {
    customers: number;
    items: number;
    activePlans: number;
    transactions: number;
  };
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Workspace
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage branding, tenant details, and review workspace activity at a
            glance.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            {tenant.logo ? (
              <img
                src={tenant.logo}
                alt={tenant.name}
                className="h-12 w-12 rounded-xl border border-slate-200 object-contain bg-white p-1"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                {getInitials(tenant.name)}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {tenant.name}
              </p>
              <p className="text-xs text-slate-500">
                {tenant.subdomain}.qistt.com
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Customers</p>
              <p className="text-xl font-bold text-slate-900">
                {metrics.customers}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Package size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Items</p>
              <p className="text-xl font-bold text-slate-900">
                {metrics.items}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CreditCard size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Active Plans</p>
              <p className="text-xl font-bold text-slate-900">
                {metrics.activePlans}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <ReceiptText size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Transactions</p>
              <p className="text-xl font-bold text-slate-900">
                {metrics.transactions}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Brand & Profile
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Update how your workspace appears across login and dashboard
                surfaces.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Live settings
            </div>
          </div>

          <TenantSettingsForm tenant={tenant} />
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Brand Preview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Quick look at how your workspace identity is presented.
              </p>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.16),_transparent_45%),linear-gradient(135deg,_#0f172a,_#1e293b)] p-5 text-white">
                <div className="flex items-center gap-4">
                  {tenant.logo ? (
                    <img
                      src={tenant.logo}
                      alt={tenant.name}
                      className="h-14 w-14 rounded-2xl bg-white object-contain p-2"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold backdrop-blur-sm">
                      {getInitials(tenant.name)}
                    </div>
                  )}
                  <div>
                    <p className="text-base font-semibold">{tenant.name}</p>
                    <p className="text-sm text-slate-300">
                      {tenant.ownerEmail}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Globe size={16} className="mt-0.5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">Workspace URL</p>
                    <p className="text-slate-500">
                      https://{tenant.subdomain}.qistt.com
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <ShieldCheck size={16} className="mt-0.5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">Status</p>
                    <p className="text-slate-500 capitalize">{tenant.status}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <Building2 size={16} className="mt-0.5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">Created</p>
                    <p className="text-slate-500">
                      {formatDate(tenant.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 text-slate-900">
              <ImageIcon size={18} />
              <h2 className="text-lg font-semibold">Guidance</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>
                Use a square logo with a transparent background for the cleanest
                sidebar and auth-screen rendering.
              </p>
              <p>
                Keep the owner email current so operational and account-related
                notices reach the right inbox.
              </p>
              <p>
                If you need subdomain or account-status changes, use the admin
                tenant management flow to avoid breaking tenant routing.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
