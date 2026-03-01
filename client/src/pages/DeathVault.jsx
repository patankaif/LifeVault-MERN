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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
              
              let cardHeight = 'h-[420px]';
              if (totalItems > 3) cardHeight = 'h-[440px]';
              if (totalItems > 6) cardHeight = 'h-[500px]';
              if (totalItems > 9) cardHeight = 'h-[520px]';
              
              return (
                <motion.div key={slot._id} variants={itemVariants}>
                  <Card className={`${cardHeight} flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white`}>
                    <CardHeader className="flex flex-col items-center justify-center text-center pb-2 flex-shrink-0">
                      <div className="relative w-full">
                        {editingSlot === slot._id ? (
                          <Input 
                            value={editingSlotName}
                            onChange={e => setEditingSlotName(e.target.value)}
                            onBlur={() => updateSlotName(slot._id)}
                            onKeyDown={e => e.key === 'Enter' && updateSlotName(slot._id)}
                            className="text-xl font-bold text-center mb-2 border-2 border-blue-500"
                            autoFocus
                          />
                        ) : (
                          <CardTitle 
                            className={`text-xl font-bold text-center mb-2 ${slot.delivered ? '' : 'cursor-pointer hover:text-blue-600'}`} 
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
                        <div className="flex justify-center gap-2">
                          <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => setViewSlotModal(slot)}>
                            <Eye size={16} />
                          </Button>
                          {!slot.delivered && (
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteSlot(slot._id)}>
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-sm mb-3">{slot.media?.length || 0} media, {slot.texts?.length || 0} texts</CardDescription>
                      
                      {slot.recipientEmail && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 w-full">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Mail size={16} className="text-blue-600" />
                              <div>
                                <p className="text-sm font-semibold text-blue-800">Recipient:</p>
                                <p className="text-lg font-bold text-blue-900">{slot.recipientEmail}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardHeader>
                    
                    <CardContent className="flex-1 p-4 flex flex-col overflow-hidden">
                      {/* Hidden file inputs */}
                      <input
                        key={`text-${slot._id}`}
                        id={`text-input-${slot._id}`}
                        type="text"
                        className="sr-only"
                      />
                      <input
                        key={`img-${slot._id}`}
                        id={`image-input-${slot._id}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => addMedia(slot._id, e.target.files?.[0])}
                        className="sr-only"
                        ref={(el) => {
                          if (el) fileInputRefs.current[`image-${slot._id}`] = el;
                        }}
                      />
                      <input
                        key={`vid-${slot._id}`}
                        id={`video-input-${slot._id}`}
                        type="file"
                        accept="video/*"
                        onChange={(e) => addMedia(slot._id, e.target.files?.[0])}
                        className="sr-only"
                        ref={(el) => {
                          if (el) fileInputRefs.current[`video-${slot._id}`] = el;
                        }}
                      />

                      {/* Content Display Area */}
                      <div className="flex-1 space-y-3 overflow-y-auto pb-3 max-h-64 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                        {texts.slice(0, 8).map((text) => (
                          <div key={text._id} className="relative group bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-slate-200 hover:shadow-sm transition-all duration-200 hover:border-slate-300">
                            <div className="flex items-start gap-3 mb-2">
                              <div className="bg-blue-100 p-2 rounded-full flex-shrink-0 mt-0.5">
                                <MessageSquare className="text-blue-600" size={14} />
                              </div>
                              <p className="text-sm text-slate-700 flex-1 break-words line-clamp-2 leading-relaxed">
                                {text.content}
                              </p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>{new Date(text.createdAt).toLocaleDateString()}</span>
                              {!slot.delivered && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => deleteText(slot._id, text._id)}
                                  className="text-red-600 hover:bg-red-50 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}

                        {media.slice(0, 8).map((item) => (
                          <div key={item._id} className="relative group rounded-xl overflow-hidden border-2 border-slate-200 hover:border-slate-300 transition-all">
                            <div className="aspect-video w-full bg-slate-100">
                              {item.type === 'image' ? (
                                <img 
                                  src={item.url} 
                                  alt="Uploaded media"
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : item.type === 'video' ? (
                                <video 
                                  src={item.url} 
                                  className="w-full h-full object-cover"
                                  muted
                                  preload="metadata"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-200">
                                  <ImageIcon size={32} className="text-slate-400" />
                                </div>
                              )}
                            </div>
                            {!slot.delivered && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => deleteMedia(slot._id, item._id)}
                                className="absolute top-2 right-2 bg-red-600/90 text-white hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-all h-7 w-7 p-0 backdrop-blur-sm"
                              >
                                <Trash2 size={14} />
                              </Button>
                            )}
                            {item.filename && (
                              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.filename}
                              </div>
                            )}
                          </div>
                        ))}

                        {totalItems > 16 && (
                          <div className="h-20 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center text-center">
                            <div className="text-sm text-slate-500 font-medium">
                              +{totalItems - 16} more items
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Add Content Buttons */}
                      {!slot.delivered && (
                        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-200 mt-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              const input = document.getElementById(`text-input-${slot._id}`);
                              if (input) {
                                input.focus();
                                setNewText(prev => ({ ...prev, [slot._id]: '' }));
                              }
                              setExpandedSlot(expandedSlot === slot._id ? null : slot._id);
                            }}
                            className="text-xs h-11 border-slate-200 hover:bg-slate-50"
                          >
                            <MessageSquare size={16} className="mr-2" /> Text
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => document.getElementById(`image-input-${slot._id}`)?.click()}
                            className="text-xs h-11 border-slate-200 hover:bg-slate-50"
                          >
                            <ImageIcon size={16} className="mr-2" /> Photo
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => document.getElementById(`video-input-${slot._id}`)?.click()}
                            className="text-xs h-11 border-slate-200 hover:bg-slate-50"
                          >
                            <VideoIcon size={16} className="mr-2" /> Video
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
