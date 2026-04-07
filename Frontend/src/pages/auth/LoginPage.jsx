import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, ArrowRight, Smartphone, Lock, AlertCircle } from 'lucide-react';
import { AuthLayout } from '../../components/layouts';
import { Button, Input, OtpInput, Card } from '../../components/ui';
import { authApi } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [authMethod, setAuthMethod] = useState('phone'); // 'phone' or 'email'
  const [step, setStep] = useState('input'); // 'input' or 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Phone auth state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  // Email auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const validatePhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePhone(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      await authApi.sendOtp(phone);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
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
      await login({ phone, otp });
      navigate('/profiles');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await login({ username: email, password });
      navigate('/profiles');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card variant="glass" className="p-8 backdrop-blur-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back!</h2>
          <p className="text-white/50">Sign in to continue your learning journey</p>
        </motion.div>

        {/* Auth Method Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 p-1.5 bg-white/[0.03] rounded-xl mb-6 border border-white/[0.06]"
        >
          <motion.button
            onClick={() => {
              setAuthMethod('phone');
              setStep('input');
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
              setStep('input');
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
          {authMethod === 'phone' ? (
            step === 'input' ? (
              <motion.form
                key="phone-input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSendOtp}
                className="space-y-6"
              >
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="Enter your 10-digit phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  icon={Smartphone}
                  required
                />
                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Send OTP
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="otp-input"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleVerifyOtp}
                className="space-y-6"
              >
                <div className="text-center mb-4">
                  <p className="text-white/50 text-sm">
                    Enter the 6-digit code sent to
                  </p>
                  <p className="text-white font-semibold mt-1">+91 {phone}</p>
                </div>
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
                  Verify & Login
                </Button>
                <motion.button
                  type="button"
                  onClick={() => {
                    setStep('input');
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
            )
          ) : (
            <motion.form
              key="email-input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleEmailLogin}
              className="space-y-6"
            >
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                required
              />
              <Button
                type="submit"
                fullWidth
                loading={loading}
                icon={ArrowRight}
                iconPosition="right"
              >
                Sign In
              </Button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 pt-6 border-t border-white/[0.06] text-center"
        >
          <p className="text-white/50">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-orange-400 hover:text-orange-300 font-semibold transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </motion.div>
      </Card>
    </AuthLayout>
  );
}
