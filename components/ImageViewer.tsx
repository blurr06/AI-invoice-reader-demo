import React, { useEffect, useState } from 'react';

interface ImageViewerProps {
  file: File;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ file }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!objectUrl) return null;

  return (
    <div className="w-full h-full flex flex-col items-center p-4 overflow-auto custom-scrollbar">
      {file.type === 'application/pdf' ? (
        <iframe 
          src={objectUrl} 
          className="w-full h-full rounded shadow-lg bg-white border border-slate-300" 
          title="Invoice Preview"
        />
      ) : (
        <img 
          src={objectUrl} 
          alt="Invoice Preview" 
          className="max-w-full h-auto rounded shadow-lg border border-slate-300"
        />
      )}
    </div>
  );
};