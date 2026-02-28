import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/authFetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Heart, Shield, ArrowLeft, Plus, Trash2, 
  Mail, User, ChevronRight, Loader2, AlertCircle,
  CheckCircle2, Info, Lock, Clock, Users, Archive,
  MessageSquare, ImageIcon, VideoIcon, Eye
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
  const [viewSlotModal, setViewSlotModal] = useState(null);

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slotName: newSlot.name,
          recipientEmail: newSlot.recipientEmail
        }),
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
        headers: {
          'Content-Type': 'application/json',
        },
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

  const handleAddText = async (slotId) => {
    const textContent = newText[slotId];
    if (!textContent || textContent.trim() === '') return;

    try {
      const response = await authFetch(`/api/slots/${slotId}/texts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: textContent, vaultType: 'death' }),
      });
      const data = await response.json();
      if (data.success) {
        const newTextObj = {
          _id: data.text?._id || Date.now().toString(),
          content: textContent,
          createdAt: new Date().toISOString()
        };
        setSlots(prev =>
          prev.map(slot =>
            slot._id === slotId
              ? { ...slot, texts: [...(slot.texts || []), newTextObj] }
              : slot
          )
        );
        setNewText({ ...newText, [slotId]: '' });
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
        headers: {
          'Content-Type': 'application/json',
        },
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
        headers: {
          'Content-Type': 'application/json',
        },
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
    if (!file) return;
    try {
      setUploadingMedia(slotId);
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (!e.target?.result) return;
        const base64 = e.target.result.split(',')[1];
        const mediaType = file.type.startsWith('image') ? 'image' : 'video';
        
        try {
          const response = await authFetch(`/api/slots/${slotId}/media`, {
            method: 'POST',
            body: JSON.stringify({ file: base64, mediaType }),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Upload failed:', errorText);
            // Provide better error messages based on status code
            let errorMessage = `Upload failed: ${response.status}`;
            if (response.status === 413) {
              errorMessage = 'File too large - please upload a smaller file';
            } else if (response.status === 415) {
              errorMessage = 'Unsupported file type - please upload images or videos only';
            } else if (response.status === 429) {
              errorMessage = 'Too many upload attempts - please wait and try again';
            } else if (response.status >= 500) {
              errorMessage = 'Server error - please try again later';
            }
            setError(errorMessage);
          } else {
            const data = await response.json();
            setSlots(slots.map(slot => 
              slot._id === slotId ? { ...slot, media: [...(slot.media || []), { 
                _id: data.media._id, 
                url: data.media.url, 
                type: data.media.type, 
                uploadedAt: new Date() 
              }] } : slot
            ));
          }
        } catch (uploadError) {
          console.error('Upload processing error:', uploadError);
          setError('Upload failed - please try again');
        }
      };
      reader.readAsDataURL(file);
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
        headers: {
          'Content-Type': 'application/json',
        },
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

  const updateSlotName = async (slotId) => {
    try {
      const response = await authFetch(`/api/slots/${slotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: editingSlotName,
          vaultType: 'death' 
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSlots(slots.map(slot => 
          slot._id === slotId ? { ...slot, name: editingSlotName } : slot
        ));
        setEditingSlot(null);
        setEditingSlotName('');
      } else {
        setError(data.message || 'Failed to update slot name');
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
                <Card className={`flex flex-col overflow-hidden h-[500px] ${slot.delivered ? 'ring-2 ring-emerald-200 bg-emerald-50/50' : ''}`}>
                  <div className={`h-1 w-full ${slot.delivered ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  <CardHeader className="flex-shrink-0 p-4 pb-2">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-lg ${slot.delivered ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {slot.delivered ? <CheckCircle2 size={18} /> : <Lock size={18} />}
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setViewSlotModal(slot)}
                          className="text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                        >
                          <Eye size={16} />
                        </Button>
                        {!slot.delivered && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteSlot(slot._id)}
                            className="text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-lg font-bold text-center truncate">{slot.name}</CardTitle>
                    <CardDescription className="flex items-center justify-center gap-1.5 text-sm mt-1">
                      <Mail size={14} /> {slot.recipientEmail}
                    </CardDescription>
                    <p className="text-xs text-gray-500 text-center mt-1">
                      {slot.texts?.length || 0} texts, {slot.media?.length || 0} media
                    </p>
                  </CardHeader>
                  
                  <CardContent className="flex-1 p-4 flex flex-col overflow-hidden">
                    {/* Hidden file inputs */}
                    <input
                      id={`text-input-${slot._id}`}
                      type="text"
                      className="hidden"
                    />
                    <input
                      id={`image-input-${slot._id}`}
                      type="file"
                      accept="image/*"
                      onChange={e => addMedia(slot._id, e.target.files?.[0])}
                      className="hidden"
                    />
                    <input
                      id={`video-input-${slot._id}`}
                      type="file"
                      accept="video/*"
                      onChange={e => addMedia(slot._id, e.target.files?.[0])}
                      className="hidden"
                    />

                    {/* Content Display Area */}
                    <div className="flex-1 space-y-3 overflow-y-auto pb-2">
                      {slot.texts && slot.texts.slice(0, 6).map((text) => (
                        <div key={text._id} className="relative group bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
                          <div className="flex items-start gap-2 mb-2">
                            <div className="bg-blue-100 p-1.5 rounded-full flex-shrink-0">
                              <MessageSquare className="text-blue-600" size={12} />
                            </div>
                            <p className="text-sm text-gray-700 flex-1 break-words line-clamp-3">{text.content}</p>
                          </div>
                          {!slot.delivered && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => deleteText(slot._id, text._id)}
                              className="absolute top-2 right-2 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            >
                              <Trash2 size={12} />
                            </Button>
                          )}
                        </div>
                      ))}

                      {slot.media && slot.media.slice(0, 6).map((media) => (
                        <div key={media._id} className="relative group">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                            {media.type === 'image' ? (
                              <img 
                                src={media.url} 
                                alt="Media"
                                className="w-full h-full object-cover"
                              />
                            ) : media.type === 'video' ? (
                              <video 
                                src={media.url} 
                                className="w-full h-full object-cover"
                                muted
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                <ImageIcon size={24} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          {!slot.delivered && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => deleteMedia(slot._id, media._id)}
                              className="absolute top-1 right-1 bg-red-600 text-white hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            >
                              <Trash2 size={12} />
                            </Button>
                          )}
                        </div>
                      ))}

                      {((slot.texts?.length || 0) + (slot.media?.length || 0)) > 12 && (
                        <div className="h-16 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
                          <div className="text-center text-xs text-gray-500">
                            +{((slot.texts?.length || 0) + (slot.media?.length || 0)) - 12} more items
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Add Content Buttons */}
                    {!slot.delivered && (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setExpandedSlot(expandedSlot === slot._id ? null : slot._id);
                            setTimeout(() => {
                              const textarea = document.getElementById(`text-input-${slot._id}`);
                              if (textarea) {
                                textarea.focus();
                                setNewText({ ...newText, [slot._id]: '' });
                              }
                            }, 100);
                          }}
                          className="text-xs h-10"
                        >
                          <MessageSquare size={14} className="mr-1" /> Text
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => document.getElementById(`image-input-${slot._id}`)?.click()}
                          className="text-xs h-10"
                        >
                          <ImageIcon size={14} className="mr-1" /> Image
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => document.getElementById(`video-input-${slot._id}`)?.click()}
                          className="text-xs h-10"
                        >
                          <VideoIcon size={14} className="mr-1" /> Video
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <motion.div 
              variants={itemVariants}
              className="col-span-full flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm"
            >
              <Shield className="w-24 h-24 text-gray-300 mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Legacy Slots</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Create your first legacy slot to store messages and memories for your loved ones.
              </p>
              <Button 
                onClick={() => setShowAddSlot(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-12 h-12 shadow-lg shadow-rose-100"
              >
                <Plus size={20} className="mr-2" /> Create First Legacy Slot
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* View Slot Modal */}
        <AnimatePresence>
          {viewSlotModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setViewSlotModal(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-2xl max-h-[90vh] w-full overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">{viewSlotModal.name}</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewSlotModal(null)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{viewSlotModal.recipientEmail}</p>
                </div>
                <div className="max-h-96 overflow-y-auto p-6">
                  {/* Full content display would go here */}
                  <p className="text-gray-500">Full content preview coming soon...</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16"
        >
          <Card className="border-none shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl"></div>
            <CardContent className="p-8 relative z-10">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center text-rose-400 flex-shrink-0">
                  <Lock size={40} />
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <h4 className="text-xl font-bold mb-2">Maximum Security Protocol</h4>
                  <p className="text-slate-300 leading-relaxed">
                    The Death Vault uses enterprise-grade encryption and multi-stage verification. Your legacy is protected until our system confirms prolonged inactivity.
                  </p>
                </div>
                <div className="flex flex-col gap-3 w-full lg:w-auto text-sm">
                  <div className="flex items-center gap-2 font-medium text-emerald-400">
                    <CheckCircle2 size={16} /> AES-256 Encryption
                  </div>
                  <div className="flex items-center gap-2 font-medium text-emerald-400">
                    <CheckCircle2 size={16} /> 9-Month Inactivity Check
                  </div>
                  <div className="flex items-center gap-2 font-medium text-emerald-400">
                    <CheckCircle2 size={16} /> Secure Email Delivery
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
