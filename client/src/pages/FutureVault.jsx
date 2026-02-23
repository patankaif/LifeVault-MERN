import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/authFetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, Shield, ArrowLeft, Plus, Trash2, 
  Mail, User, ChevronRight, Loader2, AlertCircle,
  CheckCircle2, Info, Send, Archive, Zap, MessageSquare,
  Image as ImageIcon, Video as VideoIcon, Calendar, Heart, ThumbsUp, Eye, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Animated Button Component
const AnimatedButton = ({ children, className, ...props }) => (
  <Button 
    className={`${className} transform transition-all duration-200 hover:scale-105 active:scale-95`} 
    {...props}
  >
    {children}
  </Button>
);

export default function FutureVault() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [slots, setSlots] = useState([]);
  const [newSlotName, setNewSlotName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSlot, setExpandedSlot] = useState(null);
  const [scheduleModal, setScheduleModal] = useState(null);
  const [scheduleEmail, setScheduleEmail] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [editingText, setEditingText] = useState(null);
  const [newText, setNewText] = useState({});
  const [uploadingMedia, setUploadingMedia] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [editingSlotName, setEditingSlotName] = useState('');
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [activeTab, setActiveTab] = useState({});
  const [viewSlotModal, setViewSlotModal] = useState(null);

  useEffect(() => {
    // Only check authentication after auth loading is complete
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      fetchSlots();
    }
  }, [isAuthenticated, navigate, authLoading]);

  const checkDeliveryStatus = async (slots) => {
    try {
      const deliveryChecks = await Promise.all(
        slots.map(async (slot) => {
          if (slot.scheduledDate && !slot.delivered) {
            const response = await authFetch(`/api/slots/${slot._id}/delivery-status`);
            const data = await response.json();
            return { slotId: slot._id, delivered: data.delivered };
          }
          return { slotId: slot._id, delivered: slot.delivered };
        })
      );
      
      // Update slots with delivery status
      const updatedSlots = slots.map(slot => {
        const deliveryInfo = deliveryChecks.find(d => d.slotId === slot._id);
        if (deliveryInfo && deliveryInfo.delivered !== slot.delivered) {
          return { ...slot, delivered: deliveryInfo.delivered };
        }
        return slot;
      });
      
      return updatedSlots;
    } catch (err) {
      console.error('Error checking delivery status:', err);
      return slots;
    }
  };

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await authFetch('/api/vaults/future/slots');
      const data = await response.json();
      if (data.success) {
        const slotsWithDeliveryStatus = await checkDeliveryStatus(data.slots);
        setSlots(slotsWithDeliveryStatus || []);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createSlot = async () => {
    if (!newSlotName.trim()) return;
    try {
      const response = await authFetch('/api/vaults/future/slots', {
        method: 'POST',
        body: JSON.stringify({ slotName: newSlotName }),
      });
      const data = await response.json();
      if (data.success) {
        setSlots([...slots, data.slot]);
        setNewSlotName('');
        setError('');
        setShowAddSlot(false);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      const response = await authFetch(`/api/slots/${slotId}`, {
        method: 'DELETE',
        body: JSON.stringify({ vaultType: 'future' }),
      });
      const data = await response.json();
      if (data.success) {
        setSlots(slots.filter(s => s._id !== slotId));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const addText = async (slotId) => {
    const text = newText[slotId]?.trim();
    if (!text) return;
    try {
      const response = await authFetch(`/api/slots/${slotId}/text`, {
        method: 'POST',
        body: JSON.stringify({ textContent: text }),
      });
      const data = await response.json();
      if (data.success) {
        setSlots(slots.map(s => 
          s._id === slotId 
            ? { ...s, texts: [...(s.texts || []), data.text] } 
            : s
        ));
        setNewText({ ...newText, [slotId]: '' });
        setExpandedSlot(null);
        setError('');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteText = async (slotId, textId) => {
    try {
      const response = await authFetch(`/api/slots/${slotId}/text/${textId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setSlots(slots.map(s => s._id === slotId ? { ...s, texts: s.texts.filter(t => t._id !== textId) } : s));
      }
    } catch (err) {
      setError(err.message);
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
            if (data.success) {
              setSlots(slots.map(s => 
                s._id === slotId 
                  ? { ...s, media: [...(s.media || []), data.media] } 
                  : s
              ));
              setExpandedSlot(null);
              setError('');
            } else {
              setError(data.message || 'Failed to upload media');
            }
          }
        } catch (fetchError) {
          console.error('Fetch error:', fetchError);
          // Provide more specific error messages for deployment
          let errorMessage = 'Network error during upload';
          if (fetchError.message.includes('Failed to fetch')) {
            errorMessage = 'Network connection failed - please check your internet connection';
          } else if (fetchError.message.includes('CORS')) {
            errorMessage = 'CORS error - please check server configuration';
          } else if (fetchError.message.includes('timeout')) {
            errorMessage = 'Upload timeout - please try again with a smaller file';
          }
          setError(errorMessage);
        } finally {
          setUploadingMedia(null);
        }
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setUploadingMedia(null);
      };
      reader.onprogress = (e) => {
        const progress = (e.loaded / e.total) * 100;
        console.log(`Uploading media... ${progress}%`);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err.message || 'Failed to upload media');
      setUploadingMedia(null);
    }
  };

  const deleteMedia = async (slotId, mediaId) => {
    try {
      const response = await authFetch(`/api/slots/${slotId}/media/${mediaId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setSlots(slots.map(s => s._id === slotId ? { ...s, media: s.media.filter(m => m._id !== mediaId) } : s));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const updateSlotName = async (slotId) => {
    if (!editingSlotName.trim()) {
      setEditingSlot(null);
      return;
    }
    try {
      const response = await authFetch(`/api/slots/${slotId}`, {
        method: 'PUT',
        body: JSON.stringify({ slotName: editingSlotName }),
      });
      const data = await response.json();
      if (data.success) {
        setSlots(slots.map(s => s._id === slotId ? { ...s, name: editingSlotName } : s));
        setEditingSlot(null);
        setEditingSlotName('');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const scheduleSlot = async (slotId) => {
    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!scheduleEmail || !scheduleDate) {
      setError('Please enter email and date');
      return;
    }
    
    if (!emailRegex.test(scheduleEmail)) {
      setError('Please enter a valid email address (e.g., patan@gmail.com)');
      return;
    }
    
    try {
      const response = await authFetch(`/api/slots/${slotId}/schedule`, {
        method: 'POST',
        body: JSON.stringify({
          recipientEmail: scheduleEmail,
          scheduledDate: scheduleDate,
          vaultType: 'future',
        }),
      });
      const data = await response.json();
      if (data.success) {
        if (data.slot) {
          setSlots(slots.map(s => 
            s._id === slotId 
              ? data.slot
              : s
          ));
        } else {
          setSlots(slots.map(s => 
            s._id === slotId 
              ? { ...s, scheduledDate: scheduleDate, scheduledEmail: scheduleEmail }
              : s
          ));
        }
        setScheduleModal(null);
        setScheduleEmail('');
        setScheduleDate('');
        setError('');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
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
        <Loader2 className="h-12 w-12 text-emerald-600 animate-spin" />
        <p className="text-slate-500 font-medium">Opening Future Vault...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Future Vault</h1>
            <p className="text-gray-600">Schedule memories up to 9 months in advance</p>
          </div>
          <Button onClick={() => navigate('/dashboard')} variant="outline">Back</Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader><CardTitle>Create New Slot</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input placeholder="Slot name..." value={newSlotName} onChange={e => setNewSlotName(e.target.value)} />
              <Button onClick={createSlot}><Plus size={18} className="mr-2" />Add Slot</Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 text-sm font-medium">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {slots.map(slot => {
            const texts = slot.texts || [];
            const media = slot.media || [];
            const totalItems = texts.length + media.length;
            
            let cardHeight = 'h-138';
            if (totalItems > 3) cardHeight = 'h-141';
            if (totalItems > 6) cardHeight = 'h-163';
            if (totalItems > 9) cardHeight = 'h-168';
            
            return (
              <Card key={slot._id} className={`flex flex-col overflow-hidden ${cardHeight}`}>
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
                        className="text-xl font-bold text-center mb-2 cursor-pointer hover:text-blue-600" 
                        onClick={() => {
                          setEditingSlot(slot._id);
                          setEditingSlotName(slot.name);
                        }}
                      >
                        {slot.name}
                      </CardTitle>
                    )}
                    <div className="flex gap-2 absolute top-0 right-0">
                      <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => setViewSlotModal(slot)}>
                        <Eye size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteSlot(slot._id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="text-sm mb-3">{media.length} media, {texts.length} texts</CardDescription>
                  
                  {/* Scheduled Email Display */}
                  {slot.scheduledEmail && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-blue-600" />
                          <div>
                            <p className="text-sm font-semibold text-blue-800">Scheduled for:</p>
                            <p className="text-lg font-bold text-blue-900">{slot.scheduledEmail}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => console.log('User liked scheduled email for:', slot.scheduledEmail)}
                        >
                          <ThumbsUp size={14} />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Add Content Buttons Row */}
                  <div className="grid grid-cols-3 gap-4 mb-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => {
                      setExpandedSlot(expandedSlot === slot._id ? null : slot._id);
                      setTimeout(() => document.getElementById(`text-input-${slot._id}`)?.focus(), 100);
                    }} className="text-xs h-8">
                      <MessageSquare size={12} className="mr-1" /> Text
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      setExpandedSlot(expandedSlot === slot._id ? null : slot._id);
                      setTimeout(() => document.getElementById(`image-input-${slot._id}`)?.click(), 100);
                    }} className="text-xs h-8">
                      <ImageIcon size={12} className="mr-1" /> Image
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      setExpandedSlot(expandedSlot === slot._id ? null : slot._id);
                      setTimeout(() => document.getElementById(`video-input-${slot._id}`)?.click(), 100);
                    }} className="text-xs h-8">
                      <VideoIcon size={12} className="mr-1" /> Video
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col overflow-hidden p-4">
                  {/* Hidden file inputs */}
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
                  <div className={`flex-1 space-y-3 ${totalItems > 9 ? 'overflow-y-auto' : ''}`}>
                    {/* Unified Content Grid */}
                    {totalItems > 0 ? (
                      <div className="space-y-2">
                        <h4 className="font-medium text-xs text-gray-600">Content</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {/* Render all content items */}
                          {texts.slice(0, 9).map(t => (
                            <div key={t._id} className="relative group bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200 h-24 flex flex-col justify-between hover:shadow-md transition-all duration-200">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="bg-blue-100 p-1.5 rounded-full">
                                    <MessageSquare className="text-blue-600" size={10} />
                                  </div>
                                  <span className="text-xs text-gray-500 font-medium">Text</span>
                                </div>
                                <button 
                                  onClick={() => deleteText(slot._id, t._id)} 
                                  className="opacity-0 group-hover:opacity-100 transition-all duration-200"
                                >
                                  <div className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600">
                                    <Trash2 size={8} />
                                  </div>
                                </button>
                              </div>
                              <p className="text-xs text-gray-700 leading-relaxed line-clamp-3 break-all flex-1">{t.content}</p>
                            </div>
                          ))}
                          {media.slice(0, 9).map(m => {
                            console.log('Rendering media:', m.type, m.url);
                            return (
                              <div key={m._id} className="relative group cursor-pointer" onClick={() => setExpandedSlot(expandedSlot === slot._id ? null : slot._id)}>
                                <div className="h-24 rounded-lg border-2 border-gray-200 overflow-hidden bg-gray-100 hover:border-blue-300 transition-all">
                                  {m.type === 'image' ? (
                                    <div className="relative w-full h-full">
                                      <img 
                                        src={m.url} 
                                        className="w-full h-full object-cover" 
                                        alt="Media"
                                        onLoad={() => console.log('Image loaded successfully:', m.url)}
                                        onError={(e) => {
                                          console.error('Image failed to load:', m.url, e);
                                          e.target.style.backgroundColor = '#ff0000';
                                        }}
                                      />
                                      <div className="absolute top-2 right-2 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center p-1 rounded-full opacity-0 group-hover:opacity-100">
                                        <ImageIcon size={16} className="text-white" />
                                      </div>
                                    </div>
                                  ) : (
                                  <div className="relative w-full h-full">
                                    <video 
                                      src={m.url} 
                                      className="w-full h-full object-cover"
                                      muted
                                      playsInline
                                      preload="metadata"
                                      onLoadedData={() => console.log('Video loaded successfully:', m.url)}
                                      onError={(e) => {
                                        console.error('Video failed to load:', m.url, e);
                                        e.target.style.backgroundColor = '#ff0000';
                                      }}
                                    />
                                    <div className="absolute top-2 right-2 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center p-1 rounded-full opacity-0 group-hover:opacity-100">
                                      <VideoIcon size={16} className="text-white" />
                                    </div>
                                  </div>
                                  )}
                                </div>
                                <button 
                                  onClick={() => deleteMedia(slot._id, m._id)} 
                                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            );
                          })}
                          {/* Show more indicator if content exceeds 9 items */}
                          {totalItems > 9 && (
                            <div className="h-20 bg-gray-50 rounded border border-gray-200 flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-xs text-gray-500">+{totalItems - 9}</div>
                                <div className="text-xs text-gray-500">more</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Empty State */
                      <div className="text-center py-8">
                        <div className="mb-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <MessageSquare size={24} className="text-gray-400" />
                          </div>
                        </div>
                        <div className="text-gray-400 text-sm">No content yet</div>
                        <div className="text-gray-400 text-xs mt-1">Add content to schedule this slot</div>
                      </div>
                    )}
                  </div>

                  {/* Add Content Section */}
                  {expandedSlot === slot._id && (
                    <div className="space-y-3 border-t pt-3 mt-3 flex-shrink-0">
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input 
                            id={`text-input-${slot._id}`}
                            placeholder="Add a message..." 
                            value={newText[slot._id] || ''}
                            onChange={e => setNewText({ ...newText, [slot._id]: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && addText(slot._id)}
                            className="flex-1 text-sm"
                          />
                          <Button size="sm" onClick={() => addText(slot._id)} className="text-xs px-2">Add</Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Schedule Button Status */}
                  {slot.scheduledDate && slot.delivered ? (
                    <div className="flex gap-2 w-full mt-3">
                      <AnimatedButton className="flex-1 bg-green-600 hover:bg-green-700 text-white cursor-default" size="sm">
                        <Heart size={14} className="mr-1" /> Slot Delivered
                      </AnimatedButton>
                      <AnimatedButton 
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" 
                        size="sm" 
                        onClick={() => {
                          // Reset slot for new schedule
                          setSlots(slots.map(s => 
                            s._id === slot._id 
                              ? { ...s, scheduledDate: null, scheduledEmail: null, delivered: false }
                              : s
                          ));
                        }}
                      >
                        <Mail size={14} className="mr-1" /> New Schedule
                      </AnimatedButton>
                    </div>
                  ) : slot.scheduledDate ? (
                    <div className="flex gap-2 w-full mt-3">
                      <AnimatedButton className="flex-1 bg-orange-500 hover:bg-orange-600 text-white cursor-default text-xs" size="sm">
                        <Mail size={14} className="mr-1 flex-shrink-0" />
                        <span className="truncate">
                          Scheduled at {new Date(slot.scheduledDate).toLocaleDateString()} {new Date(slot.scheduledDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </AnimatedButton>
                      <AnimatedButton 
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-xs" 
                        size="sm" 
                        onClick={() => {
                          // Pre-populate form with existing data
                          setScheduleEmail(slot.scheduledEmail || '');
                          // Format date for datetime-local input (YYYY-MM-DDTHH:MM)
                          if (slot.scheduledDate) {
                            const date = new Date(slot.scheduledDate);
                            const formattedDate = date.toISOString().slice(0, 16);
                            setScheduleDate(formattedDate);
                          } else {
                            setScheduleDate('');
                          }
                          setError(''); // Clear any previous error messages
                          setScheduleModal(slot._id);
                        }}
                      >
                        Edit
                      </AnimatedButton>
                      <AnimatedButton 
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs" 
                        size="sm" 
                        onClick={() => {
                          if (window.confirm('Are you sure to delete this delivery time?')) {
                            // Delete delivery schedule
                            setSlots(slots.map(s => 
                              s._id === slot._id 
                                ? { ...s, scheduledDate: null, scheduledEmail: null, delivered: false }
                                : s
                            ));
                          }
                        }}
                      >
                        <Trash2 size={14} className="mr-1" /> Delete
                      </AnimatedButton>
                    </div>
                  ) : (
                    <AnimatedButton className="w-full mt-3 flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white" size="sm" onClick={() => {
                      // Only allow scheduling if slot has content
                      const texts = slot.texts || [];
                      const media = slot.media || [];
                      const totalItems = texts.length + media.length;
                      
                      if (totalItems === 0) {
                        // Show message instead of opening schedule modal
                        return;
                      }
                      
                      // Pre-populate form with existing data if available
                      setScheduleEmail(slot.scheduledEmail || '');
                      // Format date for datetime-local input (YYYY-MM-DDTHH:MM)
                      if (slot.scheduledDate) {
                        const date = new Date(slot.scheduledDate);
                        const formattedDate = date.toISOString().slice(0, 16);
                        setScheduleDate(formattedDate);
                      } else {
                        setScheduleDate('');
                      }
                      setError(''); // Clear any previous error messages
                      setScheduleModal(slot._id);
                    }}>
                      <Mail size={14} className="mr-1" /> Schedule
                    </AnimatedButton>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {slots.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <Archive size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No slots yet</h3>
            <p className="text-gray-500 mt-2 max-w-xs mx-auto">
              Create your first slot to start organizing your memories.
            </p>
            <Button 
              onClick={() => setNewSlotName('')}
              className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8"
            >
              Create First Slot
            </Button>
          </div>
        )}

        {scheduleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader><CardTitle>Schedule Slot</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Recipient Email</label>
                  <Input 
                    type="email" 
                    placeholder="recipient@example.com" 
                    value={scheduleEmail} 
                    onChange={e => setScheduleEmail(e.target.value)}
                    className={error && error.includes('valid email') ? 'border-red-500' : ''}
                  />
                  {error && error.includes('valid email') && (
                    <p className="text-red-500 text-xs mt-1">Please use format: name@domain.com</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Delivery Date & Time</label>
                  <Input 
                    type="datetime-local" 
                    value={scheduleDate} 
                    onChange={e => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)} // Prevent selecting past dates
                  />
                </div>
                {error && !error.includes('valid email') && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}
                <div className="flex gap-2">
                  <AnimatedButton onClick={() => scheduleSlot(scheduleModal)} className="flex-1">Schedule</AnimatedButton>
                  <AnimatedButton variant="outline" onClick={() => {
                    setScheduleModal(null);
                    setError('');
                  }} className="flex-1">Cancel</AnimatedButton>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {viewSlotModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex justify-between items-center">
                <CardTitle className="text-2xl">{viewSlotModal.name}</CardTitle>
                <Button variant="ghost" onClick={() => setViewSlotModal(null)}>
                  <X size={20} />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Slot Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">Slot Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Items:</span> {viewSlotModal.media?.length || 0} media, {viewSlotModal.texts?.length || 0} texts
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {new Date(viewSlotModal.createdAt).toLocaleDateString()}
                    </div>
                    {viewSlotModal.scheduledEmail && (
                      <div className="col-span-2">
                        <span className="font-medium">Scheduled for:</span> {viewSlotModal.scheduledEmail} on {new Date(viewSlotModal.scheduledDate).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Media Section */}
                {viewSlotModal.media && viewSlotModal.media.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Media ({viewSlotModal.media.length})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {viewSlotModal.media.map(m => (
                        <div key={m._id} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                            {m.type === 'image' ? (
                              <img 
                                src={m.url} 
                                alt="Memory" 
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                onClick={() => window.open(m.url, '_blank')}
                              />
                            ) : (
                              <video 
                                src={m.url} 
                                className="w-full h-full object-cover"
                                controls
                                onClick={() => window.open(m.url, '_blank')}
                              />
                            )}
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="secondary" onClick={() => window.open(m.url, '_blank')}>
                              <Eye size={12} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Texts Section */}
                {viewSlotModal.texts && viewSlotModal.texts.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Texts ({viewSlotModal.texts.length})</h3>
                    <div className="space-y-3">
                      {viewSlotModal.texts.map(t => (
                        <div key={t._id} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <p className="text-gray-800 whitespace-pre-wrap">{t.content}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(t.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Close Button */}
                <div className="flex justify-end">
                  <AnimatedButton onClick={() => setViewSlotModal(null)} className="px-8">
                    Close
                  </AnimatedButton>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
