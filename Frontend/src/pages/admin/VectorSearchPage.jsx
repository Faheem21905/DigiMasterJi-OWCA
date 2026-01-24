import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Sparkles,
  BookOpen,
  Languages,
  FileText,
  Zap,
  ArrowRight,
  X,
} from 'lucide-react';
import { adminApi, SUBJECT_OPTIONS, LANGUAGE_OPTIONS } from '../../api/admin';
import { Button, Card } from '../../components/ui';

export default function VectorSearchPage() {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(5);
  const [subject, setSubject] = useState('');
  const [language, setLanguage] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setSearching(true);
    setError('');
    setResults([]);
    setHasSearched(true);

    try {
      const response = await adminApi.vectorSearch({
        query: query.trim(),
        limit,
        subject: subject || null,
        language: language || null,
      });
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const getSubjectInfo = (subjectValue) => {
    return SUBJECT_OPTIONS.find((s) => s.value === subjectValue) || { emoji: '📄', label: subjectValue };
  };

  const getLanguageLabel = (lang) => {
    return LANGUAGE_OPTIONS.find((l) => l.value === lang)?.label || lang;
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-emerald-400 bg-emerald-500/20';
    if (score >= 0.6) return 'text-cyan-400 bg-cyan-500/20';
    if (score >= 0.4) return 'text-amber-400 bg-amber-500/20';
    return 'text-rose-400 bg-rose-500/20';
  };

  const clearFilters = () => {
    setSubject('');
    setLanguage('');
    setLimit(5);
  };

  const activeFiltersCount = [subject, language, limit !== 5].filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Vector Search</h1>
        <p className="text-white/60">
          Test semantic search across the knowledge base using vector embeddings
        </p>
      </div>

      {/* Search Form */}
      <Card className="p-6 mb-6">
        <form onSubmit={handleSearch}>
          {/* Search Input */}
          <div className="relative mb-4">
            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
            <input
              type="text"
              placeholder="Enter your question or search query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all text-lg"
            />
          </div>

          {/* Filters Toggle */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-violet-500/20 text-violet-300'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 bg-violet-500 rounded-full text-xs flex items-center justify-center text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="p-4 bg-white/5 rounded-xl space-y-4">
                  {/* Subject Filter */}
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">
                      Filter by Subject
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSubject('')}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          !subject
                            ? 'bg-violet-500 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        All
                      </button>
                      {SUBJECT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSubject(opt.value)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1 ${
                            subject === opt.value
                              ? 'bg-violet-500 text-white'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          <span>{opt.emoji}</span>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language Filter */}
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">
                      Filter by Language
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setLanguage('')}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          !language
                            ? 'bg-violet-500 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        All
                      </button>
                      {LANGUAGE_OPTIONS.slice(0, 5).map((lang) => (
                        <button
                          key={lang.value}
                          type="button"
                          onClick={() => setLanguage(lang.value)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                            language === lang.value
                              ? 'bg-violet-500 text-white'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Result Limit */}
                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-2">
                      Number of Results
                    </label>
                    <div className="flex gap-2">
                      {[3, 5, 10, 15, 20].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setLimit(num)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                            limit === num
                              ? 'bg-violet-500 text-white'
                              : 'bg-white/10 text-white/60 hover:bg-white/20'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Button */}
          <Button
            type="submit"
            loading={searching}
            icon={Search}
            className="w-full"
            size="lg"
          >
            {searching ? 'Searching...' : 'Search Knowledge Base'}
          </Button>
        </form>
      </Card>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl"
          >
            <p className="text-rose-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {hasSearched && !searching && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              {results.length > 0 ? `${results.length} Results Found` : 'No Results'}
            </h2>
            {results.length > 0 && (
              <span className="text-sm text-white/50">
                Sorted by relevance score
              </span>
            )}
          </div>

          {results.length === 0 ? (
            <Card className="p-8 text-center">
              <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No matching content found</h3>
              <p className="text-white/60">
                Try a different query or adjust your filters
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => {
                const subjectInfo = getSubjectInfo(result.subject);
                return (
                  <motion.div
                    key={result.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-xl">{subjectInfo.emoji}</span>
                          </div>
                          <div>
                            <h3 className="text-white font-semibold line-clamp-1">
                              {result.title || 'Untitled Chunk'}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-white/50">
                              <span>{subjectInfo.label}</span>
                              <span>•</span>
                              <span>{getLanguageLabel(result.language)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Score Badge */}
                        <div className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${getScoreColor(result.score)}`}>
                          <Zap className="w-4 h-4" />
                          <span className="font-semibold">{(result.score * 100).toFixed(1)}%</span>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <div className="bg-white/5 rounded-lg p-4 mb-3">
                        <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                          {result.content_chunk}
                        </p>
                      </div>

                      {/* Tags */}
                      {result.tags && result.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {result.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-white/10 rounded text-xs text-white/60"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty State (before search) */}
      {!hasSearched && (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Semantic Vector Search
          </h3>
          <p className="text-white/60 max-w-md mx-auto mb-6">
            Enter a question or topic to search the knowledge base. 
            The system uses AI embeddings to find the most relevant content.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'What is photosynthesis?',
              'Explain Newton\'s laws',
              'How do cells divide?',
              'Quadratic equations',
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setQuery(suggestion);
                  setTimeout(handleSearch, 100);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white/70 hover:text-white transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
