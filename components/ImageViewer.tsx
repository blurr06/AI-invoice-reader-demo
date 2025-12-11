import React, { useEffect, useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ExternalLink, Loader2 } from 'lucide-react';

// Handle ES module import structure for pdfjs-dist
const pdfjs: any = (pdfjsLib as any).default || pdfjsLib;

// Set the worker source for PDF.js using cdnjs for better stability with cross-origin workers
if (pdfjs?.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

interface ImageViewerProps {
  file: File;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ file }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  
  // PDF State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setObjectUrl(url);

    if (file.type === 'application/pdf') {
        setIsLoading(true);
        setError(null);
        setPageNum(1);
        
        const loadPdf = async () => {
            try {
                // Use the normalized pdfjs object
                const loadingTask = pdfjs.getDocument(url);
                const pdf = await loadingTask.promise;
                setPdfDoc(pdf);
                setPageCount(pdf.numPages);
                setIsLoading(false);
            } catch (err) {
                console.error("Error loading PDF:", err);
                setError("Could not load PDF document.");
                setIsLoading(false);
            }
        };
        loadPdf();
    } else {
        setPdfDoc(null);
    }

    return () => {
        URL.revokeObjectURL(url);
        if (renderTaskRef.current) {
            renderTaskRef.current.cancel();
        }
    };
  }, [file]);

  // Render Page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
        if (renderTaskRef.current) {
            renderTaskRef.current.cancel();
        }

        try {
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale });
            
            const canvas = canvasRef.current;
            if (!canvas) return;
            
            const context = canvas.getContext('2d');
            if (!context) return;

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };

            const task = page.render(renderContext);
            renderTaskRef.current = task;
            
            await task.promise;
        } catch (err: any) {
            // Ignore cancelled errors which happen when page/scale changes quickly
            if (err?.name !== 'RenderingCancelledException') {
                console.error('Render error:', err);
            }
        }
    };

    renderPage();
  }, [pdfDoc, pageNum, scale]);

  const changePage = (offset: number) => {
      setPageNum(prev => Math.min(Math.max(1, prev + offset), pageCount));
  };

  if (!objectUrl) return null;

  return (
    <div className="w-full h-full flex flex-col bg-slate-100">
      {/* Toolbar for PDF */}
      {file.type === 'application/pdf' && (
          <div className="flex items-center justify-between p-2 bg-white border-b border-slate-200 shadow-sm z-10 shrink-0">
              <div className="flex items-center gap-2">
                  <button onClick={() => changePage(-1)} disabled={pageNum <= 1} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 text-slate-600">
                      <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-slate-600 w-16 text-center">
                      Page {pageNum} / {pageCount}
                  </span>
                  <button onClick={() => changePage(1)} disabled={pageNum >= pageCount} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 text-slate-600">
                      <ChevronRight className="w-4 h-4" />
                  </button>
              </div>
              
              <div className="flex items-center gap-2">
                  <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="p-1 hover:bg-slate-100 rounded text-slate-600" title="Zoom Out">
                      <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs w-12 text-center text-slate-500">{Math.round(scale * 100)}%</span>
                  <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className="p-1 hover:bg-slate-100 rounded text-slate-600" title="Zoom In">
                      <ZoomIn className="w-4 h-4" />
                  </button>
              </div>

              <a 
                href={objectUrl} 
                target="_blank" 
                rel="noreferrer"
                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                title="Open in new tab"
              >
                  <ExternalLink className="w-4 h-4" />
              </a>
          </div>
      )}

      <div className="flex-1 overflow-auto p-4 custom-scrollbar flex justify-center items-start bg-slate-200/50">
        {file.type === 'application/pdf' ? (
            isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <span className="text-sm">Loading PDF...</span>
                </div>
            ) : error ? (
                 <div className="flex flex-col items-center justify-center h-full text-red-400 gap-2 p-4 text-center">
                    <p>{error}</p>
                    <a href={objectUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm">Download / Open in New Tab</a>
                </div>
            ) : (
                <div className="shadow-lg border border-slate-300">
                    <canvas ref={canvasRef} className="block bg-white" />
                </div>
            )
        ) : (
             <img 
                src={objectUrl} 
                alt="Invoice Preview" 
                className="max-w-full h-auto rounded shadow-lg border border-slate-300"
            />
        )}
      </div>
    </div>
  );
};