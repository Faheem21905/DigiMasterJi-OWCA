import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, ArrowRight, Smartphone, Lock, User, CheckCircle2, AlertCircle } from 'lucide-react';
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
    if (score >= 2) return { strength: 3, label: 'Good', color: 'bg-orange-500' };
    return { strength: 2, label: 'Fair', color: 'bg-amber-500' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <AuthLayout>
      <Card variant="glass" className="p-8 backdrop-blur-2xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: step >= s ? 1 : 0.8,
                  backgroundColor: step >= s ? 'rgb(249, 115, 22)' : 'rgba(255,255,255,0.1)',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= s ? 'text-white shadow-lg shadow-orange-500/30' : 'text-white/40'
                  }`}
              >
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </motion.div>
              {s < 3 && (
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: step > s ? 'rgb(249, 115, 22)' : 'rgba(255,255,255,0.1)',
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
              <p className="text-white/50">Start your learning adventure today</p>
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
              <p className="text-white/50">
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
              <p className="text-white/50">Your account has been created successfully</p>
              <p className="text-sm text-orange-400 mt-4">Redirecting to profiles...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Method Toggle (only on step 1) */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2 p-1.5 bg-white/[0.03] rounded-xl mb-6 border border-white/[0.06]"
          >
            <motion.button
              onClick={() => {
                setAuthMethod('phone');
                setError('');
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all duration-300 ${authMethod === 'phone'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
                }`}
            >
              <Phone className="w-4 h-4" />
              Phone
            </motion.button>
            <motion.button
              onClick={() => {
                setAuthMethod('email');
                setError('');
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all duration-300 ${authMethod === 'email'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
                }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </motion.button>
          </motion.div>
        )}

        {/* Error Message */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-400">{error}</p>
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
              transition={{ duration: 0.3 }}
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
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2"
                      >
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4].map((level) => (
                            <motion.div
                              key={level}
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: level <= passwordStrength.strength ? 1 : 0.5 }}
                              className={`h-1.5 flex-1 rounded-full transition-colors origin-left ${level <= passwordStrength.strength
                                ? passwordStrength.color
                                : 'bg-white/10'
                                }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs ${passwordStrength.color?.replace('bg-', 'text-')}`}>
                          {passwordStrength.label}
                        </p>
                      </motion.div>
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
                fullWidth
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
              transition={{ duration: 0.3 }}
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
                fullWidth
                loading={loading}
                icon={ArrowRight}
                iconPosition="right"
              >
                Verify & Create Account
              </Button>
              <motion.button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp('');
                  setError('');
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full text-sm text-white/50 hover:text-white transition-colors py-2"
              >
                Change phone number
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Footer */}
        {step !== 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 pt-6 border-t border-white/[0.06] text-center"
          >
            <p className="text-white/50">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-orange-400 hover:text-orange-300 font-semibold transition-colors"
              >
                Sign In
              </Link>
            </p>
          </motion.div>
        )}
      </Card>
    </AuthLayout>
  );
}
