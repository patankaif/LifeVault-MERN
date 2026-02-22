import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Loader } from 'lucide-react';

export default function ConfirmAlive() {
  const [match, params] = useRoute('/confirm-alive/:token');
  const [status, setStatus] = useState('loading'); // 'loading' | 'confirming' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (params?.token) {
      confirmAlive(params.token);
    }
  }, [params?.token]);

  const confirmAlive = async (token) => {
    try {
      setStatus('confirming');
      const response = await fetch(`/api/confirm-alive/${token}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to confirm');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Inactivity Confirmation</CardTitle>
          <CardDescription>Confirm that you're still active</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="text-center space-y-4">
              <Loader className="animate-spin mx-auto text-blue-600" size={48} />
              <p className="text-gray-600">Loading confirmation...</p>
            </div>
          )}

          {status === 'confirming' && (
            <div className="text-center space-y-4">
              <Loader className="animate-spin mx-auto text-blue-600" size={48} />
              <p className="text-gray-600">Confirming your activity...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="text-green-600 mx-auto" size={48} />
              <div>
                <p className="font-semibold text-green-600">Success!</p>
                <p className="text-gray-600 text-sm mt-2">{message}</p>
              </div>
              <div className="pt-4">
                <p className="text-sm text-gray-600">
                  Your Death Vault timer has been reset. You can now{' '}
                  <a href="/login" className="text-blue-600 hover:underline">
                    return to your account
                  </a>
                  .
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <AlertCircle className="text-red-600 mx-auto" size={48} />
              <div>
                <p className="font-semibold text-red-600">Error</p>
                <p className="text-gray-600 text-sm mt-2">{message}</p>
              </div>
              <div className="pt-4">
                <p className="text-sm text-gray-600">
                  This confirmation link may have expired. Please{' '}
                  <a href="/login" className="text-blue-600 hover:underline">
                    sign in to your account
                  </a>
                  {' '}to request a new confirmation.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
