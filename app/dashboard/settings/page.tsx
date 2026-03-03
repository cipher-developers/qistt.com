import { getCurrentTenant } from "@/lib/auth-helper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Settings - Kistly",
};

export default async function SettingsPage() {
  const tenant = await getCurrentTenant();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">Manage your account and preferences</p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Tenant Information</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-600">Tenant Name</label>
            <p className="mt-1 text-slate-900 font-medium">{tenant?.name}</p>
          </div>
          <div>
            <label className="text-sm text-slate-600">Subdomain</label>
            <p className="mt-1 text-slate-900 font-medium">{tenant?.subdomain}</p>
          </div>
          <div>
            <label className="text-sm text-slate-600">Created</label>
            <p className="mt-1 text-slate-900 font-medium">
              {tenant?.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : "-"}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-slate-700">Email Notifications</label>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-slate-700">Payment Reminders</label>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Account</h2>
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            Change Password
          </Button>
          <Button variant="outline" className="w-full justify-start text-red-600">
            Delete Account
          </Button>
        </div>
      </Card>
    </div>
  );
}
