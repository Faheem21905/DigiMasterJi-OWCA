import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, ArrowRight, Smartphone, Lock, User, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../../components/layouts';
import { Button, Input, OtpInput, Card } from '../../components/ui';
import { authApi } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [authMethod, setAuthMethod] = useState('phone'); // 'phone' or 'email'
  const [step, setStep] = useState(1); // 1: details, 2: verification, 3: success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  // Backend requires: email, phone_number, full_name, password for ALL registrations
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [otp, setOtp] = useState('');

  const updateForm = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmitDetails = async (e) => {
    e.preventDefault();
    setError('');

    // Validate name
    if (formData.fullName.trim().length < 2) {
      setError('Please enter your full name');
      return;
    }

    if (authMethod === 'phone') {
      if (!validatePhone(formData.phone)) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }

      setLoading(true);
      try {
        await authApi.sendOtp(formData.phone);
        setStep(2);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to send OTP. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!validateEmail(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      // Backend requires phone_number for all registrations
      if (!validatePhone(formData.phone)) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }

      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      setLoading(true);
      try {
        // Backend requires: email, phone_number (with +91 prefix), full_name, password
        await register({
          full_name: formData.fullName,
          email: formData.email,
          phone_number: `+91${formData.phone}`,
          password: formData.password,
        });
        setStep(3);
        setTimeout(() => navigate('/profiles'), 2000);
      } catch (err) {
        setError(err.response?.data?.detail || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: formData.fullName,
        phone: formData.phone,
        otp,
      });
      setStep(3);
      setTimeout(() => navigate('/profiles'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, label: '' };
    if (password.length < 6) return { strength: 1, label: 'Weak', color: 'bg-rose-500' };
    if (password.length < 8) return { strength: 2, label: 'Fair', color: 'bg-amber-500' };
    
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);
    
    const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (score >= 3) return { strength: 4, label: 'Strong', color: 'bg-emerald-500' };
    if (score >= 2) return { strength: 3, label: 'Good', color: 'bg-violet-500' };
    return { strength: 2, label: 'Fair', color: 'bg-amber-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <AuthLayout>
      <Card className="p-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: step >= s ? 1 : 0.8,
                  backgroundColor: step >= s ? 'rgb(139, 92, 246)' : 'rgba(255,255,255,0.1)',
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= s ? 'text-white' : 'text-white/40'
                }`}
              >
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </motion.div>
              {s < 3 && (
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: step > s ? 'rgb(139, 92, 246)' : 'rgba(255,255,255,0.1)',
                  }}
                  className="w-12 h-1 rounded-full mx-2"
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Titles */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1-title"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-center mb-8"
            >
              <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
              <p className="text-white/60">Start your learning adventure today</p>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div
              key="step2-title"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-center mb-8"
            >
              <h2 className="text-2xl font-bold text-white mb-2">Verify Phone</h2>
              <p className="text-white/60">
                Enter the code sent to +91 {formData.phone}
              </p>
            </motion.div>
          )}
          {step === 3 && (
            <motion.div
              key="step3-title"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30"
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Aboard!</h2>
              <p className="text-white/60">Your account has been created successfully</p>
              <p className="text-sm text-violet-400 mt-4">Redirecting to profiles...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Method Toggle (only on step 1) */}
        {step === 1 && (
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-6">
            <button
              onClick={() => {
                setAuthMethod('phone');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all duration-200 ${
                authMethod === 'phone'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Phone className="w-4 h-4" />
              Phone
            </button>
            <button
              onClick={() => {
                setAuthMethod('email');
                setError('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all duration-200 ${
                authMethod === 'email'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
          </div>
        )}

        {/* Error Message */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl"
            >
              <p className="text-sm text-rose-400 text-center">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Forms */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form
              key="details-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSubmitDetails}
              className="space-y-5"
            >
              <Input
                label="Full Name"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => updateForm('fullName', e.target.value)}
                icon={User}
                required
              />

              {authMethod === 'phone' ? (
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="Enter your 10-digit phone number"
                  value={formData.phone}
                  onChange={(e) =>
                    updateForm('phone', e.target.value.replace(/\D/g, '').slice(0, 10))
                  }
                  icon={Smartphone}
                  required
                />
              ) : (
                <>
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    icon={Mail}
                    required
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="Enter your 10-digit phone number"
                    value={formData.phone}
                    onChange={(e) =>
                      updateForm('phone', e.target.value.replace(/\D/g, '').slice(0, 10))
                    }
                    icon={Smartphone}
                    required
                  />
                  <div>
                    <Input
                      label="Password"
                      type="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => updateForm('password', e.target.value)}
                      icon={Lock}
                      required
                    />
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                level <= passwordStrength.strength
                                  ? passwordStrength.color
                                  : 'bg-white/10'
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs ${passwordStrength.color?.replace('bg-', 'text-')}`}>
                          {passwordStrength.label}
                        </p>
                      </div>
                    )}
                  </div>
                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateForm('confirmPassword', e.target.value)}
                    icon={Lock}
                    required
                  />
                </>
              )}

              <Button
                type="submit"
                className="w-full"
                loading={loading}
                icon={ArrowRight}
                iconPosition="right"
              >
                {authMethod === 'phone' ? 'Send OTP' : 'Create Account'}
              </Button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form
              key="otp-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerifyOtp}
              className="space-y-6"
            >
              <OtpInput
                length={6}
                value={otp}
                onChange={setOtp}
                error=""
              />
              <Button
                type="submit"
                className="w-full"
                loading={loading}
                icon={ArrowRight}
                iconPosition="right"
              >
                Verify & Create Account
              </Button>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setError('');
                }}
                className="w-full text-sm text-white/60 hover:text-white transition-colors"
              >
                Change phone number
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Footer */}
        {step !== 3 && (
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-white/60">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-violet-400 hover:text-violet-300 font-semibold transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        )}
      </Card>
    </AuthLayout>
  );
}
