import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/authFetch';
import { safeJsonParse } from '@/lib/apiHelpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LogOut, Clock, User, Trash2, Calendar, TrendingUp, 
  Award, BarChart3, Sun, Moon, Layout, Grid, List,
  Zap, Target, Flame, Shield, Heart, Share2, Bell,
  ChevronRight, Plus, Settings, HelpCircle, Inbox
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [nextScheduled, setNextScheduled] = useState(null);
  const [inactivityStatus, setInactivityStatus] = useState(null);
  const [stats, setStats] = useState({
    totalMemories: 0,
    deliveredMemories: 0,
    activeVaults: 3,
    daysUntilNext: 0
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch dashboard data
  useEffect(() => {
    fetchNextScheduled();
    fetchInactivityStatus();
    // Mock stats for now - in a real app, these would come from an API
    setStats({
      totalMemories: 12,
      deliveredMemories: 5,
      activeVaults: 3,
      daysUntilNext: 4
    });
  }, []);

  const fetchNextScheduled = async () => {
    try {
      const response = await authFetch('/api/next-scheduled');
      const data = await safeJsonParse(response);
      if (data.success) {
        setNextScheduled(data.scheduling);
      }
    } catch (err) {
      console.error('Failed to fetch next scheduled:', err);
    }
  };

  const fetchInactivityStatus = async () => {
    try {
      const response = await authFetch('/api/inactivity-status');
      const data = await safeJsonParse(response);
      if (data.success) {
        setInactivityStatus(data.status);
      }
    } catch (err) {
      console.error('Failed to fetch inactivity status:', err);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar / Navigation */}
      <div className="flex">
        <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-card border-r border-border p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="text-primary-foreground" size={24} />
            </div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Life Vault</h1>
          </div>

          <nav className="flex-1 space-y-1">
            <Button variant="ghost" className="w-full justify-start gap-3 text-primary bg-primary/10 hover:bg-primary/20" onClick={() => navigate('/dashboard')}>
              <Layout size={20} /> Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-foreground hover:bg-muted" onClick={() => navigate('/present-vault')}>
              <Calendar size={20} /> Present Vault
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-foreground hover:bg-muted" onClick={() => navigate('/future-vault')}>
              <Clock size={20} /> Future Vault
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-foreground hover:bg-muted" onClick={() => navigate('/death-vault')}>
              <Heart size={20} /> Death Vault
            </Button>
            <div className="pt-4 pb-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3">Account</p>
            </div>
            <Button variant="ghost" className="w-full justify-start gap-3 text-foreground hover:bg-muted" onClick={() => navigate('/profile')}>
              <User size={20} /> Profile
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-foreground hover:bg-muted">
              <Settings size={20} /> Settings
            </Button>
          </nav>

          <div className="mt-auto pt-6 border-t border-border">
            <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={logout}>
              <LogOut size={20} /> Logout
            </Button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-auto">
          {/* Header */}
          <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="lg:hidden flex items-center gap-3">
                <Shield className="text-primary" size={28} />
                <span className="font-bold text-lg">Life Vault</span>
              </div>
              
              <div className="hidden lg:block">
                <h2 className="text-lg font-semibold text-foreground">Welcome back, {user?.name?.split(' ')[0]}!</h2>
              </div>

              <div className="flex items-center gap-4">
                <button className="p-2 text-muted-foreground hover:text-foreground transition-colors relative">
                  <Bell size={20} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <div className="h-8 w-px bg-border mx-1"></div>
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/profile')}>
                  <div className="w-8 h-8 rounded-full accent-gradient flex items-center justify-center text-white font-medium text-sm">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-foreground">{user?.name}</span>
                </div>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Inactivity Warning */}
            {inactivityStatus?.isInactive && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mb-8"
              >
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    <Bell size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-amber-900">Inactivity Warning</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      We haven't seen you in a while. Please confirm you're still active to keep your Death Vault safe.
                      {inactivityStatus.confirmationStatus && (
                        <span className="font-bold ml-1">
                          {inactivityStatus.confirmationStatus.daysRemaining} days remaining.
                        </span>
                      )}
                    </p>
                  </div>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => navigate('/profile')}>
                    Confirm Now
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Stats Grid */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
            >
              <motion.div variants={itemVariants}>
                <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Share2 size={20} />
                      </div>
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+2 this month</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Total Memories</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalMemories}</h3>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-green-50 rounded-lg text-green-600">
                        <Target size={20} />
                      </div>
                      <span className="text-xs font-medium text-slate-400">82% success rate</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Delivered</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.deliveredMemories}</h3>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                        <Shield size={20} />
                      </div>
                      <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">All Secure</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Active Vaults</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.activeVaults}</h3>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Calendar size={20} />
                      </div>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        {nextScheduled ? 'Scheduled' : 'None'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Next Scheduled</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">
                      {nextScheduled ? new Date(nextScheduled.scheduledDate).getDate() : '--'}
                    </h3>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Vaults Section */}
              <div className="lg:col-span-2 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">Your Vaults</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Present Vault */}
                  <motion.div whileHover={{ y: -4 }} className="cursor-pointer" onClick={() => navigate('/present-vault')}>
                    <Card className="border-none shadow-sm bg-white overflow-hidden group">
                      <div className="h-2 bg-emerald-500"></div>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <Calendar size={20} />
                          </div>
                          <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                        </div>
                        <CardTitle className="text-lg mt-4">Present Vault</CardTitle>
                        <CardDescription>Memories for the near future</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          Store and schedule memories to share with loved ones within the next 30 days.
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Future Vault */}
                  <motion.div whileHover={{ y: -4 }} className="cursor-pointer" onClick={() => navigate('/future-vault')}>
                    <Card className="border-none shadow-sm bg-white overflow-hidden group">
                      <div className="h-2 bg-blue-500"></div>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Clock size={20} />
                          </div>
                          <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <CardTitle className="text-lg mt-4">Future Vault</CardTitle>
                        <CardDescription>Long-term memory planning</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          Plan ahead with memories scheduled for delivery up to 9 months in advance.
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Death Vault */}
                  <motion.div whileHover={{ y: -4 }} className="cursor-pointer md:col-span-2" onClick={() => navigate('/death-vault')}>
                    <Card className="border-none shadow-sm bg-white overflow-hidden group">
                      <div className="h-2 bg-rose-500"></div>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                            <Heart size={20} />
                          </div>
                          <ChevronRight size={18} className="text-slate-300 group-hover:text-rose-500 transition-colors" />
                        </div>
                        <CardTitle className="text-lg mt-4">Death Vault</CardTitle>
                        <CardDescription>Your ultimate legacy and messages for loved ones</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col md:flex-row md:items-center gap-6">
                        <p className="text-sm text-slate-500 leading-relaxed flex-1">
                          Leave important messages that will be delivered to your loved ones after 9 months of inactivity. This is your digital legacy, handled with the utmost care and security.
                        </p>
                        <div className="flex-shrink-0">
                          <Button className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-100">
                            Manage Legacy
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </div>

              {/* Sidebar Content */}
              <div className="space-y-8">
                {/* Memories Component */}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Memories</h3>
                  <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center justify-center py-10">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <Inbox size={32} className="text-slate-300" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-700 mb-2">No memories yet</h4>
                        <p className="text-sm text-slate-500 text-center max-w-xs">
                          Start creating vaults to add your precious memories.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                
                {/* Help Card */}
                <Card className="border-none shadow-sm bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden relative">
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                  <CardContent className="p-6 relative z-10">
                    <HelpCircle className="text-slate-400 mb-4" size={24} />
                    <h4 className="text-lg font-bold mb-2">Need help?</h4>
                    <p className="text-sm text-slate-400 mb-6">
                      Learn how to set up your digital legacy and ensure your memories live on.
                    </p>
                    <Button className="w-full bg-white text-slate-900 hover:bg-slate-100">
                      View Guide
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
