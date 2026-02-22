import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Shield, Clock, Heart, Share2, Calendar, Lock, 
  ChevronRight, CheckCircle2, Star, Users, ArrowRight,
  Play, Zap, Globe, MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Shield className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Life Vault</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="#vaults" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Vaults</a>
            <a href="#security" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Security</a>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')} className="text-slate-600 hover:text-blue-600">
              Log in
            </Button>
            <Button onClick={() => navigate('/signup')} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 px-6">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-6">
                <Zap size={14} />
                <span>Preserve Your Digital Legacy</span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 leading-[1.1] mb-8">
                Your memories, <span className="text-blue-600">securely preserved</span> for the future.
              </h1>
              <p className="text-xl text-slate-600 mb-10 leading-relaxed">
                Life Vault is the most secure platform to store, schedule, and share your most precious memories and messages with loved ones, even when you're not around.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => navigate('/signup')} className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-7 shadow-xl shadow-blue-100 group">
                  Start Your Vault <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-7 border-slate-200 hover:bg-slate-50">
                  <Play className="mr-2 fill-current" size={18} /> Watch Demo
                </Button>
              </div>
              <div className="mt-12 flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">
                      {i}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-500">
                  <span className="font-bold text-slate-900">2,000+</span> users trust Life Vault
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 p-4">
                <div className="bg-slate-50 rounded-2xl p-8 aspect-[4/3] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200 mx-auto mb-6">
                      <Lock className="text-white" size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Military-Grade Security</h3>
                    <p className="text-slate-500">Your data is encrypted and stored with the highest standards.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">Core Features</h2>
            <h3 className="text-4xl font-bold text-slate-900 mb-6">Everything you need to preserve your legacy</h3>
            <p className="text-lg text-slate-600">
              We've built a comprehensive suite of tools to ensure your memories are handled with care, precision, and absolute security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Clock className="text-blue-600" size={24} />,
                title: "Scheduled Delivery",
                desc: "Set exact dates and times for your memories to be delivered to recipients."
              },
              {
                icon: <Shield className="text-emerald-600" size={24} />,
                title: "End-to-End Security",
                desc: "Your content is encrypted and only accessible by you and your designated recipients."
              },
              {
                icon: <Heart className="text-rose-600" size={24} />,
                title: "Legacy Messages",
                desc: "Create messages that will be delivered if you're inactive for a set period."
              },
              {
                icon: <Globe className="text-indigo-600" size={24} />,
                title: "Global Access",
                desc: "Access your vault from anywhere in the world, on any device, at any time."
              },
              {
                icon: <MessageSquare className="text-amber-600" size={24} />,
                title: "Rich Media Support",
                desc: "Store photos, videos, voice notes, and long-form letters in high quality."
              },
              {
                icon: <Users className="text-purple-600" size={24} />,
                title: "Recipient Management",
                desc: "Easily manage who receives what, with verified email delivery systems."
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vaults Section */}
      <section id="vaults" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">The Three Vaults</h2>
            <h3 className="text-4xl font-bold text-slate-900 mb-6">Tailored for every timeline</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Present Vault */}
            <Card className="border-none shadow-lg bg-white overflow-hidden group hover:shadow-xl transition-all">
              <div className="h-2 bg-emerald-500"></div>
              <CardHeader className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6">
                  <Calendar size={28} />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">Present Vault</CardTitle>
                <CardDescription className="text-lg text-slate-500 mt-2">Share within 1 month</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Perfect for sharing memories with loved ones in the near future. Schedule photos, videos, and messages to be delivered within the next month.
                </p>
                <ul className="space-y-4 mb-10">
                  {["Up to 1 month scheduling", "Unlimited media uploads", "Email notifications", "Nested slots support"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                      <CheckCircle2 className="text-emerald-500" size={18} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6" onClick={() => navigate('/signup')}>
                  Start Present Vault
                </Button>
              </CardContent>
            </Card>

            {/* Future Vault */}
            <Card className="border-none shadow-lg bg-white overflow-hidden group hover:shadow-xl transition-all scale-105 z-10">
              <div className="h-2 bg-blue-600"></div>
              <CardHeader className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6">
                  <Clock size={28} />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">Future Vault</CardTitle>
                <CardDescription className="text-lg text-slate-500 mt-2">Share within 9 months</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Plan ahead with memories scheduled for delivery up to 9 months in advance. Perfect for milestone celebrations and special occasions.
                </p>
                <ul className="space-y-4 mb-10">
                  {["Up to 9 months scheduling", "Unlimited media uploads", "Priority delivery", "Advanced scheduling"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                      <CheckCircle2 className="text-blue-600" size={18} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 shadow-lg shadow-blue-100" onClick={() => navigate('/signup')}>
                  Start Future Vault
                </Button>
              </CardContent>
            </Card>

            {/* Death Vault */}
            <Card className="border-none shadow-lg bg-white overflow-hidden group hover:shadow-xl transition-all">
              <div className="h-2 bg-rose-500"></div>
              <CardHeader className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 mb-6">
                  <Heart size={28} />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">Death Vault</CardTitle>
                <CardDescription className="text-lg text-slate-500 mt-2">Your Ultimate Legacy</CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Leave important messages for your loved ones. Automatically delivered after 9 months of inactivity with secure confirmation.
                </p>
                <ul className="space-y-4 mb-10">
                  {["Inactivity trigger system", "9-month safety window", "Confirmation emails", "Secure legacy delivery"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                      <CheckCircle2 className="text-rose-500" size={18} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white py-6" onClick={() => navigate('/signup')}>
                  Start Death Vault
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
            <div className="relative z-10 max-w-3xl mx-auto">
              <h3 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">Ready to preserve your legacy today?</h3>
              <p className="text-xl text-slate-400 mb-12 leading-relaxed">
                Join thousands of users who trust Life Vault with their most precious memories. Start your journey for free.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate('/signup')} className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-10 py-7 font-bold">
                  Create Your Account
                </Button>
                <Button size="lg" variant="outline" className="text-white border-slate-700 hover:bg-slate-800 text-lg px-10 py-7">
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="text-white" size={18} />
                </div>
                <span className="text-lg font-bold tracking-tight text-slate-900">Life Vault</span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                The world's most secure platform for digital legacy and memory preservation.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Product</h4>
              <ul className="space-y-4 text-slate-500">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Company</h4>
              <ul className="space-y-4 text-slate-500">
                <li><a href="#" className="hover:text-blue-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Support</h4>
              <ul className="space-y-4 text-slate-500">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm">&copy; 2026 Life Vault. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors"><Globe size={20} /></a>
              <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors"><MessageSquare size={20} /></a>
              <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors"><Users size={20} /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
