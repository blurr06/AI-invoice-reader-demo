import React, { useRef } from 'react';
import { UploadCloud, File, X } from 'lucide-react';

interface FileUploadProps {
  id: string;
  accept: string;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  label: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ id, accept, file, onFileSelect, label }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    if (inputRef.current) {
       inputRef.current.value = '';
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer group
        ${file 
          ? 'border-emerald-300 bg-emerald-50/30' 
          : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
        }
      `}
    >
      <input
        type="file"
        id={id}
        accept={accept}
        ref={inputRef}
        className="hidden"
        onChange={handleChange}
      />
      
      <div className="flex flex-col items-center justify-center text-center">
        {file ? (
          <div className="flex items-center gap-3 w-full max-w-xs p-2 bg-white rounded-lg shadow-sm border border-emerald-100">
             <div className="p-2 bg-emerald-100 rounded-md">
                <File className="w-6 h-6 text-emerald-600" />
             </div>
             <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
             </div>
             <button 
               onClick={handleRemove}
               className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-red-500 transition-colors"
             >
                <X className="w-4 h-4" />
             </button>
          </div>
        ) : (
          <>
            <div className="p-3 bg-slate-100 rounded-full text-slate-400 mb-3 group-hover:scale-110 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all duration-300">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-700">{label}</p>
            <p className="text-xs text-slate-400 mt-1">Click to browse or drag & drop</p>
          </>
        )}
      </div>
    </div>
  );
};