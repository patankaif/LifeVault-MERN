import { useState, useEffect, useRef, useCallback } from 'react';
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
  const fileInputRefs = useRef({});

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
      setError('');
      const response = await authFetch('/api/vaults/death/slots');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch slots');
      }
      const data = await response.json();
      setSlots(data.slots || []);
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateSlotName = async (slotId) => {
    if (!editingSlotName.trim()) return;
    try {
      const response = await authFetch(`/api/slots/${slotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingSlotName.trim(), vaultType: 'death' }),
      });
      const data = await response.json();
      if (data.success) {
        setSlots(prev => prev.map(slot => 
          slot._id === slotId ? { ...slot, name: editingSlotName.trim() } : slot
        ));
        setEditingSlot(null);
        setEditingSlotName('');
      } else {
        setError(data.message || 'Failed to update slot name');
      }
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (slots.length >= 2) {
      setError('Maximum 2 slots allowed in Death Vault');
      return;
    }
    if (!newSlot.name.trim() || !newSlot.recipientEmail.trim()) {
      setError('Please fill in both fields');
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
          slotName: newSlot.name.trim(),
          recipientEmail: newSlot.recipientEmail.trim()
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
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this legacy slot? This action cannot be undone.')) return;
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
      setError(err.message || 'Network error. Please try again.');
    }
  };

  const handleAddText = useCallback(async (slotId) => {
    const textContent = newText[slotId];
    if (!textContent || textContent.trim() === '') return;

    try {
      const response = await authFetch(`/api/slots/${slotId}/texts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: textContent.trim(), vaultType: 'death' }),
      });
      const data = await response.json();
      if (data.success && data.text) {
        const newTextObj = {
          _id: data.text._id,
          content: textContent.trim(),
          createdAt: new Date().toISOString()
        };
        setSlots(prev =>
          prev.map(slot =>
            slot._id === slotId
              ? { ...slot, texts: [...(slot.texts || []), newTextObj] }
              : slot
          )
        );
        setNewText(prev => ({ ...prev, [slotId]: '' }));
      } else {
        setError(data.message || 'Failed to add text');
      }
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
    }
  }, [newText]);

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
        setSlots(prev => prev.map(slot => 
          slot._id === slotId 
            ? { ...slot, texts: (slot.texts || []).filter(t => t._id !== textId) } 
            : slot
        ));
      } else {
        setError(data.message || 'Failed to delete text');
      }
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
    }
  };

  const updateText = async (slotId, textId, content) => {
    if (!content.trim()) return;
    try {
      const response = await authFetch(`/api/slots/${slotId}/texts/${textId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content.trim(), vaultType: 'death' }),
      });
      const data = await response.json();
      if (data.success) {
        setSlots(prev => prev.map(slot => 
          slot._id === slotId 
            ? { ...slot, texts: (slot.texts || []).map(t => t._id === textId ? { ...t, content: content.trim() } : t) } 
            : slot
        ));
        setEditingText(null);
      } else {
        setError(data.message || 'Failed to update text');
      }
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
    }
  };

  const addMedia = async (slotId, file) => {
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      setError('Unsupported file type. Please upload JPEG, PNG, GIF, WebP images or MP4 videos.');
      return;
    }

    try {
      setUploadingMedia(slotId);
      setError('');
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (!e.target?.result) return;
        
        const base64 = e.target.result.split(',')[1];
        const mediaType = file.type.startsWith('image') ? 'image' : 'video';
        
        try {
          const response = await authFetch(`/api/slots/${slotId}/media`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              file: base64, 
              mediaType,
              filename: file.name 
            }),
          });
          
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            let errorMessage = data.message || `Upload failed: ${response.status}`;
            
            if (response.status === 413) {
              errorMessage = 'File too large - maximum 10MB';
            } else if (response.status === 415) {
              errorMessage = 'Unsupported file type';
            }
            setError(errorMessage);
            return;
          }
          
          const data = await response.json();
          setSlots(prev => prev.map(slot => 
            slot._id === slotId 
              ? { ...slot, media: [...(slot.media || []), { 
                  _id: data.media._id, 
                  url: data.media.url, 
                  type: data.media.type, 
                  uploadedAt: new Date().toISOString(),
                  filename: file.name
                }] } 
              : slot
          ));
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          setError('Upload failed. Please try again.');
        } finally {
          setUploadingMedia(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Network error. Please try again.');
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
        setSlots(prev => prev.map(slot => 
          slot._id === slotId 
            ? { ...slot, media: (slot.media || []).filter(m => m._id !== mediaId) } 
            : slot
        ));
      } else {
        setError(data.message || 'Failed to delete media');
      }
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
    }
  };

  const handleTextInputKeyDown = (e, slotId) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddText(slotId);
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

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-rose-600 animate-spin" />
          <p className="text-slate-500 font-medium">Opening Death Vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard')} 
            className="text-slate-500 hover:text-slate-900"
          >
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
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 text-sm font-medium"
          >
            <AlertCircle size={18} />
            {error}
          </motion.div>
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
                      <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => setShowAddSlot(false)} 
                        className="text-slate-500"
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={submitting || !newSlot.name.trim() || !newSlot.recipientEmail.trim()}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="animate-spin mr-2 h-4 w-4" />
                            Creating...
                          </>
                        ) : (
                          'Create Legacy Slot'
                        )}
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
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {slots.length === 0 ? (
            <Card className="md:col-span-2 lg:col-span-3 border-0 bg-gradient-to-br from-slate-50 to-rose-50 shadow-xl">
              <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 md:w-28 md:h-28 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center text-rose-300 flex-shrink-0 shadow-2xl mb-6">
                  <Lock className="w-12 h-12 md:w-14 md:h-14" />
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <h4 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                    Enterprise-Grade Security
                  </h4>
                  <p className="text-slate-300 leading-relaxed text-lg max-w-2xl mx-auto lg:mx-0">
                    Your legacy is protected with military-grade encryption and intelligent inactivity detection. 
                    Messages unlock only after 9 months of confirmed inactivity.
                  </p>
                </div>
                <div className="flex flex-col gap-4 w-full lg:w-auto text-sm lg:text-base mt-8">
                  <div className="flex items-center gap-3 font-semibold text-emerald-300 bg-emerald-500/10 p-3 rounded-xl backdrop-blur-sm">
                    <CheckCircle2 size={20} />
                    AES-256 Encryption
                  </div>
                  <div className="flex items-center gap-3 font-semibold text-emerald-300 bg-emerald-500/10 p-3 rounded-xl backdrop-blur-sm">
                    <CheckCircle2 size={20} />
                    9-Month Inactivity Detection
                  </div>
                  <div className="flex items-center gap-3 font-semibold text-emerald-300 bg-emerald-500/10 p-3 rounded-xl backdrop-blur-sm">
                    <CheckCircle2 size={20} />
                    Secure Email Delivery
                  </div>
                  <div className="flex items-center gap-3 font-semibold text-emerald-300 bg-emerald-500/10 p-3 rounded-xl backdrop-blur-sm">
                    <CheckCircle2 size={20} />
                    Zero-Knowledge Architecture
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            slots.map((slot) => {
              const texts = slot.texts || [];
              const media = slot.media || [];
              const totalItems = texts.length + media.length;
              
              let cardHeight = 'h-138';
              if (totalItems > 3) cardHeight = 'h-141';
              if (totalItems > 6) cardHeight = 'h-163';
              if (totalItems > 9) cardHeight = 'h-168';
              
              return (
                <motion.div key={slot._id} variants={itemVariants}>
                  <Card className={`flex flex-col overflow-hidden ${cardHeight}`}>
                    {/* HEADER */}
                    <CardHeader className="flex flex-col items-center justify-center text-center pb-2 flex-shrink-0">
      <div className="relative w-full">

        {/* Editable Title */}
        {editingSlot === slot._id ? (
          <Input
            value={editingSlotName}
            onChange={(e) => setEditingSlotName(e.target.value)}
            onBlur={() => updateSlotName(slot._id)}
            onKeyDown={(e) => e.key === 'Enter' && updateSlotName(slot._id)}
            className="text-xl font-bold text-center border-2 border-rose-500"
            autoFocus
          />
        ) : (
          <CardTitle
            className={`text-xl font-bold text-center ${
              slot.delivered ? '' : 'cursor-pointer hover:text-rose-600'
            }`}
            onClick={() => {
              if (!slot.delivered) {
                setEditingSlot(slot._id);
                setEditingSlotName(slot.name);
              }
            }}
          >
            {slot.name}
          </CardTitle>
        )}

        {/* Top Right Buttons */}
        <div className="absolute top-0 right-0 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-600"
            onClick={() => setViewSlotModal(slot)}
          >
            <Eye size={16} />
          </Button>

          {!slot.delivered && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600"
              onClick={() => handleDeleteSlot(slot._id)}
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </div>

      <CardDescription className="text-sm mb-3">
        {slot.media?.length || 0} media, {slot.texts?.length || 0} texts
      </CardDescription>

      {/* Recipient Block (FutureVault style but adapted) */}
      {slot.recipientEmail && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-3 w-full">
          <div className="flex items-center gap-2 justify-center">
            <Mail size={16} className="text-rose-600" />
            <div>
              <p className="text-xs font-semibold text-rose-700">
                Legacy Recipient
              </p>
              <p className="text-lg font-bold text-rose-900">
                {slot.recipientEmail}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Buttons Row */}
      {!slot.delivered && (
        <div className="grid grid-cols-3 gap-3 mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setExpandedSlot(
                expandedSlot === slot._id ? null : slot._id
              )
            }
            className="text-xs h-9"
          >
            <MessageSquare size={14} className="mr-1" /> Text
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              document
                .getElementById(`image-input-${slot._id}`)
                ?.click()
            }
            className="text-xs h-9"
          >
            <ImageIcon size={14} className="mr-1" /> Image
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              document
                .getElementById(`video-input-${slot._id}`)
                ?.click()
            }
            className="text-xs h-9"
          >
            <VideoIcon size={14} className="mr-1" /> Video
          </Button>
        </div>
      )}
    </CardHeader>

    {/* CONTENT AREA */}
    <CardContent className="flex-1 flex flex-col overflow-hidden p-4">

      {/* Hidden Inputs */}
      <input
        id={`image-input-${slot._id}`}
        type="file"
        accept="image/*"
        onChange={(e) => addMedia(slot._id, e.target.files?.[0])}
        className="hidden"
      />

      <input
        id={`video-input-${slot._id}`}
        type="file"
        accept="video/*"
        onChange={(e) => addMedia(slot._id, e.target.files?.[0])}
        className="hidden"
      />

      {/* Content Grid */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {slot.texts?.length || slot.media?.length ? (
          <div className="grid grid-cols-3 gap-2">
            
            {/* TEXTS */}
            {slot.texts?.slice(0, 9).map((t) => (
              <div
                key={t._id}
                className="relative group bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg border h-24"
              >
                <p className="text-xs line-clamp-3 break-all">
                  {t.content}
                </p>

                {!slot.delivered && (
                  <button
                    onClick={() =>
                      deleteText(slot._id, t._id)
                    }
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={10} className="text-red-500" />
                  </button>
                )}
              </div>
            ))}

            {/* MEDIA */}
            {slot.media?.slice(0, 9).map((m) => (
              <div
                key={m._id}
                className="relative group h-24 rounded-lg overflow-hidden border"
              >
                {m.type === 'image' ? (
                  <img
                    src={m.url}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={m.url}
                    className="w-full h-full object-cover"
                    muted
                  />
                )}

                {!slot.delivered && (
                  <button
                    onClick={() =>
                      deleteMedia(slot._id, m._id)
                    }
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={10} className="text-red-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Empty State (Future Style) */
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare
                size={24}
                className="text-gray-400"
              />
            </div>
            <p className="text-gray-400 text-sm">
              No content yet
            </p>
            <p className="text-gray-400 text-xs">
              Add memories for your legacy
            </p>
          </div>
        )}
      </div>

      {/* Expand Text Input */}
      {expandedSlot === slot._id && !slot.delivered && (
        <div className="mt-3 border-t pt-3 flex gap-2">
          <Input
            placeholder="Add a final message..."
            value={newText[slot._id] || ''}
            onChange={(e) =>
              setNewText({
                ...newText,
                [slot._id]: e.target.value,
              })
            }
            onKeyDown={(e) =>
              e.key === 'Enter' &&
              handleAddText(slot._id)
            }
          />
          <Button
            size="sm"
            onClick={() =>
              handleAddText(slot._id)
            }
          >
            Add
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
</motion.div>
              );
            })
          )}
        </motion.div>
      </main>
    </div>
  );
}
