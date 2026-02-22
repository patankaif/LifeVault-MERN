import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SharedVault() {
  const [match, params] = useRoute('/shared-vault/:token');
  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params?.token) {
      fetchSharedSlot(params.token);
    }
  }, [params?.token]);

  const fetchSharedSlot = async (token) => {
    try {
      const response = await fetch(`/api/shared-vault/${token}`);
      const data = await response.json();
      if (data.success) {
        setSlot(data.slot);
      } else {
        setError(data.message || 'Shared slot not found or link expired');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading shared memory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
              <div>
                <p className="font-semibold text-red-600">Error</p>
                <p className="text-gray-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Shared Memory</h1>
          <p className="text-gray-600 mt-1">A memory has been shared with you</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {slot && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{slot.name}</CardTitle>
              <CardDescription>
                Created {new Date(slot.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Media Section */}
              {slot.media && slot.media.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Media</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {slot.media.map((media) => (
                      <div key={media._id} className="rounded-lg overflow-hidden bg-gray-100">
                        {media.type === 'image' ? (
                          <img
                            src={media.url}
                            alt="Shared memory"
                            className="w-full h-64 object-cover"
                          />
                        ) : (
                          <video
                            src={media.url}
                            controls
                            className="w-full h-64 object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Text Section */}
              {slot.texts && slot.texts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Messages</h3>
                  <div className="space-y-4">
                    {slot.texts.map((text) => (
                      <div key={text._id} className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-800">{text.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(text.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!slot.media || slot.media.length === 0) && (!slot.texts || slot.texts.length === 0) && (
                <div className="text-center py-12">
                  <CheckCircle2 className="text-green-600 mx-auto mb-4" size={48} />
                  <p className="text-gray-600">This memory slot is empty</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
