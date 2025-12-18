"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string | null;
  title: string;
}

export function FilePreviewModal({
  isOpen,
  onClose,
  url,
  title,
}: FilePreviewModalProps) {
  const [isImage, setIsImage] = useState(true);

  // Reset state when url changes
  useEffect(() => {
    if (url) {
      // Basic check for common image extensions
      const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
      const lowerUrl = url.toLowerCase();
      const hasImageExt = imageExtensions.some((ext) => lowerUrl.includes(ext));
      
      // If it doesn't have an explicit extension, we assume it *might* be an image
      // but if it fails to load (onError), we'll switch to fallback.
      // However, for many cloud storages (blob urls), extensions might be missing.
      // So we default to true and let onError handler flip it.
      setIsImage(true);
    }
  }, [url]);

  if (!isOpen || !url) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-white">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-zinc-900">{title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(url, "_blank")}
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4 text-zinc-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-zinc-100 rounded-full"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto bg-zinc-100 p-4 flex items-center justify-center min-h-[300px]">
            {isImage ? (
              <img
                src={url}
                alt={title}
                className="max-w-full max-h-full object-contain rounded shadow-sm"
                onError={() => setIsImage(false)}
              />
            ) : (
              <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-zinc-200">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-zinc-400" />
                </div>
                <p className="text-zinc-600 mb-4 max-w-xs mx-auto">
                  This file cannot be previewed directly. You can download it or open it in a new tab.
                </p>
                <Button
                  onClick={() => window.open(url, "_blank")}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download / Open Externally
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
