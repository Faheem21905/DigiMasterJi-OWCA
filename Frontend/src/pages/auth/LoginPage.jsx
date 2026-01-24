import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, ArrowRight, Smartphone, Lock, User } from 'lucide-react';
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
      <Card className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back!</h2>
          <p className="text-white/60">Sign in to continue your learning journey</p>
        </div>

        {/* Auth Method Toggle */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-6">
          <button
            onClick={() => {
              setAuthMethod('phone');
              setStep('input');
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
              setStep('input');
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
          {authMethod === 'phone' ? (
            step === 'input' ? (
              <motion.form
                key="phone-input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
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
                  className="w-full"
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
                onSubmit={handleVerifyOtp}
                className="space-y-6"
              >
                <div className="text-center mb-4">
                  <p className="text-white/60 text-sm">
                    Enter the 6-digit code sent to
                  </p>
                  <p className="text-white font-semibold">+91 {phone}</p>
                </div>
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
                  Verify & Login
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('input');
                    setOtp('');
                    setError('');
                  }}
                  className="w-full text-sm text-white/60 hover:text-white transition-colors"
                >
                  Change phone number
                </button>
              </motion.form>
            )
          ) : (
            <motion.form
              key="email-input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
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
                className="w-full"
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
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-white/60">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-violet-400 hover:text-violet-300 font-semibold transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </Card>
    </AuthLayout>
  );
}
