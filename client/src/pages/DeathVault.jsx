import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/authFetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Heart, Shield, ArrowLeft, Plus, Trash2, 
  Mail, User, ChevronRight, Loader2, AlertCircle,
  CheckCircle2, Info, Lock, Clock, Users, Archive,
  MessageSquare, ImageIcon, VideoIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DeathVault() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({
    name: '',
    recipientEmail: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [expandedSlot, setExpandedSlot] = useState(null);
  const [editingText, setEditingText] = useState(null);
  const [newText, setNewText] = useState({});
  const [uploadingMedia, setUploadingMedia] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [editingSlotName, setEditingSlotName] = useState('');
  const [activeTab, setActiveTab] = useState({});

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      fetchSlots();
    }
  }, [isAuthenticated, navigate, authLoading]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/vaults/death/slots');
      const data = await response.json();
      if (data.success) {
        setSlots(data.slots || []);
      } else {
        setError(data.message || 'Failed to fetch slots');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (slots.length >= 2) {
      setError('Maximum 2 slots allowed in Death Vault');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const response = await authFetch('/api/vaults/death/slots', {
        method: 'POST',
        body: JSON.stringify({ slotName: newSlot.name }),
      });
      const data = await response.json();
      if (data.success) {
        setShowAddSlot(false);
        setNewSlot({ name: '', recipientEmail: '' });
        fetchSlots();
      } else {
        setError(data.message || 'Failed to add slot');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this legacy slot?')) return;
    try {
      const response = await authFetch(`/api/slots/${slotId}`, {
        method: 'DELETE',
        body: JSON.stringify({ vaultType: 'death' }),
      });
      const data = await response.json();
      if (data.success) {
        fetchSlots();
      } else {
        setError(data.message || 'Failed to delete slot');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const addText = async (slotId, text) => {
    try {
      const response = await authFetch(`/api/slots/${slotId}/texts`, {
        method: 'POST',
        body: JSON.stringify({ content: text, vaultType: 'death' }),
      });
      const data = await response.json();
      if (data.success) {
        setSlots(slots.map(slot => 
          slot._id === slotId ? { ...slot, texts: [...(slot.texts || []), { _id: data.text._id, content: text, createdAt: new Date() }] } : slot
        ));
        setNewText({ ...newText, [slotId]: '' });
        setEditingText(null);
      } else {
        setError(data.message || 'Failed to add text');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const deleteText = async (slotId, textId) => {
    try {
      const response = await authFetch(`/api/slots/${slotId}/texts/${textId}`, {
        method: 'DELETE',
        body: JSON.stringify({ vaultType: 'death' }),
      });
      const data = await response.json();
      if (data.success) {
        setSlots(slots.map(slot => 
          slot._id === slotId ? { ...slot, texts: slot.texts.filter(t => t._id !== textId) } : slot
        ));
      } else {
        setError(data.message || 'Failed to delete text');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const updateText = async (slotId, textId, content) => {
    try {
      const response = await authFetch(`/api/slots/${slotId}/texts/${textId}`, {
        method: 'PUT',
        body: JSON.stringify({ content, vaultType: 'death' }),
      });
      const data = await response.json();
      if (data.success) {
        setSlots(slots.map(slot => 
          slot._id === slotId ? { ...slot, texts: slot.texts.map(t => t._id === textId ? { ...t, content } : t) } : slot
        ));
        setEditingText(null);
        setNewText({ ...newText, [slotId]: '' });
      } else {
        setError(data.message || 'Failed to update text');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const addMedia = async (slotId, file) => {
    try {
      setUploadingMedia(slotId);
      const formData = new FormData();
      formData.append('media', file);
      formData.append('vaultType', 'death');

      const response = await authFetch(`/api/slots/${slotId}/media`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setSlots(slots.map(slot => 
          slot._id === slotId ? { ...slot, media: [...(slot.media || []), { _id: data.media._id, url: data.media.url, type: data.media.type, uploadedAt: new Date() }] } : slot
        ));
      } else {
        setError(data.message || 'Failed to add media');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setUploadingMedia(null);
    }
  };

  const deleteMedia = async (slotId, mediaId) => {
    try {
      const response = await authFetch(`/api/slots/${slotId}/media/${mediaId}`, {
        method: 'DELETE',
        body: JSON.stringify({ vaultType: 'death' }),
      });
      const data = await response.json();
      if (data.success) {
        setSlots(slots.map(slot => 
          slot._id === slotId ? { ...slot, media: slot.media.filter(m => m._id !== mediaId) } : slot
        ));
      } else {
        setError(data.message || 'Failed to delete media');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading || authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 text-rose-600 animate-spin" />
        <p className="text-slate-500 font-medium">Opening Death Vault...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-slate-500 hover:text-slate-900">
            <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center text-white">
              <Heart size={18} />
            </div>
            <span className="font-bold text-slate-900">Death Vault</span>
          </div>
          {slots.length < 2 && (
            <Button 
              onClick={() => setShowAddSlot(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-100"
            >
              <Plus size={18} className="mr-2" /> New Legacy Slot
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Your Digital Legacy</h1>
          <p className="text-slate-500 mt-2">Messages and memories to be delivered after 9 months of inactivity.</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 text-sm font-medium">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <AnimatePresence>
          {showAddSlot && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-10 overflow-hidden"
            >
              <Card className="border-none shadow-xl bg-white ring-1 ring-slate-200">
                <CardHeader className="border-b border-slate-50">
                  <CardTitle className="text-lg">Create Legacy Slot</CardTitle>
                  <CardDescription>Designate a recipient for your final messages</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleAddSlot} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 ml-1">Slot Name (e.g., For Mom)</label>
                      <Input 
                        placeholder="e.g., Final Message to Family" 
                        value={newSlot.name}
                        onChange={(e) => setNewSlot({...newSlot, name: e.target.value})}
                        className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 ml-1">Recipient Email</label>
                      <Input 
                        type="email"
                        placeholder="recipient@example.com" 
                        value={newSlot.recipientEmail}
                        onChange={(e) => setNewSlot({...newSlot, recipientEmail: e.target.value})}
                        className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                        required
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                      <Button variant="ghost" type="button" onClick={() => setShowAddSlot(false)} className="text-slate-500">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting} className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8">
                        {submitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                        Create Legacy Slot
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {slots.length > 0 ? (
            slots.map((slot) => (
              <motion.div key={slot._id} variants={itemVariants}>
                <Card className="border-none shadow-sm bg-white hover:shadow-md transition-all group overflow-hidden">
                  <div className={`h-1.5 w-full ${slot.delivered ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${slot.delivered ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {slot.delivered ? <CheckCircle2 size={18} /> : <Lock size={18} />}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteSlot(slot._id)}
                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    <CardTitle className="text-lg mt-4 truncate">{slot.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1.5 mt-1">
                      <Mail size={14} /> {slot.scheduledEmail || 'No recipient set'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {/* Content Display Area */}
                    <div className={`flex-1 space-y-3 ${slot.delivered ? 'overflow-y-auto' : ''}`}>
                      {slot.texts && slot.texts.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-xs text-gray-600">Messages</h4>
                          <div className="space-y-1">
                            {slot.texts.map((text) => (
                              <div key={text._id} className="relative group bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200 h-24 flex flex-col justify-between hover:shadow-md transition-all duration-200">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="bg-blue-100 p-1.5 rounded-full">
                                      <MessageSquare className="text-blue-600" size={10} />
                                    </div>
                                    <p className="text-sm text-gray-700 flex-1 truncate">{text.content}</p>
                                  </div>
                                  {editingText === text._id && (
                                    <Button variant="ghost" size="sm" onClick={() => setEditingText(null)} className="text-gray-400 hover:text-gray-600">
                                      Done
                                    </Button>
                                  )}
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => deleteText(slot._id, text._id)} className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      
                      {slot.media && slot.media.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-xs text-gray-600">Media</h4>
                          <div className="grid grid-cols-3 gap-2">
                            {slot.media.map((media) => (
                              <div key={media._id} className="relative group">
                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                  {media.type === 'image' ? (
                                    <img 
                                      src={media.url} 
                                      alt={media.url}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : media.type === 'video' ? (
                                    <video 
                                      src={media.url} 
                                      controls
                                      className="w-full h-full object-cover"
                                    />
                                  ) : null}
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => deleteMedia(slot._id, media._id)} className="absolute top-2 right-2 bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                      {slot.texts.length === 0 && slot.media.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                          <div className="text-center">
                            <MessageSquare size={24} className="text-gray-400" />
                            <div className="text-gray-400 text-sm">No content yet</div>
                            <div className="text-gray-400 text-xs mt-1">Add content to schedule this slot</div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Shield size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No legacy slots yet</h3>
              <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                Create your first legacy slot for your most important messages.
              </p>
              {slots.length < 2 && (
                <Button 
                  onClick={() => setShowAddSlot(true)}
                  className="mt-8 bg-rose-600 hover:bg-rose-700 text-white font-bold px-8"
                >
                  Create Legacy Slot
                </Button>
              )}
            </div>
          )}
        </motion.div>

        {/* Security Card */}
        <Card className="mt-16 border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl"></div>
          <CardContent className="p-8 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center text-rose-400 flex-shrink-0">
                <Lock size={40} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-xl font-bold mb-2">Maximum Security Protocol</h4>
                <p className="text-slate-400 leading-relaxed">
                  The Death Vault is protected by our highest security standards. Content is only decrypted and delivered after our multi-stage inactivity verification process is complete. Your legacy is safe with us.
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                  <CheckCircle2 size={16} /> AES-256 Encryption
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                  <CheckCircle2 size={16} /> Multi-stage Verification
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                  <CheckCircle2 size={16} /> Secure Email Delivery
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
