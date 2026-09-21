import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

interface ImageLightboxModalProps {
  imageUrl: string | null;
  imageName?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  imageUrl,
  imageName = 'Uploaded image',
  onClose,
}) => {
  if (!imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
        {/* Controls */}
        <div className="w-full flex items-center justify-between pb-3 text-white">
          <span className="text-xs text-slate-300 font-mono truncate max-w-xs">{imageName}</span>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              download={imageName}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
              title="Download image"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800/80 hover:bg-rose-900/80 text-slate-200 hover:text-white rounded-lg transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image container */}
        <div className="overflow-auto max-h-[80vh] rounded-2xl border border-slate-700/80 bg-black/50 shadow-2xl flex items-center justify-center">
          <img
            src={imageUrl}
            alt={imageName}
            className="max-w-full max-h-[80vh] object-contain rounded-xl"
          />
        </div>
      </div>
    </div>
  );
};
