import { LoginForm } from "@/components/auth/login-form";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Login - Kistly",
  description: "Sign in to your Kistly account",
};

export default async function LoginPage() {
  const session = await auth();
  
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-center mb-2 text-slate-900">Kistly</h1>
          <p className="text-center text-slate-600 mb-8">Installment Management Made Simple</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
