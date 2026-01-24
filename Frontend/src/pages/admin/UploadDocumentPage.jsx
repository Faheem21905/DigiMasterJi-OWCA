import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  File,
  Tag,
} from 'lucide-react';
import { adminApi, SUBJECT_OPTIONS, LANGUAGE_OPTIONS } from '../../api/admin';
import { Button, Input, Card } from '../../components/ui';

export default function UploadDocumentPage() {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState('');
  const [language, setLanguage] = useState('en');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (selectedFile) => {
    setError('');
    setUploadResult(null);

    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported');
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
      setError('File size must be less than 50MB');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelect(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!subject) {
      setError('Please select a subject');
      return;
    }

    setUploading(true);
    setError('');
    setUploadResult(null);

    try {
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
      const response = await adminApi.uploadDocument(file, subject, language, tagList);
      setUploadResult(response.data);
      // Reset form on success
      setFile(null);
      setSubject('');
      setTags('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Upload Document</h1>
        <p className="text-white/60">
          Upload PDF documents to add to the RAG knowledge base. Documents will be automatically
          parsed, chunked, and embedded for semantic search.
        </p>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {uploadResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-emerald-400 mb-1">Upload Successful!</h3>
                <p className="text-white/80 text-sm">{uploadResult.message}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <span className="px-2 py-1 bg-white/10 rounded text-white/70">
                    📄 {uploadResult.filename}
                  </span>
                  <span className="px-2 py-1 bg-violet-500/20 rounded text-violet-300">
                    {uploadResult.chunks_processed} chunks
                  </span>
                  <span className="px-2 py-1 bg-cyan-500/20 rounded text-cyan-300">
                    {uploadResult.subject}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-rose-400 mb-1">Upload Error</h3>
                <p className="text-white/80 text-sm">{error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="p-6">
        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${dragOver
              ? 'border-violet-500 bg-violet-500/10'
              : file
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-white/20 hover:border-violet-500/50 hover:bg-white/5'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          {file ? (
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 bg-violet-500/20 rounded-xl flex items-center justify-center">
                <FileText className="w-8 h-8 text-violet-400" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold">{file.name}</p>
                <p className="text-white/60 text-sm">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="ml-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/60 hover:text-white" />
              </button>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-white font-medium mb-1">
                Drop your PDF here or click to browse
              </p>
              <p className="text-white/50 text-sm">
                Maximum file size: 50MB
              </p>
            </>
          )}
        </div>

        {/* Form Fields */}
        <div className="mt-6 space-y-5">
          {/* Subject Selection */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">
              Subject <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SUBJECT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSubject(opt.value)}
                  className={`
                    flex items-center gap-2 p-3 rounded-xl border transition-all
                    ${subject === opt.value
                      ? 'border-violet-500 bg-violet-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                    }
                  `}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">
              Document Language
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => setLanguage(lang.value)}
                  className={`
                    p-2 rounded-lg border text-center transition-all
                    ${language === lang.value
                      ? 'border-violet-500 bg-violet-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                    }
                  `}
                >
                  <span className="block text-sm font-medium">{lang.native}</span>
                  <span className="block text-xs text-white/50">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Tags (Optional)
            </label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Enter comma-separated tags (e.g., ncert, class-10, chapter-1)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
              />
            </div>
            <p className="text-white/40 text-xs mt-2">
              Tags help in filtering and organizing content
            </p>
          </div>
        </div>

        {/* Upload Button */}
        <div className="mt-8">
          <Button
            onClick={handleUpload}
            disabled={!file || !subject || uploading}
            loading={uploading}
            icon={uploading ? Loader2 : Upload}
            className="w-full"
            size="lg"
          >
            {uploading ? 'Processing Document...' : 'Upload & Process'}
          </Button>
          {uploading && (
            <p className="text-center text-white/50 text-sm mt-3">
              This may take a few moments depending on document size...
            </p>
          )}
        </div>
      </Card>

      {/* Info Section */}
      <div className="mt-6 p-4 bg-white/5 rounded-xl">
        <h3 className="text-white font-semibold mb-2">What happens after upload?</h3>
        <ul className="text-white/60 text-sm space-y-1">
          <li>1. PDF text is extracted using PyMuPDF</li>
          <li>2. Text is chunked into ~500 token segments with overlap</li>
          <li>3. Vector embeddings are generated using MiniLM-L6-v2</li>
          <li>4. Chunks are stored in MongoDB Atlas with vector index</li>
          <li>5. Content becomes searchable via semantic vector search</li>
        </ul>
      </div>
    </div>
  );
}
