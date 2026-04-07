import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings, LogOut, Edit2, Trash2, Shield, Zap } from 'lucide-react';
import { profilesApi } from '../../api/profiles';
import { Button, Card, NetworkStatusBadge, LowBandwidthToggle } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';

// Avatar options with gradients - updated to match new theme
const avatarOptions = [
  { id: 1, emoji: '🦊', gradient: 'from-orange-500 to-amber-600', glow: 'shadow-orange-500/30' },
  { id: 2, emoji: '🐼', gradient: 'from-slate-400 to-slate-600', glow: 'shadow-slate-500/30' },
  { id: 3, emoji: '🦁', gradient: 'from-amber-400 to-orange-500', glow: 'shadow-amber-500/30' },
  { id: 4, emoji: '🐯', gradient: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/30' },
  { id: 5, emoji: '🐨', gradient: 'from-gray-400 to-gray-500', glow: 'shadow-gray-500/30' },
  { id: 6, emoji: '🐸', gradient: 'from-emerald-400 to-green-500', glow: 'shadow-emerald-500/30' },
  { id: 7, emoji: '🦋', gradient: 'from-cyan-400 to-blue-500', glow: 'shadow-cyan-500/30' },
  { id: 8, emoji: '🦄', gradient: 'from-pink-400 to-rose-500', glow: 'shadow-pink-500/30' },
  { id: 9, emoji: '🐙', gradient: 'from-purple-400 to-violet-500', glow: 'shadow-purple-500/30' },
  { id: 10, emoji: '🦉', gradient: 'from-amber-600 to-yellow-700', glow: 'shadow-amber-600/30' },
  { id: 11, emoji: '🐬', gradient: 'from-cyan-400 to-blue-500', glow: 'shadow-cyan-500/30' },
  { id: 12, emoji: '🦜', gradient: 'from-emerald-400 to-teal-500', glow: 'shadow-emerald-500/30' },
];

// Handle both numeric id and string avatar from backend (e.g., "avatar_1.png" or just 1)
const getAvatarById = (avatarValue) => {
  if (typeof avatarValue === 'number') {
    return avatarOptions.find((a) => a.id === avatarValue) || avatarOptions[0];
  }
  if (typeof avatarValue === 'string') {
    // Extract number from string like "avatar_1.png"
    const match = avatarValue.match(/(\d+)/);
    if (match) {
      const id = parseInt(match[1], 10);
      return avatarOptions.find((a) => a.id === id) || avatarOptions[0];
    }
  }
  return avatarOptions[0];
};

export default function ProfileSelectionPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { profiles, loading, refreshProfiles, activateProfile } = useProfile();

  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isManaging, setIsManaging] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isActivating, setIsActivating] = useState(false); // Prevent double-activation

  // Check if running locally
  const isLocalhost = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '::1';

  useEffect(() => {
    refreshProfiles();
  }, [refreshProfiles]);

  const handleSelectProfile = async (profile) => {
    if (isManaging) return;

    // Backend returns _id, handle both id and _id
    const profileId = profile._id || profile.id;

    // Prevent double-clicking or re-activation
    if (selectedProfile || isActivating) return;

    setSelectedProfile(profileId);
    setIsActivating(true);

    try {
      await activateProfile(profileId);

      // Navigate immediately - animation is handled by CSS transitions
      navigate('/chat');
    } catch (err) {
      console.error('Failed to access profile:', err);
      setSelectedProfile(null);
      setIsActivating(false);
    }
  };

  const handleDeleteProfile = async (profile) => {
    const profileId = profile._id || profile.id;
    setDeletingId(profileId);
    try {
      await profilesApi.deleteProfile(profileId);
      await refreshProfiles();
    } catch (err) {
      console.error('Failed to delete profile:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-[#050816] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
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
            x: [0, -50, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
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

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-orange-500/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg">
              <img src="/logo.jpeg" alt="DigiMasterJi" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="hidden sm:block">
            <span className="text-xl font-bold text-white">
              DigiMaster<span className="text-orange-400">Ji</span>
            </span>
          </div>
          {/* Network Status Badge */}
          <NetworkStatusBadge variant="pill" size="sm" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 sm:gap-3"
        >
          {/* Low Bandwidth Toggle - For rural users with poor connectivity */}
          <LowBandwidthToggle size="md" showTooltip={true} />

          {/* Admin button - only show on localhost */}
          {isLocalhost && (
            <Button
              variant="ghost"
              size="sm"
              icon={Shield}
              onClick={() => navigate('/admin')}
              className="hidden sm:flex"
            >
              Admin
            </Button>
          )}

          {/* Settings - Offline Model Management */}
          <Button
            variant="ghost"
            size="sm"
            icon={Settings}
            onClick={() => navigate('/settings')}
            className="hidden sm:flex"
          >
            Settings
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={Edit2}
            onClick={() => setIsManaging(!isManaging)}
          >
            {isManaging ? 'Done' : 'Manage'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={LogOut}
            onClick={handleLogout}
          >
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </motion.div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6"
          >
            <Zap className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-orange-300">Select Your Profile</span>
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">Who's Learning Today?</h1>
          <p className="text-lg text-white/50">Choose a profile to continue your journey</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 max-w-5xl"
          >
            {/* Existing Profiles */}
            <AnimatePresence>
              {profiles.map((profile) => {
                const profileId = profile._id || profile.id;
                const avatar = getAvatarById(profile.avatar);
                return (
                  <motion.div
                    key={profileId}
                    variants={itemVariants}
                    exit={{ opacity: 0, scale: 0.8 }}
                    layout
                    className="relative group"
                  >
                    <motion.button
                      onClick={() => handleSelectProfile(profile)}
                      whileHover={!isManaging ? { scale: 1.05, y: -5 } : {}}
                      whileTap={!isManaging ? { scale: 0.95 } : {}}
                      className={`
                        relative flex flex-col items-center p-4 sm:p-6 rounded-2xl w-full
                        bg-white/[0.03] backdrop-blur-sm border border-white/[0.08]
                        transition-all duration-500
                        ${!isManaging ? 'hover:bg-white/[0.06] hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/10 cursor-pointer' : ''}
                        ${selectedProfile === profileId ? 'ring-2 ring-orange-500 border-transparent bg-orange-500/10' : ''}
                      `}
                    >
                      {/* Avatar */}
                      <motion.div
                        whileHover={!isManaging ? { rotate: [0, -5, 5, 0] } : {}}
                        transition={{ duration: 0.5 }}
                        className={`
                          relative w-20 h-20 sm:w-24 sm:h-24 rounded-full mb-4
                          bg-gradient-to-br ${avatar.gradient}
                          flex items-center justify-center
                          shadow-lg ${avatar.glow}
                          group-hover:shadow-xl transition-shadow duration-300
                        `}
                      >
                        <span className="text-3xl sm:text-4xl">{avatar.emoji}</span>

                        {/* Selection indicator */}
                        {selectedProfile === profileId && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-0 rounded-full border-4 border-white"
                          />
                        )}

                        {/* Glow effect on hover */}
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${avatar.gradient} opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500`} />
                      </motion.div>

                      {/* Name */}
                      <span className="text-base sm:text-lg font-semibold text-white mb-1">
                        {profile.name}
                      </span>

                      {/* Grade/Level - backend uses grade_level */}
                      <span className="text-xs sm:text-sm text-white/40">
                        {profile.grade_level || `Grade ${profile.grade}`}
                      </span>

                      {/* XP Badge - backend uses gamification.xp */}
                      {(profile.gamification?.xp > 0 || profile.xp > 0) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="mt-3 px-3 py-1 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-full border border-orange-500/20"
                        >
                          <span className="text-xs text-orange-300 font-medium flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {profile.gamification?.xp || profile.xp} XP
                          </span>
                        </motion.div>
                      )}
                    </motion.button>

                    {/* Management Actions */}
                    {isManaging && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -top-2 -right-2 flex gap-1"
                      >
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => navigate(`/profiles/${profileId}/edit`)}
                          className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-white" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteProfile(profile)}
                          disabled={deletingId === profileId}
                          className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/30 hover:bg-rose-400 transition-colors disabled:opacity-50"
                        >
                          {deletingId === profileId ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-white" />
                          )}
                        </motion.button>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Add Profile Button */}
            <motion.button
              variants={itemVariants}
              onClick={() => navigate('/profiles/create')}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className="
                flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl
                bg-white/[0.02] backdrop-blur-sm border-2 border-dashed border-white/[0.1]
                hover:bg-white/[0.05] hover:border-orange-500/40
                transition-all duration-500 cursor-pointer
                min-h-[180px] sm:min-h-[200px]
                group
              "
            >
              <motion.div
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.3 }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center mb-4 group-hover:border-orange-500/30 group-hover:bg-orange-500/10 transition-all duration-300"
              >
                <Plus className="w-8 h-8 sm:w-10 sm:h-10 text-white/30 group-hover:text-orange-400 transition-colors" />
              </motion.div>
              <span className="text-base sm:text-lg font-semibold text-white/40 group-hover:text-white/70 transition-colors">Add Profile</span>
            </motion.button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
