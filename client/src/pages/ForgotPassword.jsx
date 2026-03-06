import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { safeJsonParse } from '@/lib/apiHelpers';

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'password' | 'success'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const sendOTP = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError();
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await safeJsonParse(response);
      if (data.success) {
        setStep('otp');
        setSuccessMessage('OTP sent to your email');
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp) {
      setError('OTP is required');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await safeJsonParse(response);
      if (data.success) {
        setStep('password');
        setSuccessMessage('OTP verified');
      } else {
        setError(data.message || 'Invalid OTP');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Both password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await safeJsonParse(response);
      if (data.success) {
        setStep('success');
        setSuccessMessage('Password reset successfully!');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>Recover access to your Life Vault account</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Enter your email address to receive a password reset OTP.</p>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="flex gap-2 text-red-600 text-sm p-3 bg-red-50 rounded">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button onClick={sendOTP} disabled={loading} className="w-full">
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </Button>

              <Button variant="outline" onClick={() => navigate('/login')} className="w-full">
                Back to Login
              </Button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">We've sent a 6-digit OTP to <strong>{email}</strong></p>
              <div>
                <label className="block text-sm font-medium mb-1">Enter OTP</label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    setError('');
                  }}
                  maxLength="6"
                  disabled={loading}
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              {error && (
                <div className="flex gap-2 text-red-600 text-sm p-3 bg-red-50 rounded">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex gap-2 text-green-600 text-sm p-3 bg-green-50 rounded">
                  <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              <Button onClick={verifyOTP} disabled={loading || otp.length !== 6} className="w-full">
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>

              <Button variant="outline" onClick={() => setStep('email')} className="w-full">
                Back
              </Button>
            </div>
          )}

          {step === 'password' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Enter your new password</p>
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError('');
                  }}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="flex gap-2 text-red-600 text-sm p-3 bg-red-50 rounded">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button onClick={resetPassword} disabled={loading} className="w-full">
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>

              <Button variant="outline" onClick={() => setStep('otp')} className="w-full">
                Back
              </Button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle2 size={48} className="text-green-600 mx-auto" />
              <div>
                <p className="text-lg font-semibold text-green-600">Success!</p>
                <p className="text-sm text-gray-600">Your password has been reset. Redirecting to login...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
