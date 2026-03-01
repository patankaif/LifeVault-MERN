import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/authFetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  User, Mail, Shield, Bell, Clock, LogOut, 
  ArrowLeft, CheckCircle2, AlertCircle, Loader2,
  Settings, Lock, Key, Globe, Heart, Archive,
  FileText, Image as ImageIcon, Video, Send, Target, Star,
  Trash2, AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading, user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inactivityStatus, setInactivityStatus] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Delete account states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleteOTP, setDeleteOTP] = useState('');
  const [deleteStep, setDeleteStep] = useState(1); // 1: email, 2: otp, 3: confirm
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  const [futureSlotsCount, setFutureSlotsCount] = useState(0);
  const [presentSlotsCount, setPresentSlotsCount] = useState(0);
  const [memoryStats, setMemoryStats] = useState({
    totalMemories: 0,
    textCount: 0,
    imageCount: 0,
    videoCount: 0,
    scheduledDeliveries: 0,
    completedDeliveries: 0
  });
  const [legacyProgress, setLegacyProgress] = useState({
    level: 'Beginner',
    progress: 0,
    nextMilestone: 'Create 5 memories',
    memoriesToNext: 5
  });

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) return navigate('/login');
      fetchData();
    }
  }, [isAuthenticated, navigate, authLoading]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSlotCounts(),
      fetchInactivityStatus()
    ]);
    setLoading(false);
  };

  const fetchInactivityStatus = async () => {
    try {
      const response = await authFetch('/api/inactivity-status');
      const data = await response.json();
      if (data.success) {
        setInactivityStatus(data.status);
      }
    } catch (err) {
      console.error('Failed to fetch inactivity status:', err);
    }
  };

  const fetchSlotCounts = async () => {
    try {
      const [futureRes, presentRes] = await Promise.all([
        authFetch('/api/vaults/future/slots'),
        authFetch('/api/vaults/present/slots')
      ]);
      
      const futureData = await futureRes.json();
      const presentData = await presentRes.json();
      
      const futureSlots = futureData.success ? (futureData.slots || []) : [];
      const presentSlots = presentData.success ? (presentData.slots || []) : [];
      
      setFutureSlotsCount(futureSlots.length);
      setPresentSlotsCount(presentSlots.length);
      
      const allSlots = [...futureSlots, ...presentSlots];
      let textCount = 0, imageCount = 0, videoCount = 0;
      let scheduledDeliveries = 0, completedDeliveries = 0;
      
      allSlots.forEach(slot => {
        if (slot.texts) textCount += slot.texts.length;
        if (slot.media) {
          slot.media.forEach(media => {
            if (media.type === 'image') imageCount++;
            else if (media.type === 'video') videoCount++;
          });
        }
        if (slot.scheduledDate) {
          if (slot.delivered) completedDeliveries++;
          else scheduledDeliveries++;
        }
      });
      
      const totalMemories = textCount + imageCount + videoCount;
      let level, progress, nextMilestone, memoriesToNext;
      
      if (totalMemories < 5) {
        level = 'Beginner';
        progress = (totalMemories / 5) * 100;
        nextMilestone = 'Create 5 memories';
        memoriesToNext = 5 - totalMemories;
      } else if (totalMemories < 15) {
        level = 'Memory Keeper';
        progress = ((totalMemories - 5) / 10) * 100;
        nextMilestone = 'Create 15 memories';
        memoriesToNext = 15 - totalMemories;
      } else {
        level = 'Legacy Builder';
        progress = 100;
        nextMilestone = 'Maximum level achieved';
        memoriesToNext = 0;
      }
      
      setMemoryStats({
        totalMemories,
        textCount,
        imageCount,
        videoCount,
        scheduledDeliveries,
        completedDeliveries
      });
      
      setLegacyProgress({ level, progress, nextMilestone, memoriesToNext });
    } catch (err) {
      setError('Performance data unavailable');
    }
  };

  const handleConfirmAlive = async () => {
    setConfirming(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await authFetch('/api/confirm-alive', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Activity confirmed! Your legacy is safe.' });
        fetchInactivityStatus();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to confirm activity' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setConfirming(false);
    }
  };

  // Delete account functions
  const handleSendDeleteOTP = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    
    try {
      const response = await authFetch('/api/auth/send-delete-otp', {
        method: 'POST',
        body: JSON.stringify({ email: deleteEmail })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDeleteStep(2);
        setMessage({ type: 'success', text: 'OTP sent to your email. Please check your inbox.' });
      } else {
        setDeleteError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setDeleteError('Failed to send OTP. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleVerifyDeleteOTP = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    
    try {
      const response = await authFetch('/api/auth/verify-delete-otp', {
        method: 'POST',
        body: JSON.stringify({ 
          email: deleteEmail, 
          otp: deleteOTP 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDeleteStep(3);
      } else {
        setDeleteError(data.message || 'Invalid OTP');
      }
    } catch (err) {
      setDeleteError('Failed to verify OTP. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    
    try {
      const requestBody = { 
        email: deleteEmail, 
        otp: deleteOTP 
      };
      
      console.log('[Delete Account] Sending request:', requestBody);
      
      const response = await authFetch('/api/auth/delete-account', {
        method: 'DELETE',
        body: JSON.stringify(requestBody)
      });
      
      console.log('[Delete Account] Response status:', response.status);
      console.log('[Delete Account] Response headers:', response.headers);
      
      const data = await response.json();
      console.log('[Delete Account] Response data:', data);
      
      if (data.success) {
        setMessage({ type: 'success', text: 'Account deleted successfully.' });
        setShowDeleteModal(false);
        setTimeout(() => {
          logout();
          navigate('/');
        }, 2000);
      } else {
        console.log('[Delete Account] Error response:', data);
        setDeleteError(data.message || 'Failed to delete account');
      }
    } catch (err) {
      console.log('[Delete Account] Network error:', err);
      setDeleteError('Failed to delete account. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteStep(1);
    setDeleteEmail('');
    setDeleteOTP('');
    setDeleteError('');
  };

  if (loading || authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Syncing Profile...</p>
      </div>
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-slate-500 hover:text-slate-900">
            <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Shield size={18} />
            </div>
            <span className="font-bold text-slate-900">Profile Settings</span>
          </div>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              <CardContent className="pt-0 px-6 pb-6 relative">
                <div className="flex flex-col items-center -mt-12">
                  <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-3xl font-bold text-blue-600 shadow-lg">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-slate-900">{user?.name}</h2>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                  <div className="mt-6 w-full space-y-2">
                    <Button variant="outline" className="w-full justify-start gap-3 text-slate-600 border-slate-200 hover:bg-slate-50">
                      <User size={18} /> Edit Profile
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={logout}>
                      <LogOut size={18} /> Logout
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Target size={16} className="text-purple-600" /> Legacy Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-lg font-bold text-purple-600">{legacyProgress.level}</span>
                  <span className="text-xs text-slate-400">{Math.round(legacyProgress.progress)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full" style={{ width: `${legacyProgress.progress}%` }} />
                </div>
                <p className="text-xs text-slate-500">{legacyProgress.nextMilestone}</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
                <FileText className="mx-auto mb-2 text-blue-600" size={20} />
                <p className="text-xl font-bold text-slate-900">{memoryStats.textCount}</p>
                <p className="text-[10px] uppercase font-bold text-slate-400">Texts</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
                <ImageIcon className="mx-auto mb-2 text-emerald-600" size={20} />
                <p className="text-xl font-bold text-slate-900">{memoryStats.imageCount}</p>
                <p className="text-[10px] uppercase font-bold text-slate-400">Images</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
                <Video className="mx-auto mb-2 text-purple-600" size={20} />
                <p className="text-xl font-bold text-slate-900">{memoryStats.videoCount}</p>
                <p className="text-[10px] uppercase font-bold text-slate-400">Videos</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
                <Send className="mx-auto mb-2 text-amber-600" size={20} />
                <p className="text-xl font-bold text-slate-900">{memoryStats.scheduledDeliveries}</p>
                <p className="text-[10px] uppercase font-bold text-slate-400">Scheduled</p>
              </div>
            </div>

            {/* Inactivity Section */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                    <Heart size={20} />
                  </div>
                  <CardTitle className="text-lg">Activity Confirmation</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-slate-50 rounded-2xl p-6 mb-6 flex items-start gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Inactivity Window: 9 Months</h4>
                    <p className="text-sm text-slate-500 mt-1">
                      Your Death Vault triggers after 9 months of inactivity. We'll send a confirmation email first.
                    </p>
                  </div>
                </div>

                {inactivityStatus && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                      <span className="text-sm font-medium text-blue-900">Last Activity Detected</span>
                      <span className="text-sm font-bold text-blue-900">
                        {new Date(inactivityStatus.lastLogin).toLocaleDateString()}
                      </span>
                    </div>

                    {inactivityStatus.isInactive && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-sm text-amber-700 mb-4">
                          Action Required: Please confirm you're still active to keep your legacy safe.
                        </p>
                        <Button onClick={handleConfirmAlive} disabled={confirming} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                          {confirming ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                          Confirm I'm Active
                        </Button>
                      </div>
                    )}

                    {message.text && (
                      <div className={`p-4 rounded-xl text-sm font-medium ${
                        message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {message.text}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="border-b border-slate-50">
                <CardTitle className="text-lg">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                    <Input defaultValue={user?.name} className="bg-slate-50 border-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">Email Address</label>
                    <Input defaultValue={user?.email} disabled className="bg-slate-100 border-slate-200 text-slate-500" />
                  </div>
                </div>
                <div className="pt-4 flex justify-end">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8">
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Dangerous Actions */}
            <Card className="border-none shadow-sm bg-white border-red-100">
              <CardHeader className="border-b border-slate-50">
                <CardTitle className="text-lg text-red-600">Dangerous Actions</CardTitle>
                <CardDescription>
                  These actions are permanent and cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={20} />
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-800 mb-1">Delete Account Permanently</h4>
                        <p className="text-sm text-red-700 mb-3">
                          This will permanently delete your account, all memory slots, media files, and scheduled deliveries. This action cannot be undone.
                        </p>
                        <Button 
                          onClick={() => setShowDeleteModal(true)}
                          variant="destructive"
                          className="bg-red-600 hover:bg-red-700 text-white font-bold"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Delete My Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-xl text-red-600">Delete Account</CardTitle>
              <CardDescription>
                This action is permanent and cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 1: Email */}
              {deleteStep === 1 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Enter your email address
                  </label>
                  <Input 
                    type="email" 
                    placeholder="your@email.com" 
                    value={deleteEmail}
                    onChange={e => setDeleteEmail(e.target.value)}
                    className={deleteError ? 'border-red-500' : ''}
                  />
                  {deleteError && (
                    <p className="text-red-500 text-xs mt-1">{deleteError}</p>
                  )}
                </div>
              )}

              {/* Step 2: OTP */}
              {deleteStep === 2 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Enter the OTP sent to your email
                  </label>
                  <Input 
                    type="text" 
                    placeholder="123456" 
                    value={deleteOTP}
                    onChange={e => setDeleteOTP(e.target.value)}
                    className={deleteError ? 'border-red-500' : ''}
                    maxLength={6}
                  />
                  {deleteError && (
                    <p className="text-red-500 text-xs mt-1">{deleteError}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Check your email for the 6-digit OTP code.
                  </p>
                </div>
              )}

              {/* Step 3: Final Confirmation */}
              {deleteStep === 3 && (
                <div>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                    <h4 className="font-semibold text-red-800 mb-2">Final Warning</h4>
                    <p className="text-sm text-red-700 mb-2">
                      You are about to permanently delete:
                    </p>
                    <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                      <li>Your account and profile</li>
                      <li>All memory slots and their content</li>
                      <li>All uploaded media files</li>
                      <li>All scheduled deliveries</li>
                      <li>All account data and settings</li>
                    </ul>
                    <p className="text-sm text-red-800 font-semibold mt-3">
                      This action cannot be undone!
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {deleteStep === 1 && (
                  <>
                    <Button 
                      onClick={handleSendDeleteOTP}
                      disabled={!deleteEmail || deleteLoading}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      {deleteLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                      Send OTP
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={resetDeleteModal}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </>
                )}

                {deleteStep === 2 && (
                  <>
                    <Button 
                      onClick={handleVerifyDeleteOTP}
                      disabled={!deleteOTP || deleteLoading}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      {deleteLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                      Verify OTP
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={resetDeleteModal}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </>
                )}

                {deleteStep === 3 && (
                  <>
                    <Button 
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      {deleteLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                      Delete My Account
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={resetDeleteModal}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
