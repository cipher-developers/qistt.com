import { getCurrentTenant } from "@/lib/auth-helper";
import { CustomerForm } from "@/components/customers/customer-form";

export const metadata = {
  title: "Add Customer - Kistly",
};

export default async function NewCustomerPage() {
  const tenant = await getCurrentTenant();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Add Customer</h1>
        <p className="text-slate-600 mt-1">Create a new customer profile</p>
      </div>
      <CustomerForm tenantId={tenant?.id} />
    </div>
  );
}
