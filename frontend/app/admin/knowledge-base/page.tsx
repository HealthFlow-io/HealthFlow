'use client';

import { useState, useRef } from 'react';
import { chatbotService, UploadResponse } from '@/services/chatbot.service';

interface UploadedDoc {
  id: string;
  fileName: string;
  docId: string;
  status: 'uploading' | 'success' | 'error';
  message?: string;
  uploadedAt: Date;
}

export default function KnowledgeBasePage() {
  const [uploads, setUploads] = useState<UploadedDoc[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(
      (f) => f.type === 'application/pdf'
    );

    if (fileArray.length === 0) {
      alert('Please upload PDF files only.');
      return;
    }

    setIsUploading(true);

    for (const file of fileArray) {
      const tempId = crypto.randomUUID();
      const newDoc: UploadedDoc = {
        id: tempId,
        fileName: file.name,
        docId: '',
        status: 'uploading',
        uploadedAt: new Date(),
      };

      setUploads((prev) => [newDoc, ...prev]);

      try {
        const response: UploadResponse = await chatbotService.uploadDocument(file, 'admin');
        setUploads((prev) =>
          prev.map((d) =>
            d.id === tempId
              ? { ...d, status: 'success', docId: response.doc_id, message: response.message }
              : d
          )
        );
      } catch (error) {
        setUploads((prev) =>
          prev.map((d) =>
            d.id === tempId
              ? {
                  ...d,
                  status: 'error',
                  message: error instanceof Error ? error.message : 'Upload failed',
                }
              : d
          )
        );
      }
    }

    setIsUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFromList = (id: string) => {
    setUploads((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold">Knowledge Base</h2>
        <p className="text-muted-foreground mt-1">
          Upload PDF documents and medical records to train the RAG-powered AI assistant.
          The AI will use this data to answer doctor and admin queries.
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="text-xl">📄</span>
            </div>
            <div>
              <p className="text-sm font-medium">PDF Documents</p>
              <p className="text-xs text-muted-foreground">Upload medical PDFs, guidelines, protocols</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span className="text-xl">🏥</span>
            </div>
            <div>
              <p className="text-sm font-medium">Medical Records</p>
              <p className="text-xs text-muted-foreground">Patient records for AI-powered insights</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <p className="text-sm font-medium">RAG AI</p>
              <p className="text-xs text-muted-foreground">Documents are indexed for intelligent Q&A</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 ${
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold">
              {isDragging ? 'Drop files here' : 'Drag & drop PDF files here'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click the button below to browse
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isUploading ? 'Uploading...' : 'Select PDF Files'}
          </button>
          <p className="text-xs text-muted-foreground">
            Supported: PDF files only. Files are processed, chunked, and indexed in the vector store.
          </p>
        </div>
      </div>

      {/* Upload History */}
      {uploads.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Upload History</h3>
          <div className="space-y-2">
            {uploads.map((doc) => (
              <div
                key={doc.id}
                className={`flex items-center justify-between rounded-xl border p-4 transition-colors ${
                  doc.status === 'success'
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800'
                    : doc.status === 'error'
                    ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800'
                    : 'bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Status Icon */}
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-background border">
                    {doc.status === 'uploading' && (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    )}
                    {doc.status === 'success' && <span className="text-green-600 text-lg">✓</span>}
                    {doc.status === 'error' && <span className="text-red-600 text-lg">✗</span>}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{doc.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.status === 'uploading' && 'Processing and indexing...'}
                      {doc.status === 'success' && `Indexed successfully (ID: ${doc.docId.slice(0, 8)}...)`}
                      {doc.status === 'error' && (doc.message || 'Upload failed')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {doc.uploadedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {doc.status !== 'uploading' && (
                    <button
                      onClick={() => removeFromList(doc.id)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      title="Remove from list"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">How it works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Step number={1} title="Upload" description="Upload PDF documents containing medical data, protocols, or patient records." />
          <Step number={2} title="Process" description="Documents are parsed, split into chunks, and embedded with BAAI/bge-small." />
          <Step number={3} title="Index" description="Embeddings are stored in Pinecone vector database for fast retrieval." />
          <Step number={4} title="Query" description="Doctors & admins can ask questions and get AI answers based on indexed data." />
        </div>
      </div>
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm mb-2">
        {number}
      </div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
