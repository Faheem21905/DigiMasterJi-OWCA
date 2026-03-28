import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Play,
  Square,
  RefreshCw,
  Settings2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  LinkIcon,
  FileText,
  Layers,
  Bot,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { adminApi, SUBJECT_OPTIONS, LANGUAGE_OPTIONS } from '../../api/admin';
import { Card, Button, Input } from '../../components/ui';

const DEFAULT_PURPOSE = `Scrape educational content related to STEM subjects (Science, Technology, Engineering, Mathematics) that would be useful for teaching students in India. Focus on explanations, definitions, examples, and learning material.`;

export default function WebScraperPage() {
  // --- Config State ---
  const [baseUrl, setBaseUrl] = useState('');
  const [purpose, setPurpose] = useState(DEFAULT_PURPOSE);
  const [maxPages, setMaxPages] = useState(50);
  const [maxDepth, setMaxDepth] = useState(3);
  const [delay, setDelay] = useState(1.5);
  const [subject, setSubject] = useState('General Science');
  const [language, setLanguage] = useState('en');
  const [headless, setHeadless] = useState(true);
  const [autoAddToRag, setAutoAddToRag] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // --- Job State ---
  const [activeJobId, setActiveJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [pollError, setPollError] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const pollRef = useRef(null);
  const logEndRef = useRef(null);

  // Load job history on mount
  useEffect(() => {
    loadJobs();
  }, []);

  // Poll for active job status
  useEffect(() => {
    if (activeJobId) {
      pollRef.current = setInterval(async () => {
        try {
          const res = await adminApi.getScraperStatus(activeJobId);
          setJobStatus(res.data);
          setPollError('');
          if (['completed', 'error', 'stopped'].includes(res.data.status)) {
            clearInterval(pollRef.current);
            loadJobs(); // Refresh job history
          }
        } catch (err) {
          setPollError('Failed to fetch job status');
        }
      }, 2000);
      return () => clearInterval(pollRef.current);
    }
  }, [activeJobId]);

  // Auto-scroll agent log
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [jobStatus?.agent_log?.length]);

  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await adminApi.getScraperJobs();
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error('Failed to load scraper jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleStart = async () => {
    if (!baseUrl.trim()) return;
    setIsStarting(true);
    setPollError('');
    try {
      const res = await adminApi.startScraping({
        base_url: baseUrl.trim(),
        purpose: purpose.trim(),
        max_pages: maxPages,
        max_depth: maxDepth,
        delay,
        subject,
        language,
        headless,
        auto_add_to_rag: autoAddToRag,
      });
      setActiveJobId(res.data.job_id);
      setJobStatus(null);
    } catch (err) {
      setPollError(err.response?.data?.detail || 'Failed to start scraping job');
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    if (!activeJobId) return;
    try {
      await adminApi.stopScraping(activeJobId);
    } catch (err) {
      console.error('Failed to stop job:', err);
    }
  };

  const isRunning = jobStatus?.status === 'running';

  // --- Decision badge ---
  const DecisionBadge = ({ type, verdict }) => {
    const colors = {
      visit: verdict ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      content: verdict ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      links: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    };
    const labels = { visit: 'Visit', content: 'Content', links: 'Links' };
    const icons = {
      visit: verdict ? CheckCircle2 : XCircle,
      content: verdict ? CheckCircle2 : XCircle,
      links: LinkIcon,
    };
    const Icon = icons[type] || Bot;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors[type] || colors.links}`}>
        <Icon className="w-3 h-3" />
        {labels[type] || type}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30">
              <Globe className="w-5 h-5 text-white" />
            </div>
            Web Scraper
          </h1>
          <p className="text-white/60">
            Agentic web scraper with LLM-driven URL &amp; content decisions
          </p>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={loadJobs}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ============ LEFT: Config Form ============ */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-6 space-y-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-violet-400" />
              Scraper Configuration
            </h2>

            {/* URL */}
            <div>
              <label className="block text-sm text-white/70 mb-1.5">Website URL <span className="text-rose-400">*</span></label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-all"
                disabled={isRunning}
              />
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm text-white/70 mb-1.5">
                Scraping Purpose <span className="text-rose-400">*</span>
                <span className="text-white/40 ml-1">(guides the AI agent)</span>
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-all resize-none text-sm"
                disabled={isRunning}
              />
            </div>

            {/* Subject & Language */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-white/70 mb-1.5">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-violet-500/50 focus:outline-none transition-all appearance-none"
                  disabled={isRunning}
                >
                  {SUBJECT_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value} className="bg-slate-900">
                      {s.emoji} {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1.5">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-violet-500/50 focus:outline-none transition-all appearance-none"
                  disabled={isRunning}
                >
                  {LANGUAGE_OPTIONS.map((l) => (
                    <option key={l.value} value={l.value} className="bg-slate-900">
                      {l.native} ({l.label})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Advanced Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Advanced Settings
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Max Pages */}
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">
                      Max Pages <span className="text-white/40">({maxPages})</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={200}
                      value={maxPages}
                      onChange={(e) => setMaxPages(Number(e.target.value))}
                      className="w-full accent-violet-500"
                      disabled={isRunning}
                    />
                    <div className="flex justify-between text-xs text-white/30 mt-1">
                      <span>1</span>
                      <span>200</span>
                    </div>
                  </div>

                  {/* Max Depth */}
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">
                      Max Depth <span className="text-white/40">({maxDepth})</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={maxDepth}
                      onChange={(e) => setMaxDepth(Number(e.target.value))}
                      className="w-full accent-violet-500"
                      disabled={isRunning}
                    />
                    <div className="flex justify-between text-xs text-white/30 mt-1">
                      <span>1</span>
                      <span>10</span>
                    </div>
                  </div>

                  {/* Delay */}
                  <div>
                    <label className="block text-sm text-white/70 mb-1.5">
                      Delay between requests <span className="text-white/40">({delay}s)</span>
                    </label>
                    <input
                      type="range"
                      min={0.5}
                      max={5}
                      step={0.5}
                      value={delay}
                      onChange={(e) => setDelay(Number(e.target.value))}
                      className="w-full accent-violet-500"
                      disabled={isRunning}
                    />
                    <div className="flex justify-between text-xs text-white/30 mt-1">
                      <span>0.5s</span>
                      <span>5s</span>
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Auto-add to RAG</span>
                    <button
                      onClick={() => setAutoAddToRag(!autoAddToRag)}
                      disabled={isRunning}
                      className={`w-11 h-6 rounded-full transition-colors ${autoAddToRag ? 'bg-violet-500' : 'bg-white/20'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${autoAddToRag ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Headless browser</span>
                    <button
                      onClick={() => setHeadless(!headless)}
                      disabled={isRunning}
                      className={`w-11 h-6 rounded-full transition-colors ${headless ? 'bg-violet-500' : 'bg-white/20'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${headless ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Start / Stop */}
            {pollError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                {pollError}
              </div>
            )}

            <div className="pt-2">
              {isRunning ? (
                <Button
                  variant="primary"
                  onClick={handleStop}
                  className="w-full !bg-gradient-to-r !from-rose-600 !to-pink-600 hover:!from-rose-500 hover:!to-pink-500"
                  icon={Square}
                >
                  Stop Scraping
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleStart}
                  disabled={!baseUrl.trim() || !purpose.trim() || isStarting}
                  className="w-full"
                  icon={isStarting ? Loader2 : Play}
                >
                  {isStarting ? 'Starting...' : 'Start Scraping'}
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* ============ RIGHT: Live Progress + History ============ */}
        <div className="lg:col-span-3 space-y-5">
          {/* Live Progress */}
          {jobStatus && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Bot className="w-5 h-5 text-teal-400" />
                    Live Progress
                    {isRunning && (
                      <span className="flex items-center gap-1.5 ml-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                        </span>
                        <span className="text-xs text-emerald-400 font-normal">Running</span>
                      </span>
                    )}
                    {jobStatus.status === 'completed' && (
                      <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full ml-2">✓ Completed</span>
                    )}
                    {jobStatus.status === 'error' && (
                      <span className="text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full ml-2">✗ Error</span>
                    )}
                    {jobStatus.status === 'stopped' && (
                      <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full ml-2">◼ Stopped</span>
                    )}
                  </h2>
                  <span className="text-xs text-white/40 font-mono">{jobStatus.job_id}</span>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-white">{jobStatus.pages_scraped}</p>
                    <p className="text-xs text-white/50">Pages Scraped</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-white">{jobStatus.pages_skipped}</p>
                    <p className="text-xs text-white/50">Skipped</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-white">{jobStatus.chunks_added || 0}</p>
                    <p className="text-xs text-white/50">RAG Chunks</p>
                  </div>
                </div>

                {/* Current URL */}
                {jobStatus.current_url && (
                  <div className="mb-4 p-3 bg-white/5 rounded-xl flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-violet-400 animate-spin flex-shrink-0" />
                    <span className="text-sm text-white/70 truncate">{jobStatus.current_url}</span>
                  </div>
                )}

                {/* Agent Decision Log */}
                <div>
                  <h3 className="text-sm font-medium text-white/70 mb-2 flex items-center gap-1.5">
                    <Bot className="w-4 h-4" /> Agent Decision Log
                  </h3>
                  <div className="max-h-72 overflow-y-auto space-y-1.5 bg-black/20 rounded-xl p-3 scrollbar-thin">
                    {(!jobStatus.agent_log || jobStatus.agent_log.length === 0) && (
                      <p className="text-white/30 text-sm text-center py-4">Waiting for first decision...</p>
                    )}
                    {jobStatus.agent_log?.map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                      >
                        <DecisionBadge type={entry.decision_type} verdict={entry.verdict} />
                        <span className="text-white/50 truncate max-w-[200px]" title={entry.url}>
                          {new URL(entry.url).pathname || '/'}
                        </span>
                        <span className="text-white/40 flex-1 truncate">{entry.reason}</span>
                      </div>
                    ))}
                    <div ref={logEndRef} />
                  </div>
                </div>

                {/* Errors */}
                {jobStatus.errors?.length > 0 && (
                  <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                    <h4 className="text-sm font-medium text-rose-400 mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> Errors
                    </h4>
                    {jobStatus.errors.map((err, i) => (
                      <p key={i} className="text-xs text-rose-300/70">{err}</p>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* Job History */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Job History
            </h2>

            {loadingJobs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">No scraping jobs yet</p>
                <p className="text-white/30 text-xs mt-1">Configure and start your first scrape above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {jobs.map((job) => (
                  <motion.div
                    key={job.job_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/[0.07] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        job.status === 'completed' ? 'bg-emerald-500' :
                        job.status === 'running' ? 'bg-amber-500 animate-pulse' :
                        job.status === 'error' ? 'bg-rose-500' : 'bg-white/30'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate">{job.base_url}</p>
                        <p className="text-xs text-white/40 truncate">
                          {job.purpose?.substring(0, 60)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 ml-3">
                      <div className="text-right">
                        <p className="text-sm text-white font-medium">{job.pages_scraped} pages</p>
                        <p className="text-xs text-white/40">{job.chunks_added || 0} chunks</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        job.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                        job.status === 'running' ? 'bg-amber-500/20 text-amber-400' :
                        job.status === 'error' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-white/10 text-white/50'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
