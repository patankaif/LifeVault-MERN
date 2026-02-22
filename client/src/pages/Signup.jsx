import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Shield, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle2, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Signup() {
  const [, navigate] = useLocation();
  const { register, isAuthenticated } = useAuth();
  const [step, setStep] = useState('details'); // 'details' | 'otp-verification' | 'success'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Password validation state
  const [passwordRequirements, setPasswordRequirements] = useState({
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false,
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    
    // Update password requirements when password changes
    if (name === 'password') {
      setPasswordRequirements({
        hasUppercase: /[A-Z]/.test(value),
        hasLowercase: /[a-z]/.test(value),
        hasNumber: /[0-9]/.test(value),
        hasSpecialChar: /[@#\$%&*]/.test(value),
        hasMinLength: value.length >= 8,
      });
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    // Check all password requirements are met
    const allRequirementsMet = Object.values(passwordRequirements).every(req => req === true);
    if (!allRequirementsMet) {
      setError('Please meet all password requirements');
      return false;
    }
    
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email');
      return false;
    }
    return true;
  };

  const sendOTP = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (data.success) {
        setStep('otp-verification');
        setSuccessMessage('OTP sent to your email');
      } else {
        setError(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTPAndRegister = async () => {
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      // Verify OTP
      const otpResponse = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp }),
      });
      const otpData = await otpResponse.json();

      if (!otpData.success) {
        setError(otpData.message || 'Invalid OTP');
        setLoading(false);
        return;
      }

      // Register user
      const registerResult = await register(formData.email, formData.password, formData.name);
      if (registerResult.success) {
        setStep('success');
        setSuccessMessage('Account created successfully!');
        // Small delay to show success message before redirecting
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(registerResult.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 mb-4">
            <Shield className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Create Account</h1>
          <p className="text-slate-500 mt-2">Start preserving your legacy today</p>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Sign Up</CardTitle>
            <CardDescription>Join thousands of users on Life Vault</CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'details' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                      type="text"
                      name="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="pl-10 h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                      type="email"
                      name="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10 h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10 h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  {formData.password && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Requirements</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {[
                          { label: 'Uppercase', met: passwordRequirements.hasUppercase },
                          { label: 'Lowercase', met: passwordRequirements.hasLowercase },
                          { label: 'Number', met: passwordRequirements.hasNumber },
                          { label: 'Special Char', met: passwordRequirements.hasSpecialChar },
                          { label: '8+ Characters', met: passwordRequirements.hasMinLength },
                        ].map((req, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px]">
                            {req.met ? (
                              <Check size={12} className="text-emerald-500" />
                            ) : (
                              <X size={12} className="text-slate-300" />
                            )}
                            <span className={req.met ? 'text-emerald-600 font-medium' : 'text-slate-500'}>
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 ml-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                      type="password"
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="pl-10 h-12 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex gap-2 bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-lg font-medium"
                  >
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}

                <Button
                  onClick={sendOTP}
                  disabled={loading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-100 group mt-4"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      Send Verification OTP <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-slate-500 mt-6">
                  Already have an account?{' '}
                  <button 
                    onClick={() => navigate('/login')}
                    className="font-bold text-blue-600 hover:text-blue-700"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            )}

            {step === 'otp-verification' && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-slate-600">
                    We've sent a 6-digit verification code to
                  </p>
                  <p className="font-bold text-slate-900 mt-1">{formData.email}</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 ml-1">Verification Code</label>
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
                    className="text-center text-3xl tracking-[0.5em] font-bold h-16 bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {error && (
                  <div className="flex gap-2 text-red-600 text-sm p-3 bg-red-50 rounded-lg border border-red-100">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="flex gap-2 text-emerald-600 text-sm p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={verifyOTPAndRegister}
                    disabled={loading || otp.length !== 6}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-100"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify & Create Account'}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      setStep('details');
                      setOtp('');
                      setError('');
                    }}
                    className="w-full text-slate-500 hover:text-slate-700"
                  >
                    Back to details
                  </Button>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center py-8 space-y-6">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={48} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Account Created!</h3>
                  <p className="text-slate-500 mt-2">Your Life Vault is ready. Redirecting to login...</p>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2 }}
                    className="bg-emerald-500 h-full"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
