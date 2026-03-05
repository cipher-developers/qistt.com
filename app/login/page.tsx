import { LoginForm } from "@/components/auth/login-form";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTenantBySubdomain, extractSubdomain } from "@/lib/tenant";
import { headers } from "next/headers";

export async function generateMetadata() {
  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const subdomain = extractSubdomain(hostname);
  
  if (subdomain) {
    const tenant = await getTenantBySubdomain(subdomain);
    if (tenant) {
      return {
        title: `Login - ${tenant.name}`,
        description: `Sign in to your ${tenant.name} account`,
      };
    }
  }
  
  return {
    title: "Login - Kistly",
    description: "Sign in to your Kistly account",
  };
}

export default async function LoginPage() {
  const session = await auth();
  
  if (session?.user) {
    redirect("/dashboard");
  }

  const headersList = await headers();
  const hostname = headersList.get("host") || "";
  const subdomain = extractSubdomain(hostname);

  let tenant = null;
  if (subdomain) {
    tenant = await getTenantBySubdomain(subdomain);
    if (!tenant || tenant.status !== "active") {
      notFound();
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {tenant ? (
            <>
              <div className="text-center mb-8">
                {tenant.logo && (
                  <img 
                    src={tenant.logo} 
                    alt={tenant.name}
                    className="h-16 mx-auto mb-4 object-contain"
                  />
                )}
                <h1 className="text-3xl font-bold text-slate-900">{tenant.name}</h1>
                <p className="text-xs text-slate-500 mt-2">Powered by Kistly</p>
              </div>
              <LoginForm />
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">K</span>
                </div>
                <h1 className="text-3xl font-bold text-slate-900">Kistly</h1>
                <p className="text-slate-600 mt-2">Installment Management Made Simple</p>
              </div>
              <LoginForm />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
