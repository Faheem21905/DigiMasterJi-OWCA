import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Database,
  FileText,
  Upload,
  Search,
  TrendingUp,
  BookOpen,
  Languages,
  Cpu,
  HardDrive,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { adminApi, SUBJECT_OPTIONS } from '../../api/admin';
import { Card, Button } from '../../components/ui';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [ragInfo, setRagInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, ragRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getRagInfo(),
      ]);
      setStats(statsRes.data);
      setRagInfo(ragRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, subValue, color, onClick }) => (
    <motion.div
      whileHover={onClick ? { scale: 1.02, y: -2 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`
        glass-card p-6
        ${onClick ? 'cursor-pointer hover:border-orange-500/30' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {onClick && <ArrowRight className="w-5 h-5 text-white/30" />}
      </div>
      <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
      <p className="text-white/60 text-sm">{label}</p>
      {subValue && <p className="text-white/40 text-xs mt-1">{subValue}</p>}
    </motion.div>
  );

  const QuickAction = ({ icon: Icon, label, description, onClick, color }) => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-4 p-4 glass-card hover:border-orange-500/30 transition-all text-left w-full"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <h4 className="text-white font-semibold">{label}</h4>
        <p className="text-white/50 text-sm">{description}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-white/30" />
    </motion.button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-white/60">Manage your RAG knowledge base and vector database</p>
        </div>
        <Button
          variant="secondary"
          icon={RefreshCw}
          onClick={loadDashboardData}
        >
          Refresh
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl"
        >
          <p className="text-rose-400">{error}</p>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Layers}
          label="Total Chunks"
          value={stats?.total_chunks?.toLocaleString() || '0'}
          subValue="Vector embeddings stored"
          color="bg-gradient-to-br from-violet-500 to-indigo-600"
          onClick={() => navigate('/admin/documents')}
        />
        <StatCard
          icon={FileText}
          label="Documents"
          value={stats?.unique_files || '0'}
          subValue="Source PDF files"
          color="bg-gradient-to-br from-cyan-500 to-blue-600"
          onClick={() => navigate('/admin/documents')}
        />
        <StatCard
          icon={BookOpen}
          label="Subjects"
          value={stats?.by_subject ? Object.keys(stats.by_subject).length : '0'}
          subValue="Active categories"
          color="bg-gradient-to-br from-emerald-500 to-green-600"
        />
        <StatCard
          icon={Languages}
          label="Languages"
          value={stats?.by_language ? Object.keys(stats.by_language).length : '0'}
          subValue="Supported languages"
          color="bg-gradient-to-br from-amber-500 to-orange-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickAction
              icon={Upload}
              label="Upload Document"
              description="Add new PDF to knowledge base"
              color="bg-gradient-to-br from-violet-500 to-indigo-600"
              onClick={() => navigate('/admin/upload')}
            />
            <QuickAction
              icon={Search}
              label="Test Vector Search"
              description="Query the knowledge base"
              color="bg-gradient-to-br from-cyan-500 to-blue-600"
              onClick={() => navigate('/admin/search')}
            />
            <QuickAction
              icon={FileText}
              label="Manage Documents"
              description="View and delete documents"
              color="bg-gradient-to-br from-emerald-500 to-green-600"
              onClick={() => navigate('/admin/documents')}
            />
            <QuickAction
              icon={Database}
              label="View Statistics"
              description="Detailed breakdown by subject"
              color="bg-gradient-to-br from-amber-500 to-orange-600"
              onClick={loadDashboardData}
            />
            <QuickAction
              icon={TrendingUp}
              label="Web Scraper"
              description="Scrape websites with AI agent"
              color="bg-gradient-to-br from-teal-500 to-cyan-600"
              onClick={() => navigate('/admin/scraper')}
            />
          </div>
        </div>

        {/* RAG Info Card */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">RAG Configuration</h2>
          <Card variant="glass" className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Cpu className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Embedding Model</p>
                <p className="text-white font-medium text-sm">
                  {ragInfo?.embedding_model || 'MiniLM-L6-v2'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Vector Dimensions</p>
                <p className="text-white font-medium">
                  {ragInfo?.embedding_dimension || '384'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Chunk Size</p>
                <p className="text-white font-medium">
                  {ragInfo?.chunk_size || '500'} tokens
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Chunk Overlap</p>
                <p className="text-white font-medium">
                  {ragInfo?.chunk_overlap || '50'} tokens
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Subject Breakdown */}
      {stats?.by_subject && Object.keys(stats.by_subject).length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-white mb-4">Content by Subject</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {SUBJECT_OPTIONS.map((subject) => {
              const count = stats.by_subject[subject.value] || 0;
              return (
                <Card key={subject.value} variant="glass" className="p-4 text-center hover:border-orange-500/30 transition-all">
                  <span className="text-3xl mb-2 block">{subject.emoji}</span>
                  <p className="text-white font-semibold">{subject.label}</p>
                  <p className="text-white/60 text-sm">{count} chunks</p>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
