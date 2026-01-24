import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Calendar,
  Layers,
  BookOpen,
  Languages,
} from 'lucide-react';
import { adminApi, SUBJECT_OPTIONS, LANGUAGE_OPTIONS } from '../../api/admin';
import { Button, Card, Input } from '../../components/ui';

export default function DocumentsListPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.getDocuments();
      setDocuments(response.data.documents || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (filename) => {
    setDeleting(true);
    try {
      await adminApi.deleteDocument(filename);
      setDocuments(documents.filter((doc) => doc.filename !== filename));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete document');
    } finally {
      setDeleting(false);
    }
  };

  const getSubjectInfo = (subject) => {
    return SUBJECT_OPTIONS.find((s) => s.value === subject) || { emoji: '📄', label: subject };
  };

  const getLanguageLabel = (lang) => {
    return LANGUAGE_OPTIONS.find((l) => l.value === lang)?.label || lang;
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Documents</h1>
          <p className="text-white/60">
            Manage uploaded documents in the knowledge base
          </p>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={loadDocuments}>
          Refresh
        </Button>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <p className="text-rose-400">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search documents by filename or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 text-center">
          <FileText className="w-6 h-6 text-violet-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{documents.length}</p>
          <p className="text-sm text-white/60">Documents</p>
        </Card>
        <Card className="p-4 text-center">
          <Layers className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {documents.reduce((acc, doc) => acc + (doc.chunk_count || 0), 0)}
          </p>
          <p className="text-sm text-white/60">Total Chunks</p>
        </Card>
        <Card className="p-4 text-center">
          <BookOpen className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {new Set(documents.map((d) => d.subject)).size}
          </p>
          <p className="text-sm text-white/60">Subjects</p>
        </Card>
        <Card className="p-4 text-center">
          <Languages className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {new Set(documents.map((d) => d.language)).size}
          </p>
          <p className="text-sm text-white/60">Languages</p>
        </Card>
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchQuery ? 'No documents found' : 'No documents yet'}
          </h3>
          <p className="text-white/60">
            {searchQuery
              ? 'Try a different search term'
              : 'Upload your first document to get started'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((doc, index) => {
            const subjectInfo = getSubjectInfo(doc.subject);
            return (
              <motion.div
                key={doc.filename || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 hover:bg-white/[0.07] transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">{subjectInfo.emoji}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">
                        {doc.filename || 'Unknown file'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm">
                        <span className="flex items-center gap-1 text-white/60">
                          <BookOpen className="w-4 h-4" />
                          {subjectInfo.label}
                        </span>
                        <span className="flex items-center gap-1 text-white/60">
                          <Languages className="w-4 h-4" />
                          {getLanguageLabel(doc.language)}
                        </span>
                        <span className="flex items-center gap-1 text-white/60">
                          <Layers className="w-4 h-4" />
                          {doc.chunk_count || 0} chunks
                        </span>
                        {doc.uploaded_at && (
                          <span className="flex items-center gap-1 text-white/60">
                            <Calendar className="w-4 h-4" />
                            {formatDate(doc.uploaded_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {deleteConfirm === doc.filename ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(doc.filename)}
                            loading={deleting}
                          >
                            Confirm
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setDeleteConfirm(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => setDeleteConfirm(doc.filename)}
                          className="text-rose-400 hover:bg-rose-500/10"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex flex-wrap gap-2">
                        {doc.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-white/10 rounded text-xs text-white/70"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="w-12 h-12 bg-rose-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">
                Delete Document?
              </h3>
              <p className="text-white/60 text-center mb-6">
                This will permanently delete <strong className="text-white">{deleteConfirm}</strong> and all its chunks from the knowledge base. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => handleDelete(deleteConfirm)}
                  loading={deleting}
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
