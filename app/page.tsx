import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, ArrowRight, Zap, Users, BarChart3, Shield, Phone, Mail } from "lucide-react";
import { ContactForm } from "@/components/landing/contact-form";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-white font-bold text-xl">Kistly</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <a href="tel:+1234567890" className="flex items-center gap-2">
              <Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 gap-2">
                <Phone size={18} />
                <span className="hidden sm:inline">Call Us</span>
              </Button>
            </a>
            <a href="#contact" className="hidden sm:block">
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                Contact Us
              </Button>
            </a>
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
            <a href="#contact">
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 text-lg h-auto flex items-center gap-2 w-full sm:w-auto">
                Get Started
                <ArrowRight size={20} />
              </Button>
            </a>
            <a href="#features">
              <Button variant="outline" className="border-slate-500 text-slate-200 hover:bg-slate-800 px-8 py-3 text-lg h-auto w-full sm:w-auto">
                Learn More
              </Button>
            </a>
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

      {/* Benefits Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Why Choose Kistly?</h2>
          <p className="text-slate-400 text-lg">Trusted by businesses across different industries</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {[
            { title: "Reduce Payment Defaults", description: "Automated reminders and payment tracking reduce missed payments by up to 80%" },
            { title: "Improve Cash Flow", description: "Better visibility into customer payments helps optimize your business cash flow" },
            { title: "Save Time & Resources", description: "Automate manual payment tracking and reporting tasks" },
            { title: "Scale Your Business", description: "Handle thousands of installment plans without additional overhead" },
            { title: "24/7 Customer Support", description: "Dedicated support team ready to help your business succeed" },
            { title: "Data Security", description: "Bank-level security with encrypted data and regular backups" },
          ].map((benefit, idx) => (
            <div key={idx} className="flex gap-4">
              <Check className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                <p className="text-slate-400">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Get in Touch</h2>
          <p className="text-slate-400 text-lg">Have questions? Our team is here to help. Contact us today.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-slate-800/50 border-slate-700 p-6 text-center">
            <Phone className="w-10 h-10 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Call Us</h3>
            <a href="tel:+1234567890" className="text-slate-300 hover:text-blue-400 transition-colors">
              +1 (234) 567-890
            </a>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-6 text-center">
            <Mail className="w-10 h-10 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Email Us</h3>
            <a href="mailto:hello@kistly.com" className="text-slate-300 hover:text-blue-400 transition-colors">
              hello@kistly.com
            </a>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-6 text-center">
            <Zap className="w-10 h-10 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Quick Response</h3>
            <p className="text-slate-300">We respond to inquiries within 24 hours</p>
          </Card>
        </div>

        <ContactForm />
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
          <a href="#contact">
            <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 text-lg h-auto">
              Start Your Free Trial
            </Button>
          </a>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 mt-20 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
                <li><a href="#contact" className="hover:text-blue-400 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Terms</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Follow Us</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Kistly. All rights reserved. | Professional Installment Management Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
