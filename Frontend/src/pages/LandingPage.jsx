import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Mic,
  Brain,
  Trophy,
  Users,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  Star,
  Zap,
  BookOpen,
  Target,
  ArrowRight,
  Play,
  Globe,
  MessageCircle,
  Award,
  TrendingUp,
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
      title: 'Learn Smarter with Your',
      titleHighlight: 'AI Study Buddy',
      subtitle: 'DigiMasterJi is your personal AI tutor that adapts to your learning style. Ask questions by voice, earn XP, compete with friends, and learn anytime - even offline!',
      cta: {
        start: 'Start Learning Free',
        login: 'I have an account',
      },
      stats: [
        { value: '10K+', label: 'Active Learners' },
        { value: '50K+', label: 'Questions Answered' },
        { value: '4.9★', label: 'User Rating' },
      ],
    },
    features: {
      badge: 'Why Choose Us',
      title: 'Everything You Need to',
      titleHighlight: 'Excel in Learning',
      subtitle: 'Powerful features designed to make learning engaging, personalized, and effective.',
      list: [
        {
          icon: Brain,
          title: 'AI-Powered Tutoring',
          description: 'Get personalized explanations and answers from our intelligent AI that adapts to your grade level and learning pace.',
          color: 'violet',
        },
        {
          icon: Mic,
          title: 'Voice-Based Learning',
          description: 'Just speak your questions! Our speech-to-text and text-to-speech features make learning hands-free and accessible.',
          color: 'rose',
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
          color: 'cyan',
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
      copyright: '© 2025 DigiMasterJi. Made with ❤️ for learners everywhere.',
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
      title: 'अपने AI स्टडी बडी के साथ',
      titleHighlight: 'स्मार्ट तरीके से सीखें',
      subtitle: 'DigiMasterJi आपका व्यक्तिगत AI ट्यूटर है जो आपकी सीखने की शैली के अनुसार ढलता है। आवाज से सवाल पूछें, XP कमाएं, दोस्तों से प्रतिस्पर्धा करें!',
      cta: {
        start: 'मुफ्त में सीखना शुरू करें',
        login: 'मेरा अकाउंट है',
      },
      stats: [
        { value: '10K+', label: 'सक्रिय शिक्षार्थी' },
        { value: '50K+', label: 'सवालों के जवाब' },
        { value: '4.9★', label: 'यूजर रेटिंग' },
      ],
    },
    features: {
      badge: 'हमें क्यों चुनें',
      title: 'सीखने में उत्कृष्टता के लिए',
      titleHighlight: 'सब कुछ जो आपको चाहिए',
      subtitle: 'शक्तिशाली विशेषताएं जो सीखने को आकर्षक, व्यक्तिगत और प्रभावी बनाती हैं।',
      list: [
        {
          icon: Brain,
          title: 'AI-संचालित ट्यूटरिंग',
          description: 'हमारे बुद्धिमान AI से व्यक्तिगत स्पष्टीकरण प्राप्त करें जो आपके ग्रेड स्तर के अनुसार अनुकूलित होता है।',
          color: 'violet',
        },
        {
          icon: Mic,
          title: 'वॉइस-आधारित लर्निंग',
          description: 'बस अपने सवाल बोलें! हमारी स्पीच-टू-टेक्स्ट सुविधा सीखने को हैंड्स-फ्री बनाती है।',
          color: 'rose',
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
          color: 'cyan',
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
      copyright: '© 2025 DigiMasterJi. हर जगह शिक्षार्थियों के लिए ❤️ से बनाया।',
    },
  },
};

// Color classes for features
const colorClasses = {
  violet: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    icon: 'text-violet-400',
    glow: 'shadow-violet-500/20',
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    icon: 'text-rose-400',
    glow: 'shadow-rose-500/20',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    icon: 'text-amber-400',
    glow: 'shadow-amber-500/20',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    icon: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    icon: 'text-blue-400',
    glow: 'shadow-blue-500/20',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    icon: 'text-cyan-400',
    glow: 'shadow-cyan-500/20',
  },
};

// FAQ Item Component
function FAQItem({ question, answer, isOpen, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="border border-white/10 rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm"
    >
      <button
        onClick={onClick}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
      >
        <span className="font-semibold text-white pr-4">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-violet-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-6 pb-5 text-white/70 leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function LandingPage() {
  const [language, setLanguage] = useState('en');
  const [openFAQ, setOpenFAQ] = useState(null);
  const t = content[language];

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -50, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-purple-600/15 rounded-full blur-3xl"
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl blur opacity-30" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white tracking-tight">
                DigiMaster<span className="text-violet-400">Ji</span>
              </h1>
              <p className="text-[10px] text-white/50 tracking-wider">AI LEARNING COMPANION</p>
            </div>
          </motion.div>

          {/* Nav Links - Desktop */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden md:flex items-center gap-8"
          >
            <a href="#features" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
              {t.nav.features}
            </a>
            <a href="#testimonials" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
              {t.nav.testimonials}
            </a>
            <a href="#faq" className="text-white/70 hover:text-white transition-colors text-sm font-medium">
              {t.nav.faq}
            </a>
          </motion.div>

          {/* Right Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 sm:gap-4"
          >
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm"
            >
              <Globe className="w-4 h-4 text-violet-400" />
              <span className="text-white font-medium">{language === 'en' ? 'हिं' : 'EN'}</span>
            </button>

            <Link
              to="/login"
              className="text-white/70 hover:text-white transition-colors text-sm font-medium hidden sm:block"
            >
              {t.nav.login}
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-500/25 transition-all"
            >
              {t.nav.getStarted}
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-4 sm:px-6 pt-12 sm:pt-20 pb-20 sm:pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6"
            >
              <span className="text-sm text-violet-300">{t.hero.badge}</span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
            >
              {t.hero.title}{' '}
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                {t.hero.titleHighlight}
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg sm:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              {t.hero.subtitle}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <Link
                to="/register"
                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-2"
              >
                {t.hero.cta.start}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-semibold rounded-2xl backdrop-blur-sm transition-all flex items-center justify-center gap-2"
              >
                {t.hero.cta.login}
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-8 sm:gap-16"
            >
              {t.hero.stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-white/50">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-16 sm:mt-24 relative"
          >
            <div className="relative max-w-4xl mx-auto">
              {/* Main Chat Preview Card */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
                {/* Chat Header */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">DigiMasterJi</h3>
                    <p className="text-white/50 text-sm flex items-center gap-1">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                      AI Tutor • Online
                    </p>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="space-y-4">
                  {/* User Message */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 }}
                    className="flex justify-end"
                  >
                    <div className="bg-violet-600 text-white px-4 py-3 rounded-2xl rounded-br-md max-w-xs">
                      <p className="text-sm">{language === 'en' ? "What is photosynthesis? 🌱" : "प्रकाश संश्लेषण क्या है? 🌱"}</p>
                    </div>
                  </motion.div>

                  {/* AI Response */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.3 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/10 text-white px-4 py-3 rounded-2xl rounded-bl-md max-w-sm">
                      <p className="text-sm leading-relaxed">
                        {language === 'en' 
                          ? "Great question! 🌿 Photosynthesis is how plants make their food using sunlight, water, and CO₂. Think of leaves as tiny food factories powered by the sun! ☀️"
                          : "बढ़िया सवाल! 🌿 प्रकाश संश्लेषण वह प्रक्रिया है जिससे पौधे सूर्य की रोशनी, पानी और CO₂ का उपयोग करके भोजन बनाते हैं। पत्तियों को सूर्य द्वारा संचालित छोटे भोजन कारखानों की तरह सोचें! ☀️"
                        }
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Input Area */}
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/50 text-sm">
                    {language === 'en' ? "Ask me anything..." : "मुझसे कुछ भी पूछें..."}
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/30">
                    <Mic className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-6 -left-6 sm:-left-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 backdrop-blur-sm hidden sm:block"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <p className="text-white font-bold text-lg">7</p>
                    <p className="text-amber-300 text-xs">{language === 'en' ? 'Day Streak' : 'दिन की स्ट्रीक'}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-6 -right-6 sm:-right-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3 backdrop-blur-sm hidden sm:block"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <p className="text-white font-bold text-lg">+50 XP</p>
                    <p className="text-emerald-300 text-xs">{language === 'en' ? 'Earned!' : 'मिला!'}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity }}
                className="absolute top-1/2 -right-4 sm:-right-16 bg-violet-500/10 border border-violet-500/20 rounded-2xl px-4 py-3 backdrop-blur-sm hidden lg:block"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <p className="text-violet-300 text-sm font-medium">{language === 'en' ? 'Level 12' : 'लेवल 12'}</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-4 sm:px-6 py-20 sm:py-32">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6"
            >
              <Zap className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300">{t.features.badge}</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
            >
              {t.features.title}{' '}
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                {t.features.titleHighlight}
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-lg text-white/60"
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
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className={`${colors.bg} border ${colors.border} rounded-3xl p-6 sm:p-8 backdrop-blur-sm transition-all hover:shadow-xl ${colors.glow}`}
                >
                  <div className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center mb-6`}>
                    <Icon className={`w-7 h-7 ${colors.icon}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-white/60 leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 px-4 sm:px-6 py-20 sm:py-32 bg-gradient-to-b from-transparent via-violet-950/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6"
            >
              <MessageCircle className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300">{t.testimonials.badge}</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
            >
              {t.testimonials.title}{' '}
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                {t.testimonials.titleHighlight}
              </span>
            </motion.h2>
          </div>

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {t.testimonials.list.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 sm:p-8"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                
                {/* Content */}
                <p className="text-white/80 leading-relaxed mb-6">"{testimonial.content}"</p>
                
                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500/30 to-indigo-500/30 rounded-full flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{testimonial.name}</p>
                    <p className="text-white/50 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 px-4 sm:px-6 py-20 sm:py-32">
        <div className="max-w-3xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6"
            >
              <BookOpen className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300">{t.faq.badge}</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"
            >
              {t.faq.title}{' '}
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
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
      <section className="relative z-10 px-4 sm:px-6 py-20 sm:py-32">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 rounded-3xl p-8 sm:p-12 text-center backdrop-blur-sm relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-transparent to-indigo-600/10" />
            
            <div className="relative z-10">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-6"
              >
                🚀
              </motion.div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                {language === 'en' ? 'Ready to Start Learning?' : 'सीखना शुरू करने के लिए तैयार?'}
              </h2>
              <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
                {language === 'en' 
                  ? 'Join thousands of students who are learning smarter with DigiMasterJi. It\'s free to get started!'
                  : 'हजारों छात्रों से जुड़ें जो DigiMasterJi के साथ स्मार्ट तरीके से सीख रहे हैं। शुरू करना मुफ्त है!'
                }
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-violet-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {language === 'en' ? 'Create Free Account' : 'मुफ्त अकाउंट बनाएं'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-semibold rounded-2xl backdrop-blur-sm transition-all"
                >
                  {language === 'en' ? 'Sign In' : 'साइन इन करें'}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 sm:px-6 py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  DigiMaster<span className="text-violet-400">Ji</span>
                </span>
              </div>
              <p className="text-white/50 text-sm">{t.footer.tagline}</p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">{t.footer.links.product.title}</h4>
              <ul className="space-y-2">
                {t.footer.links.product.items.map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">{t.footer.links.company.title}</h4>
              <ul className="space-y-2">
                {t.footer.links.company.items.map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">{t.footer.links.support.title}</h4>
              <ul className="space-y-2">
                {t.footer.links.support.items.map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-white/50 hover:text-white text-sm transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-white/10 text-center">
            <p className="text-white/40 text-sm">{t.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
