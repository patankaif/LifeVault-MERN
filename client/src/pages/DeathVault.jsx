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
  MessageSquare, ImageIcon, VideoIcon, Eye, AlertTriangle,
  Calendar, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DeathVault() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
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
      
      // Fetch slots
      const response = await authFetch('/api/vaults/death/slots');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch slots');
      }
      const data = await response.json();
      setSlots(data.slots || []);
      
      // Fetch rules acceptance status
      try {
        const rulesResponse = await authFetch('/api/vaults/death/rules-status');
        if (rulesResponse.ok) {
          const rulesData = await rulesResponse.json();
          setRulesAccepted(rulesData.rulesAccepted || false);
        }
      } catch (rulesErr) {
        // If endpoint doesn't exist yet, assume rules not accepted
        setRulesAccepted(false);
      }
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
    
    // Check if rules have been accepted (only for first slot)
    if (slots.length === 0 && !rulesAccepted) {
      setShowRulesModal(true);
      return;
    }
    
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

  const handleRulesAcceptance = async () => {
    try {
      const response = await authFetch('/api/vaults/death/accept-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setRulesAccepted(true);
        setShowRulesModal(false);
        // Proceed with slot creation after rules acceptance
        handleAddSlot(new Event('submit'));
      } else {
        setError(data.message || 'Failed to accept rules');
      }
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Your Digital Legacy</h1>
              <p className="text-slate-500 mt-2">Messages and memories to be delivered after 9 months of inactivity.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowRulesModal(true)}
              className="flex items-center gap-2 border-rose-200 text-rose-600 hover:bg-rose-50"
            >
              <FileText size={16} />
              Death Vault Rules
            </Button>
          </div>
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

      {/* Recipient Email Display - Prominent Red */}
      {slot.recipientEmail && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 mb-3 w-full">
          <div className="flex items-center gap-2 justify-center">
            <Mail size={16} className="text-red-600" />
            <div>
              <p className="text-xs font-semibold text-red-700">
                Recipient Email
              </p>
              <p className="text-base font-bold text-red-600">
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

      {/* Death Vault Rules Modal */}
      <AnimatePresence>
        {showRulesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            onClick={() => setShowRulesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 500 }}
              className="bg-white rounded-3xl max-w-4xl max-h-[90vh] w-full overflow-hidden shadow-2xl border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 border-b border-slate-200 bg-gradient-to-r from-rose-50 to-red-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <Shield className="text-rose-600" size={32} />
                    Death Vault Rules & Conditions
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRulesModal(false)}
                    className="h-10 w-10 p-0 text-slate-500 hover:bg-slate-200 rounded-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
                <p className="text-slate-600 mt-2">Please read and accept these important rules before creating your legacy slots</p>
              </div>
              
              <div className="max-h-96 overflow-y-auto p-8">
                <div className="space-y-6">
                  {/* Core Concept */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
                      <Clock size={20} /> Core Concept
                    </h3>
                    <p className="text-blue-800 leading-relaxed">
                      Death Vault is your legacy storage system. Messages and memories are only delivered after <strong>9 months of confirmed inactivity</strong>. 
                      This ensures your final thoughts reach loved ones when you can no longer communicate yourself.
                    </p>
                  </div>

                  {/* Inactivity Detection */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-amber-900 mb-3 flex items-center gap-2">
                      <AlertCircle size={20} /> Inactivity Detection
                    </h3>
                    <ul className="text-amber-800 space-y-2">
                      <li>• <strong>9-month waiting period</strong> after your last login/activity</li>
                      <li>• <strong>Automatic detection</strong> through system monitoring</li>
                      <li>• <strong>No manual activation</strong> - completely automated</li>
                      <li>• <strong>Activity resets timer</strong> - Any login counts as activity</li>
                    </ul>
                  </div>

                  {/* Confirmation Email */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-green-900 mb-3 flex items-center gap-2">
                      <Mail size={20} /> Confirmation Email System
                    </h3>
                    <ul className="text-green-800 space-y-2">
                      <li>• <strong>15 days before delivery</strong> (after ~8.5 months of inactivity)</li>
                      <li>• <strong>System asks "Are you still alive?"</strong> via email</li>
                      <li>• <strong>15-day response window</strong> to confirm you're active</li>
                      <li>• <strong>If no response → Data delivery proceeds</strong></li>
                      <li>• <strong>If you respond → Timer resets to 9 months</strong></li>
                    </ul>
                  </div>

                  {/* Content Rules */}
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-purple-900 mb-3 flex items-center gap-2">
                      <MessageSquare size={20} /> Content Storage Rules
                    </h3>
                    <ul className="text-purple-800 space-y-2">
                      <li>• <strong>Messages (texts)</strong>: Final thoughts, memories, goodbyes</li>
                      <li>• <strong>Media</strong>: Photos and videos for your loved ones</li>
                      <li>• <strong>Organized by slots</strong>: Different recipients for different content</li>
                      <li>• <strong>File size limit</strong>: 10MB per media file</li>
                      <li>• <strong>Supported formats</strong>: JPEG, PNG, GIF, WebP, MP4, QuickTime</li>
                    </ul>
                  </div>

                  {/* Security Features */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Lock size={20} /> Security Features
                    </h3>
                    <ul className="text-slate-800 space-y-2">
                      <li>• <strong>AES-256 encryption</strong> for all content</li>
                      <li>• <strong>Zero-knowledge architecture</strong></li>
                      <li>• <strong>Secure email delivery</strong></li>
                      <li>• <strong>Access tokens</strong> with expiration</li>
                      <li>• <strong>Backup email services</strong> if primary fails</li>
                    </ul>
                  </div>

                  {/* Important Warnings */}
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-red-900 mb-3 flex items-center gap-2">
                      <AlertTriangle size={20} /> Important Warnings
                    </h3>
                    <ul className="text-red-800 space-y-2">
                      <li>• <strong>NOT a will replacement</strong> - consult lawyers for legal documents</li>
                      <li>• <strong>NOT emergency messaging</strong> - 9-month delay is significant</li>
                      <li>• <strong>NOT guaranteed delivery</strong> - depends on email service reliability</li>
                      <li>• <strong>Test email addresses</strong> before finalizing recipients</li>
                      <li>• <strong>Keep content updated</strong> while you're active</li>
                    </ul>
                  </div>

                  {/* Lifecycle */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-indigo-900 mb-3 flex items-center gap-2">
                      <Calendar size={20} /> Process Lifecycle
                    </h3>
                    <div className="text-indigo-800 space-y-2">
                      <div><strong>1. Create Slot</strong> → Add recipient email</div>
                      <div><strong>2. Add Content</strong> → Upload messages and media</div>
                      <div><strong>3. Stay Active</strong> → Regular login keeps timer reset</div>
                      <div><strong>4. Inactivity Period</strong> → 9 months without activity</div>
                      <div><strong>5. Confirmation Email</strong> → "Are you still alive?" (15 days)</div>
                      <div><strong>6. Final Delivery</strong> → Email sent to recipient</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="rules-accept"
                      checked={rulesAccepted}
                      onChange={(e) => setRulesAccepted(e.target.checked)}
                      className="w-5 h-5 text-rose-600 border-rose-300 rounded focus:ring-rose-500"
                    />
                    <label htmlFor="rules-accept" className="text-slate-700 font-medium">
                      I have read, understood, and accept all Death Vault rules and conditions
                    </label>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowRulesModal(false)}
                      className="border-slate-300 text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRulesAcceptance}
                      disabled={!rulesAccepted}
                      className="bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Accept & Continue
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
