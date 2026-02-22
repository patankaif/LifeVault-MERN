import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/authFetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ArrowLeft, Plus, Trash2, Mail, Image as ImageIcon, 
  Video as VideoIcon, MessageSquare, Heart, Send, 
  Loader2, AlertCircle, CheckCircle2, Calendar, Clock,
  FileText, X, Download, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SlotDetail() {
  const [, params] = useRoute('/slots/:id');
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newText, setNewText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    email: '',
    date: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchSlot();
  }, [isAuthenticated, params.id]);

  const fetchSlot = async () => {
    try {
      setLoading(true);
      const response = await authFetch(`/api/slots/${params.id}`);
      const data = await response.json();
      if (data.success) {
        setSlot(data.slot);
        setScheduleData({
          email: data.slot.scheduledEmail || '',
          date: data.slot.scheduledDate ? new Date(data.slot.scheduledDate).toISOString().split('T')[0] : ''
        });
      } else {
        setError(data.message || 'Failed to fetch slot');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddText = async () => {
    if (!newText.trim()) return;
    try {
      const response = await authFetch(`/api/slots/${params.id}/text`, {
        method: 'POST',
        body: JSON.stringify({ textContent: newText }),
      });
      const data = await response.json();
      if (data.success) {
        setSlot({ ...slot, texts: [...(slot.texts || []), data.text] });
        setNewText('');
      }
    } catch (err) {
      setError('Failed to add text');
    }
  };

  const handleDeleteText = async (textId) => {
    try {
      const response = await authFetch(`/api/slots/${params.id}/text/${textId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setSlot({ ...slot, texts: slot.texts.filter(t => t._id !== textId) });
      }
    } catch (err) {
      setError('Failed to delete text');
    }
  };

  const handleAddMedia = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1];
        const mediaType = file.type.startsWith('image') ? 'image' : 'video';
        
        const response = await authFetch(`/api/slots/${params.id}/media`, {
          method: 'POST',
          body: JSON.stringify({ file: base64, mediaType }),
        });
        const data = await response.json();
        if (data.success) {
          setSlot({ ...slot, media: [...(slot.media || []), data.media] });
        } else {
          setError(data.message || 'Upload failed');
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Upload failed');
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    try {
      const response = await authFetch(`/api/slots/${params.id}/media/${mediaId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setSlot({ ...slot, media: slot.media.filter(m => m._id !== mediaId) });
      }
    } catch (err) {
      setError('Failed to delete media');
    }
  };

  const handleSchedule = async () => {
    if (!scheduleData.email) {
      setError('Recipient email is required');
      return;
    }
    setScheduling(true);
    try {
      const response = await authFetch(`/api/slots/${params.id}/schedule`, {
        method: 'POST',
        body: JSON.stringify({
          recipientEmail: scheduleData.email,
          scheduledDate: scheduleData.date || new Date().toISOString(),
          vaultType: slot.vaultType
        }),
      });
      const data = await response.json();
      if (data.success) {
        fetchSlot();
        alert('Schedule updated successfully!');
      } else {
        setError(data.message || 'Scheduling failed');
      }
    } catch (err) {
      setError('Scheduling failed');
    } finally {
      setScheduling(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading memory details...</p>
      </div>
    </div>
  );

  if (!slot) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Memory not found</h2>
        <Button onClick={() => navigate('/dashboard')} className="mt-4">Back to Dashboard</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-900">
            <ArrowLeft size={20} className="mr-2" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
              slot.vaultType === 'death' ? 'bg-rose-600' : 
              slot.vaultType === 'future' ? 'bg-blue-600' : 'bg-emerald-600'
            }`}>
              {slot.vaultType === 'death' ? <Heart size={18} /> : 
               slot.vaultType === 'future' ? <Clock size={18} /> : <Zap size={18} />}
            </div>
            <span className="font-bold text-slate-900">{slot.name}</span>
          </div>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Text Content */}
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare size={20} className="text-blue-600" /> Written Messages
                  </CardTitle>
                  <span className="text-xs font-bold text-slate-400 uppercase">{slot.texts?.length || 0} Messages</span>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4 mb-6">
                  {slot.texts?.map((text) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={text._id} 
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group relative"
                    >
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{text.content}</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteText(text._id)}
                        className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </motion.div>
                  ))}
                  {(!slot.texts || slot.texts.length === 0) && (
                    <div className="text-center py-8 text-slate-400">
                      <FileText size={40} className="mx-auto mb-3 opacity-20" />
                      <p>No written messages yet</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Write a new message..." 
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    className="bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  />
                  <Button onClick={handleAddText} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                    <Plus size={18} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Media Content */}
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ImageIcon size={20} className="text-emerald-600" /> Photos & Videos
                  </CardTitle>
                  <span className="text-xs font-bold text-slate-400 uppercase">{slot.media?.length || 0} Items</span>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  {slot.media?.map((item) => (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={item._id} 
                      className="aspect-square rounded-2xl overflow-hidden bg-slate-100 relative group border border-slate-200"
                    >
                      {item.type === 'image' ? (
                        <img src={item.url} alt="Memory" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900">
                          <VideoIcon size={32} className="text-white/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                          <ExternalLink size={18} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteMedia(item._id)}
                          className="text-white hover:bg-red-500/80"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-all bg-slate-50/50">
                    {uploading ? <Loader2 className="animate-spin" size={24} /> : (
                      <>
                        <Plus size={24} className="mb-2" />
                        <span className="text-xs font-bold uppercase">Upload</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*,video/*" 
                      onChange={(e) => handleAddMedia(e.target.files?.[0])}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-8">
            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-slate-900 text-white">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send size={18} /> Delivery Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 ml-1">Recipient Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input 
                      type="email"
                      placeholder="recipient@example.com" 
                      value={scheduleData.email}
                      onChange={(e) => setScheduleData({...scheduleData, email: e.target.value})}
                      className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {slot.vaultType !== 'death' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 ml-1">Delivery Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <Input 
                        type="date"
                        value={scheduleData.date}
                        onChange={(e) => setScheduleData({...scheduleData, date: e.target.value})}
                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                )}

                {slot.vaultType === 'death' && (
                  <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                    <div className="flex items-center gap-2 text-rose-700 font-bold text-sm mb-1">
                      <Shield size={14} /> Legacy Trigger
                    </div>
                    <p className="text-xs text-rose-600 leading-relaxed">
                      This content will be delivered automatically after 9 months of inactivity.
                    </p>
                  </div>
                )}

                <Button 
                  onClick={handleSchedule} 
                  disabled={scheduling}
                  className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-lg shadow-slate-200"
                >
                  {scheduling ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                  Update Delivery
                </Button>

                {slot.delivered && (
                  <div className="flex items-center gap-2 justify-center p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-sm font-bold">
                    <CheckCircle2 size={18} /> Delivered on {new Date(slot.deliveredAt || slot.updatedAt).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-blue-50/50 border border-blue-100">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Info size={18} className="text-blue-600 mt-0.5" />
                  <div className="text-xs text-blue-700 leading-relaxed">
                    <p className="font-bold mb-1">Privacy Tip</p>
                    All content in your vault is encrypted. Only the designated recipient will be able to access these memories once the delivery conditions are met.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
