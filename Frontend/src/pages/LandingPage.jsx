import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Mic,
  Brain,
  Trophy,
  Users,
  WifiOff,
  ChevronDown,
  Star,
  Zap,
  BookOpen,
  Target,
  ArrowRight,
  Globe,
  MessageCircle,
  Sparkles,
  Play,
  Check,
  Menu,
  X,
} from 'lucide-react';

// Language content
const content = {
  en: {
    nav: {
      features: 'Features',
      testimonials: 'Testimonials',
      faq: 'FAQ',
      login: 'Login',
      getStarted: 'Get Started',
    },
    hero: {
      badge: '🚀 AI-Powered Learning Platform',
      title: 'Learn Smarter.',
      titleHighlight: 'Grow Faster.',
      subtitle: 'DigiMasterJi is your personal AI tutor that adapts to your learning style. Ask questions by voice, earn XP, compete with friends, and learn anytime - even offline!',
      cta: {
        start: 'Start Learning Free',
        demo: 'Watch Demo',
      },
      stats: [
        { value: '10K+', label: 'Active Learners' },
        { value: '50K+', label: 'Questions Answered' },
        { value: '4.9★', label: 'User Rating' },
      ],
    },
    features: {
      badge: 'Why Choose Us',
      title: 'Technology Built to See',
      titleHighlight: 'What Others Can\'t',
      subtitle: 'Powerful features designed to make learning engaging, personalized, and effective for every student.',
      list: [
        {
          icon: Brain,
          title: 'AI-Powered Tutoring',
          description: 'Get personalized explanations and answers from our intelligent AI that adapts to your grade level and learning pace.',
          color: 'orange',
        },
        {
          icon: Mic,
          title: 'Voice-Based Learning',
          description: 'Just speak your questions! Our speech-to-text and text-to-speech features make learning hands-free and accessible.',
          color: 'cyan',
        },
        {
          icon: Trophy,
          title: 'Gamified Experience',
          description: 'Earn XP, maintain streaks, unlock badges, and climb the leaderboard. Learning has never been this fun!',
          color: 'amber',
        },
        {
          icon: Target,
          title: 'Adaptive Quizzes',
          description: 'AI-generated quizzes that test your understanding and help reinforce what you\'ve learned.',
          color: 'emerald',
        },
        {
          icon: Users,
          title: 'Multi-Profile Support',
          description: 'One account for the whole family. Each learner gets their own personalized space and progress tracking.',
          color: 'blue',
        },
        {
          icon: WifiOff,
          title: 'Works Offline',
          description: 'Download lessons and continue learning even without internet. Perfect for learning on the go!',
          color: 'purple',
        },
      ],
    },
    testimonials: {
      badge: 'Testimonials',
      title: 'Loved by Students &',
      titleHighlight: 'Parents Alike',
      list: [
        {
          name: 'Aarav Sharma',
          role: 'Class 8 Student',
          avatar: '🧑‍🎓',
          content: 'DigiMasterJi explains things so much better than my textbook! I love asking questions by voice while doing homework.',
          rating: 5,
        },
        {
          name: 'Priya Patel',
          role: 'Parent of 2',
          avatar: '👩',
          content: 'My kids fight over who gets to learn first! The streak feature keeps them coming back every day. Best education app we\'ve tried.',
          rating: 5,
        },
        {
          name: 'Rohan Gupta',
          role: 'Class 10 Student',
          avatar: '👨‍🎓',
          content: 'The quizzes are challenging but fun. I\'ve improved my science scores significantly since I started using this app.',
          rating: 5,
        },
      ],
    },
    faq: {
      badge: 'FAQ',
      title: 'Frequently Asked',
      titleHighlight: 'Questions',
      list: [
        {
          question: 'Is DigiMasterJi free to use?',
          answer: 'Yes! DigiMasterJi offers a free tier with access to core features including AI tutoring, voice interaction, and basic quizzes. Premium features may be added in the future.',
        },
        {
          question: 'What subjects does DigiMasterJi cover?',
          answer: 'DigiMasterJi covers all major STEM subjects including Mathematics, Science (Physics, Chemistry, Biology), and more. The AI adapts explanations based on your grade level (Classes 1-12).',
        },
        {
          question: 'Can I use it offline?',
          answer: 'Absolutely! DigiMasterJi is a Progressive Web App (PWA) that works offline. You can download lessons and continue learning even without an internet connection.',
        },
        {
          question: 'How does the voice feature work?',
          answer: 'Simply tap the microphone button and ask your question out loud. Our speech-to-text converts your voice to text, and the AI\'s response can be read aloud to you automatically.',
        },
        {
          question: 'Can multiple children use one account?',
          answer: 'Yes! You can create multiple learner profiles under one parent account. Each child gets their own personalized learning experience, progress tracking, and achievements.',
        },
        {
          question: 'What languages are supported?',
          answer: 'Currently, DigiMasterJi supports English and Hindi. We\'re working on adding more regional languages to make learning accessible to everyone.',
        },
      ],
    },
    footer: {
      tagline: 'Your AI-powered learning companion',
      links: {
        product: {
          title: 'Product',
          items: ['Features', 'Quizzes', 'Leaderboard', 'Offline Mode'],
        },
        company: {
          title: 'Company',
          items: ['About Us', 'Contact', 'Careers', 'Blog'],
        },
        support: {
          title: 'Support',
          items: ['Help Center', 'Privacy Policy', 'Terms of Service'],
        },
      },
      copyright: '© 2026 DigiMasterJi. Made with ❤️ for learners everywhere.',
    },
  },
  hi: {
    nav: {
      features: 'विशेषताएं',
      testimonials: 'प्रशंसापत्र',
      faq: 'सवाल-जवाब',
      login: 'लॉगिन',
      getStarted: 'शुरू करें',
    },
    hero: {
      badge: '🚀 AI-संचालित लर्निंग प्लेटफॉर्म',
      title: 'स्मार्ट सीखें।',
      titleHighlight: 'तेज़ी से बढ़ें।',
      subtitle: 'DigiMasterJi आपका व्यक्तिगत AI ट्यूटर है जो आपकी सीखने की शैली के अनुसार ढलता है। आवाज से सवाल पूछें, XP कमाएं, दोस्तों से प्रतिस्पर्धा करें!',
      cta: {
        start: 'मुफ्त में सीखना शुरू करें',
        demo: 'डेमो देखें',
      },
      stats: [
        { value: '10K+', label: 'सक्रिय शिक्षार्थी' },
        { value: '50K+', label: 'सवालों के जवाब' },
        { value: '4.9★', label: 'यूजर रेटिंग' },
      ],
    },
    features: {
      badge: 'हमें क्यों चुनें',
      title: 'तकनीक जो देखती है',
      titleHighlight: 'जो दूसरे नहीं देख सकते',
      subtitle: 'शक्तिशाली विशेषताएं जो सीखने को आकर्षक, व्यक्तिगत और प्रभावी बनाती हैं।',
      list: [
        {
          icon: Brain,
          title: 'AI-संचालित ट्यूटरिंग',
          description: 'हमारे बुद्धिमान AI से व्यक्तिगत स्पष्टीकरण प्राप्त करें जो आपके ग्रेड स्तर के अनुसार अनुकूलित होता है।',
          color: 'orange',
        },
        {
          icon: Mic,
          title: 'वॉइस-आधारित लर्निंग',
          description: 'बस अपने सवाल बोलें! हमारी स्पीच-टू-टेक्स्ट सुविधा सीखने को हैंड्स-फ्री बनाती है।',
          color: 'cyan',
        },
        {
          icon: Trophy,
          title: 'गेमिफाइड अनुभव',
          description: 'XP कमाएं, स्ट्रीक बनाए रखें, बैज अनलॉक करें। सीखना इतना मजेदार कभी नहीं था!',
          color: 'amber',
        },
        {
          icon: Target,
          title: 'एडेप्टिव क्विज़',
          description: 'AI-जनित क्विज़ जो आपकी समझ का परीक्षण करते हैं और सीखने को मजबूत करते हैं।',
          color: 'emerald',
        },
        {
          icon: Users,
          title: 'मल्टी-प्रोफाइल सपोर्ट',
          description: 'पूरे परिवार के लिए एक अकाउंट। हर शिक्षार्थी को अपना व्यक्तिगत स्थान मिलता है।',
          color: 'blue',
        },
        {
          icon: WifiOff,
          title: 'ऑफलाइन काम करता है',
          description: 'बिना इंटरनेट के भी सीखना जारी रखें। चलते-फिरते सीखने के लिए बिल्कुल सही!',
          color: 'purple',
        },
      ],
    },
    testimonials: {
      badge: 'प्रशंसापत्र',
      title: 'छात्रों और माता-पिता',
      titleHighlight: 'दोनों की पसंद',
      list: [
        {
          name: 'आरव शर्मा',
          role: 'कक्षा 8 छात्र',
          avatar: '🧑‍🎓',
          content: 'DigiMasterJi मेरी किताब से बहुत बेहतर समझाता है! मुझे होमवर्क करते समय आवाज से सवाल पूछना पसंद है।',
          rating: 5,
        },
        {
          name: 'प्रिया पटेल',
          role: '2 बच्चों की माँ',
          avatar: '👩',
          content: 'मेरे बच्चे पहले सीखने के लिए लड़ते हैं! स्ट्रीक फीचर उन्हें हर दिन वापस लाता है।',
          rating: 5,
        },
        {
          name: 'रोहन गुप्ता',
          role: 'कक्षा 10 छात्र',
          avatar: '👨‍🎓',
          content: 'क्विज़ चुनौतीपूर्ण लेकिन मजेदार हैं। इस ऐप का उपयोग शुरू करने के बाद मेरे विज्ञान के अंक बढ़ गए हैं।',
          rating: 5,
        },
      ],
    },
    faq: {
      badge: 'सवाल-जवाब',
      title: 'अक्सर पूछे जाने वाले',
      titleHighlight: 'सवाल',
      list: [
        {
          question: 'क्या DigiMasterJi मुफ्त है?',
          answer: 'हाँ! DigiMasterJi AI ट्यूटरिंग, वॉइस इंटरैक्शन और बेसिक क्विज़ सहित कोर फीचर्स तक मुफ्त पहुंच प्रदान करता है।',
        },
        {
          question: 'DigiMasterJi किन विषयों को कवर करता है?',
          answer: 'DigiMasterJi गणित, विज्ञान (भौतिकी, रसायन, जीव विज्ञान) सहित सभी प्रमुख STEM विषयों को कवर करता है।',
        },
        {
          question: 'क्या मैं इसे ऑफलाइन उपयोग कर सकता हूं?',
          answer: 'बिल्कुल! DigiMasterJi एक PWA है जो ऑफलाइन काम करता है। आप बिना इंटरनेट के भी सीखना जारी रख सकते हैं।',
        },
        {
          question: 'वॉइस फीचर कैसे काम करता है?',
          answer: 'बस माइक्रोफोन बटन टैप करें और अपना सवाल बोलें। AI का जवाब आपको स्वचालित रूप से पढ़कर सुनाया जा सकता है।',
        },
        {
          question: 'क्या कई बच्चे एक अकाउंट उपयोग कर सकते हैं?',
          answer: 'हाँ! आप एक पैरेंट अकाउंट के तहत कई लर्नर प्रोफाइल बना सकते हैं। हर बच्चे को अपना व्यक्तिगत अनुभव मिलता है।',
        },
        {
          question: 'कौन सी भाषाएं समर्थित हैं?',
          answer: 'वर्तमान में, DigiMasterJi अंग्रेजी और हिंदी का समर्थन करता है। हम और क्षेत्रीय भाषाएं जोड़ने पर काम कर रहे हैं।',
        },
      ],
    },
    footer: {
      tagline: 'आपका AI-संचालित लर्निंग साथी',
      links: {
        product: {
          title: 'उत्पाद',
          items: ['विशेषताएं', 'क्विज़', 'लीडरबोर्ड', 'ऑफलाइन मोड'],
        },
        company: {
          title: 'कंपनी',
          items: ['हमारे बारे में', 'संपर्क', 'करियर', 'ब्लॉग'],
        },
        support: {
          title: 'सहायता',
          items: ['हेल्प सेंटर', 'गोपनीयता नीति', 'सेवा की शर्तें'],
        },
      },
      copyright: '© 2026 DigiMasterJi. हर जगह शिक्षार्थियों के लिए ❤️ से बनाया।',
    },
  },
};

// Color classes for features
const colorClasses = {
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    icon: 'text-orange-400',
    glow: 'hover:shadow-orange-500/20',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    icon: 'text-cyan-400',
    glow: 'hover:shadow-cyan-500/20',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: 'text-amber-400',
    glow: 'hover:shadow-amber-500/20',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: 'text-emerald-400',
    glow: 'hover:shadow-emerald-500/20',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: 'text-blue-400',
    glow: 'hover:shadow-blue-500/20',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    icon: 'text-purple-400',
    glow: 'hover:shadow-purple-500/20',
  },
};

// FAQ Item Component
function FAQItem({ question, answer, isOpen, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="border border-white/[0.08] rounded-2xl overflow-hidden bg-white/[0.02] backdrop-blur-sm"
    >
      <motion.button
        onClick={onClick}
        whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
        className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors"
      >
        <span className="font-semibold text-white pr-4">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-orange-400" />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="px-6 pb-5 text-white/60 leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Floating 3D Element Component
function Float3D({ children, delay = 0, duration = 6, className = '' }) {
  return (
    <motion.div
      animate={{
        y: [0, -20, 0],
        rotateY: [0, 10, 0],
        rotateX: [0, 5, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: 'easeInOut'
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const [language, setLanguage] = useState('en');
  const [openFAQ, setOpenFAQ] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const t = content[language];

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  return (
    <div className="min-h-screen bg-[#050816] overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Mesh */}
        <div className="absolute inset-0 bg-gradient-mesh opacity-50" />

        {/* Animated Orbs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -70, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]"
        />

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />

        {/* Glowing Lines */}
        <motion.div
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent"
        />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
            ? 'bg-[#050816]/80 backdrop-blur-xl border-b border-white/[0.05]'
            : ''
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-orange-500/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-lg">
                  <img src="/logo.jpeg" alt="DigiMasterJi" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  DigiMaster<span className="text-orange-400">Ji</span>
                </h1>
                <p className="text-[10px] text-white/40 tracking-wider uppercase">AI Learning Companion</p>
              </div>
            </motion.div>

            {/* Desktop Nav Links */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden md:flex items-center gap-8"
            >
              {['features', 'testimonials', 'faq'].map((item) => (
                <motion.a
                  key={item}
                  href={`#${item}`}
                  whileHover={{ y: -2 }}
                  className="text-white/60 hover:text-white transition-colors text-sm font-medium relative group"
                >
                  {t.nav[item]}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-400 to-cyan-400 group-hover:w-full transition-all duration-300" />
                </motion.a>
              ))}
            </motion.div>

            {/* Right Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              {/* Language Toggle */}
              <motion.button
                onClick={toggleLanguage}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] transition-all text-sm"
              >
                <Globe className="w-4 h-4 text-orange-400" />
                <span className="text-white font-medium">{language === 'en' ? 'हिं' : 'EN'}</span>
              </motion.button>

              <Link
                to="/login"
                className="text-white/60 hover:text-white transition-colors text-sm font-medium hidden sm:block px-4 py-2"
              >
                {t.nav.login}
              </Link>
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-500/25 transition-all hidden sm:block"
                >
                  {t.nav.getStarted}
                </motion.button>
              </Link>

              {/* Mobile Menu Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#050816]/95 backdrop-blur-xl border-t border-white/[0.05]"
            >
              <div className="px-4 py-6 space-y-4">
                {['features', 'testimonials', 'faq'].map((item) => (
                  <a
                    key={item}
                    href={`#${item}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-white/70 hover:text-white py-2 text-lg font-medium"
                  >
                    {t.nav[item]}
                  </a>
                ))}
                <div className="pt-4 flex flex-col gap-3">
                  <Link to="/login" className="text-center text-white/70 py-3">
                    {t.nav.login}
                  </Link>
                  <Link
                    to="/register"
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl text-center"
                  >
                    {t.nav.getStarted}
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative z-10 min-h-screen flex items-center pt-20">
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="w-full px-4 sm:px-6 py-20"
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6"
                >
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-orange-300">{t.hero.badge}</span>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1]"
                >
                  {t.hero.title}
                  <br />
                  <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-cyan-400 bg-clip-text text-transparent">
                    {t.hero.titleHighlight}
                  </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg text-white/50 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed"
                >
                  {t.hero.subtitle}
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12"
                >
                  <Link to="/register">
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-semibold rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      {t.hero.cta.start}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full sm:w-auto px-8 py-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.1] text-white font-semibold rounded-2xl backdrop-blur-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5 text-orange-400" />
                    {t.hero.cta.demo}
                  </motion.button>
                </motion.div>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-wrap items-center justify-center lg:justify-start gap-8"
                >
                  {t.hero.stats.map((stat, index) => (
                    <div key={index} className="text-center lg:text-left">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.7 + index * 0.1, type: 'spring' }}
                        className="text-3xl font-bold text-white mb-1"
                      >
                        {stat.value}
                      </motion.div>
                      <div className="text-sm text-white/40">{stat.label}</div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Right Visual - 3D Floating Elements */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="relative hidden lg:block"
              >
                <div className="relative w-full aspect-square max-w-lg mx-auto">
                  {/* Central Glow */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="w-64 h-64 bg-orange-500/20 rounded-full blur-[80px]"
                    />
                  </div>

                  {/* Main Chat Card */}
                  <Float3D delay={0} duration={5} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80">
                    <div className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.1] rounded-3xl p-6 shadow-2xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl overflow-hidden">
                          <img src="/logo.jpeg" alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">DigiMasterJi</p>
                          <p className="text-emerald-400 text-xs flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Online
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-white/[0.05] rounded-2xl rounded-bl-md p-3">
                          <p className="text-white/80 text-sm">Hello! What would you like to learn today? 📚</p>
                        </div>
                        <div className="bg-orange-500/20 rounded-2xl rounded-br-md p-3 ml-8">
                          <p className="text-white text-sm">Explain photosynthesis 🌱</p>
                        </div>
                      </div>
                    </div>
                  </Float3D>

                  {/* Floating XP Badge */}
                  <Float3D delay={1} duration={6} className="absolute top-8 right-8">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-emerald-400" />
                        <div>
                          <p className="text-white font-bold">+50 XP</p>
                          <p className="text-emerald-300 text-xs">Earned!</p>
                        </div>
                      </div>
                    </div>
                  </Float3D>

                  {/* Floating Streak Badge */}
                  <Float3D delay={2} duration={7} className="absolute bottom-16 left-0">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🔥</span>
                        <div>
                          <p className="text-white font-bold">7 Days</p>
                          <p className="text-amber-300 text-xs">Streak!</p>
                        </div>
                      </div>
                    </div>
                  </Float3D>

                  {/* Floating Trophy */}
                  <Float3D delay={0.5} duration={5.5} className="absolute top-20 left-4">
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl px-4 py-3 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-purple-400" />
                        <p className="text-purple-300 text-sm font-medium">Level 12</p>
                      </div>
                    </div>
                  </Float3D>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-white/30 text-xs uppercase tracking-wider">Scroll</span>
            <ChevronDown className="w-5 h-5 text-white/30" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-4 sm:px-6 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6"
            >
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-orange-300">{t.features.badge}</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-5xl font-bold text-white mb-6"
            >
              {t.features.title}{' '}
              <span className="bg-gradient-to-r from-orange-400 to-cyan-400 bg-clip-text text-transparent">
                {t.features.titleHighlight}
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-lg text-white/50"
            >
              {t.features.subtitle}
            </motion.p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.features.list.map((feature, index) => {
              const Icon = feature.icon;
              const colors = colorClasses[feature.color];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className={`group relative ${colors.bg} border ${colors.border} rounded-3xl p-8 backdrop-blur-sm transition-all duration-500 hover:shadow-2xl ${colors.glow}`}
                >
                  {/* Hover Glow */}
                  <div className={`absolute inset-0 rounded-3xl ${colors.bg} opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500`} />

                  <div className="relative">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center mb-6 border ${colors.border}`}
                    >
                      <Icon className={`w-7 h-7 ${colors.icon}`} />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                    <p className="text-white/50 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 px-4 sm:px-6 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6"
            >
              <MessageCircle className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-300">{t.testimonials.badge}</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-5xl font-bold text-white mb-6"
            >
              {t.testimonials.title}{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {t.testimonials.titleHighlight}
              </span>
            </motion.h2>
          </div>

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {t.testimonials.list.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-3xl p-8 transition-all duration-300 hover:border-white/[0.15]"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-white/70 leading-relaxed mb-6">"{testimonial.content}"</p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-cyan-500/20 rounded-full flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{testimonial.name}</p>
                    <p className="text-white/40 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 px-4 sm:px-6 py-24 sm:py-32">
        <div className="max-w-3xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6"
            >
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">{t.faq.badge}</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-5xl font-bold text-white mb-6"
            >
              {t.faq.title}{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t.faq.titleHighlight}
              </span>
            </motion.h2>
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {t.faq.list.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === index}
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 sm:px-6 py-24 sm:py-32">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-orange-500/10 to-cyan-500/10 border border-orange-500/20 rounded-[2rem] p-10 sm:p-16 text-center backdrop-blur-sm overflow-hidden"
          >
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-cyan-500/5" />
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute top-0 left-1/4 w-64 h-64 bg-orange-500/20 rounded-full blur-[100px]"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.15, 0.1] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              className="absolute bottom-0 right-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-[100px]"
            />

            <div className="relative z-10">
              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-6xl mb-8"
              >
                🚀
              </motion.div>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                {language === 'en' ? 'Ready to Start Learning?' : 'सीखना शुरू करने के लिए तैयार?'}
              </h2>
              <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto">
                {language === 'en'
                  ? 'Join thousands of students who are learning smarter with DigiMasterJi. It\'s free to get started!'
                  : 'हजारों छात्रों से जुड़ें जो DigiMasterJi के साथ स्मार्ट तरीके से सीख रहे हैं। शुरू करना मुफ्त है!'
                }
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="group w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-semibold rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 text-lg"
                  >
                    {language === 'en' ? 'Create Free Account' : 'मुफ्त अकाउंट बनाएं'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
                <Link to="/login">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full sm:w-auto px-10 py-5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.1] text-white font-semibold rounded-2xl backdrop-blur-sm transition-all text-lg"
                  >
                    {language === 'en' ? 'Sign In' : 'साइन इन करें'}
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 sm:px-6 py-16 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-16">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl overflow-hidden">
                  <img src="/logo.jpeg" alt="DigiMasterJi" className="w-full h-full object-cover" />
                </div>
                <span className="text-xl font-bold text-white">
                  DigiMaster<span className="text-orange-400">Ji</span>
                </span>
              </div>
              <p className="text-white/40 text-sm">{t.footer.tagline}</p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">{t.footer.links.product.title}</h4>
              <ul className="space-y-3">
                {t.footer.links.product.items.map((item, i) => (
                  <li key={i}>
                    <motion.a
                      href="#"
                      whileHover={{ x: 3 }}
                      className="text-white/40 hover:text-white text-sm transition-colors inline-block"
                    >
                      {item}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">{t.footer.links.company.title}</h4>
              <ul className="space-y-3">
                {t.footer.links.company.items.map((item, i) => (
                  <li key={i}>
                    <motion.a
                      href="#"
                      whileHover={{ x: 3 }}
                      className="text-white/40 hover:text-white text-sm transition-colors inline-block"
                    >
                      {item}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">{t.footer.links.support.title}</h4>
              <ul className="space-y-3">
                {t.footer.links.support.items.map((item, i) => (
                  <li key={i}>
                    <motion.a
                      href="#"
                      whileHover={{ x: 3 }}
                      className="text-white/40 hover:text-white text-sm transition-colors inline-block"
                    >
                      {item}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-white/[0.05] text-center">
            <p className="text-white/30 text-sm">{t.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
