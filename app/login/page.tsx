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
    const role = (session.user as any)?.role;
    redirect(role === "ADMIN" ? "/admin" : "/dashboard");
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

  const brandName = tenant?.name ?? "Kistly";
  const brandTagline = tenant
    ? "Welcome back. Sign in to manage your installment plans."
    : "Installment management, simplified for modern businesses.";

  return (
    <main className="flex min-h-screen">
      {/* ── Left branding panel ── */}
      <div className="relative hidden w-[52%] flex-col justify-between overflow-hidden bg-slate-900 p-12 lg:flex">
        {/* Background gradient blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-120 w-120 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute -bottom-40 right-0 h-130 w-130 rounded-full bg-indigo-600/25 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-2xl" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 shadow-lg shadow-sky-500/30">
            <span className="text-lg font-black text-white">K</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Kistly
          </span>
        </div>

        {/* Center content */}
        <div className="relative space-y-8">
          {/* Floating stat cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <p className="text-2xl font-bold text-white">10k+</p>
              <p className="mt-1 text-sm text-slate-400">
                Transactions tracked
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <p className="text-2xl font-bold text-white">99.9%</p>
              <p className="mt-1 text-sm text-slate-400">Uptime guarantee</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <p className="text-2xl font-bold text-white">Multi</p>
              <p className="mt-1 text-sm text-slate-400">Tenant ready</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <p className="text-2xl font-bold text-white">Live</p>
              <p className="mt-1 text-sm text-slate-400">Real-time ledger</p>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold leading-snug text-white">
              Run your installment
              <br />
              business with confidence.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Track customers, plans, and payments — all in one place.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Kistly. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12 sm:px-12">
        {/* Mobile-only logo */}
        <div className="mb-10 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 shadow-lg shadow-sky-500/30">
            <span className="text-lg font-black text-white">K</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Kistly
          </span>
        </div>

        <div className="w-full max-w-sm">
          {/* Tenant logo (subdomain logins) */}
          {tenant?.logo && (
            <div className="mb-8 flex justify-center">
              <img
                src={tenant.logo}
                alt={tenant.name}
                className="h-14 object-contain"
              />
            </div>
          )}

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Sign in to {brandName}
            </h1>
            <p className="mt-2 text-sm text-slate-500">{brandTagline}</p>
          </div>

          <LoginForm />

          <p className="mt-8 text-center text-xs text-slate-400">
            {tenant ? (
              <>
                Powered by{" "}
                <span className="font-medium text-slate-600">Kistly</span>
              </>
            ) : (
              <>
                Secure sign-in powered by{" "}
                <span className="font-medium text-slate-600">Kistly</span>
              </>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}
