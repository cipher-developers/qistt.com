import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, ArrowRight, Zap, Users, BarChart3, Shield } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-white font-bold text-xl">Kistly</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center space-y-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Installment Management{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto">
            Manage installment plans, track payments, and grow your business with Kistly. 
            Built for SMBs and retailers who want streamlined payment management.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/login">
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 text-lg h-auto flex items-center gap-2 w-full sm:w-auto">
                Get Started
                <ArrowRight size={20} />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" className="border-slate-500 text-slate-200 hover:bg-slate-800 px-8 py-3 text-lg h-auto w-full sm:w-auto">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Powerful Features</h2>
          <p className="text-slate-400 text-lg">Everything you need to manage installments effectively</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Users,
              title: "Customer Management",
              description: "Organize and manage all your customers in one central place",
            },
            {
              icon: Zap,
              title: "Automated Payments",
              description: "Create installment plans and track payments automatically",
            },
            {
              icon: BarChart3,
              title: "Analytics & Insights",
              description: "Get detailed reports and insights into your business performance",
            },
            {
              icon: Shield,
              title: "Secure & Reliable",
              description: "Enterprise-grade security to protect your business data",
            },
            {
              icon: Check,
              title: "Easy Integration",
              description: "Simple to setup, no technical knowledge required",
            },
            {
              icon: ArrowRight,
              title: "Multi-tenant",
              description: "Support multiple business entities from one platform",
            },
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card key={idx} className="bg-slate-800/50 border-slate-700 p-6 hover:bg-slate-800 transition-colors">
                <Icon className="w-12 h-12 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <Card className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border-blue-500/30 p-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to transform your payment management?
          </h2>
          <p className="text-slate-300 text-lg mb-8">
            Join businesses already using Kistly to streamline their operations.
          </p>
          <Link href="/login">
            <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 text-lg h-auto">
              Start Your Free Trial
            </Button>
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 mt-20 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-400">
          <p>&copy; 2024 Kistly. All rights reserved. | Professional Installment Management Platform</p>
        </div>
      </footer>
    </div>
  );
}
