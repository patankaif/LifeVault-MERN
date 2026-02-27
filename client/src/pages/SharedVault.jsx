import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SharedVault() {
  const [sharedMatch, sharedParams] = useRoute('/shared-vault/:token');
  const [scheduleMatch, scheduleParams] = useRoute('/schedule-slot/:token');
  const [, navigate] = useLocation();
  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isScheduleRoute = scheduleMatch;
  const params = isScheduleRoute ? scheduleParams : sharedParams;

  console.log('[SharedVault] Route detection:', {
    sharedMatch,
    scheduleMatch,
    isScheduleRoute,
    params,
    currentPath: window.location.pathname
  });

  useEffect(() => {
    console.log('[SharedVault] useEffect triggered with params:', params);
    if (params?.token) {
      console.log('[SharedVault] Fetching shared slot with token:', params.token);
      fetchSharedSlot(params.token, isScheduleRoute);
    }
  }, [params?.token, isScheduleRoute]);

  const fetchSharedSlot = async (token, scheduleRoute) => {
    console.log('[SharedVault] fetchSharedSlot called with:', { token, scheduleRoute });
    try {
      const response = await fetch(`/api/shared-vault/${token}`);
      const data = await response.json();
      console.log('[SharedVault] API response:', data);
      if (data.success) {
        setSlot(data.slot);
        
        // If this is a schedule route, redirect to the appropriate vault with schedule modal
        if (scheduleRoute && data.slot) {
          console.log('[SharedVault] Schedule route detected, redirecting to vault');
          // We need to determine the vault type - let's get it from the slot
          const vaultType = data.slot.vaultType || 'present'; // default to present
          const vaultRoute = `/${vaultType}-vault`;
          const redirectUrl = `${vaultRoute}?schedule=${data.slot._id}`;
          console.log('[SharedVault] Redirecting to:', redirectUrl);
          navigate(redirectUrl);
          return;
        }
      } else {
        setError(data.message || 'Shared slot not found or link expired');
      }
    } catch (err) {
      console.error('[SharedVault] Error fetching shared slot:', err);
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
