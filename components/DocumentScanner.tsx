
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Zap, ZapOff, ArrowRight, RotateCcw, Image as ImageIcon, Sparkles, Maximize, Check, SlidersHorizontal, Loader2, Files } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { detectDocumentBounds } from '../services/geminiService';

interface DocumentScannerProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

type Point = { x: number, y: number };

export const DocumentScanner: React.FC<DocumentScannerProps> = ({ onCapture, onClose }) => {
  const [step, setStep] = useState<'camera' | 'crop'>('camera');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [flash, setFlash] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  
  // Multi-page State
  const [pages, setPages] = useState<string[]>([]); // Array of processed base64 images

  // Current Capture Data
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [imageDims, setImageDims] = useState<{width: number, height: number}>({ width: 0, height: 0 });
  
  // Crop State
  const [corners, setCorners] = useState<Point[]>([
    { x: 10, y: 10 }, { x: 90, y: 10 },
    { x: 90, y: 90 }, { x: 10, y: 90 }
  ]);
  const [activeCorner, setActiveCorner] = useState<number | null>(null);
  const [magnifierPos, setMagnifierPos] = useState<Point | null>(null); 
  const [userHasInteracted, setUserHasInteracted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Camera Lifecycle ---
  useEffect(() => {
    if (step === 'camera') startCamera();
    return () => stopCamera();
  }, [step]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 2560 } },
        audio: false
      });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (e) {
      console.error("Camera error", e);
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
  };

  const toggleFlash = () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities() as any;
    if (capabilities.torch) {
      track.applyConstraints({ advanced: [{ torch: !flash }] as any })
        .then(() => setFlash(!flash))
        .catch(() => setFlash(!flash)); 
    } else {
        setFlash(!flash);
    }
  };

  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',');
    // @ts-ignore
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  }

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const vid = videoRef.current;
    
    const cvs = document.createElement('canvas');
    cvs.width = vid.videoWidth;
    cvs.height = vid.videoHeight;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(vid, 0, 0);
    const url = cvs.toDataURL('image/jpeg', 0.95);
    
    setOriginalImage(url);
    setImageDims({ width: vid.videoWidth, height: vid.videoHeight });
    
    setCorners([
        { x: 15, y: 15 }, { x: 85, y: 15 },
        { x: 85, y: 85 }, { x: 15, y: 85 }
    ]);
    setStep('crop');
    setUserHasInteracted(false);

    setIsDetecting(true);
    try {
        const file = dataURLtoFile(url, "capture.jpg");
        const detectedCorners = await detectDocumentBounds(file);
        
        if (detectedCorners && detectedCorners.length === 4) {
             setCorners((currentCorners) => {
                 // Simple check: if we are still in crop mode
                 return detectedCorners;
             });
        }
    } catch (e) {
        console.warn("Detection failed", e);
    } finally {
        setIsDetecting(false);
    }
  };

  // --- Crop Logic ---
  const handleDragStart = (idx: number) => {
      setActiveCorner(idx);
      setUserHasInteracted(true);
  };

  const handleDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (activeCorner === null || !containerRef.current) return;
    e.preventDefault(); 
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    let xPct = ((clientX - rect.left) / rect.width) * 100;
    let yPct = ((clientY - rect.top) / rect.height) * 100;
    xPct = Math.max(0, Math.min(100, xPct));
    yPct = Math.max(0, Math.min(100, yPct));

    const newCorners = [...corners];
    newCorners[activeCorner] = { x: xPct, y: yPct };
    setCorners(newCorners);
    setMagnifierPos({ x: xPct, y: yPct });
  }, [activeCorner, corners]);

  const handleDragEnd = () => {
    setActiveCorner(null);
    setMagnifierPos(null);
  };

  const handleFull = () => {
      setUserHasInteracted(true);
      setCorners([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }]);
  };

  const handleRotate = async () => {
    if (!originalImage) return;
    setUserHasInteracted(true);
    const img = new Image();
    img.src = originalImage;
    await new Promise(r => img.onload = r);

    const cvs = document.createElement('canvas');
    cvs.width = img.height;
    cvs.height = img.width;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    ctx.translate(cvs.width / 2, cvs.height / 2);
    ctx.rotate((90 * Math.PI) / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    const newUrl = cvs.toDataURL('image/jpeg', 0.95);
    setOriginalImage(newUrl);
    setImageDims({ width: cvs.width, height: cvs.height });
    setCorners([{ x: 15, y: 15 }, { x: 85, y: 15 }, { x: 85, y: 85 }, { x: 15, y: 85 }]);
  };

  // Process the image (Crop + Magic Filter) and add to stack
  const handleKeepScan = async () => {
    if (!originalImage) return;
    
    // 1. Crop
    const img = new Image();
    img.src = originalImage;
    await new Promise(r => img.onload = r);

    const cvs = document.createElement('canvas');
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const px = corners.map(c => ({
        x: (c.x / 100) * img.width,
        y: (c.y / 100) * img.height
    }));

    const minX = Math.min(...px.map(p => p.x));
    const maxX = Math.max(...px.map(p => p.x));
    const minY = Math.min(...px.map(p => p.y));
    const maxY = Math.max(...px.map(p => p.y));
    const w = maxX - minX;
    const h = maxY - minY;

    cvs.width = w;
    cvs.height = h;
    ctx.drawImage(img, minX, minY, w, h, 0, 0, w, h);
    
    // 2. Apply Magic Filter (Auto-enhance for invoices)
    const filterCvs = document.createElement('canvas');
    filterCvs.width = w;
    filterCvs.height = h;
    const fCtx = filterCvs.getContext('2d');
    if (!fCtx) return;

    fCtx.filter = 'contrast(120%) saturate(120%) brightness(105%)';
    fCtx.drawImage(cvs, 0, 0);

    const processedData = filterCvs.toDataURL('image/jpeg', 0.9);
    
    // 3. Add to stack and reset
    setPages(prev => [...prev, processedData]);
    setStep('camera');
    setOriginalImage(null);
  };

  const handleGeneratePDF = async () => {
    if (pages.length === 0 || isSaving) return;
    setIsSaving(true);

    try {
        // Initialize PDF with first page stats
        const firstImg = new Image();
        firstImg.src = pages[0];
        await new Promise(r => firstImg.onload = r);

        const pdf = new jsPDF({
            orientation: firstImg.width > firstImg.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [firstImg.width, firstImg.height]
        });

        pdf.addImage(pages[0], 'JPEG', 0, 0, firstImg.width, firstImg.height);

        // Add subsequent pages
        for (let i = 1; i < pages.length; i++) {
            const nextImg = new Image();
            nextImg.src = pages[i];
            await new Promise(r => nextImg.onload = r);
            
            pdf.addPage([nextImg.width, nextImg.height], nextImg.width > nextImg.height ? 'l' : 'p');
            pdf.addImage(pages[i], 'JPEG', 0, 0, nextImg.width, nextImg.height);
        }
        
        const pdfBlob = pdf.output('blob');
        const file = new File([pdfBlob], `scan_${Date.now()}.pdf`, { type: 'application/pdf' });
        
        onCapture(file);
    } catch (e) {
        console.error("Error creating PDF", e);
        setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white font-sans overflow-hidden touch-none select-none">
      
      {/* 1. CAMERA MODE */}
      {step === 'camera' && (
        <>
            <div className="absolute inset-0 z-0 bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-90" />
            </div>

            {/* Header */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-20 flex flex-col items-center pt-6 px-4">
                 <div className="w-full flex justify-between items-start mb-4">
                    <button onClick={onClose} className="p-2 bg-black/20 rounded-full backdrop-blur-md">
                        <X className="w-6 h-6 text-white" />
                    </button>
                 </div>
                 
                 <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                    <span className="text-sm font-medium text-white/90">
                        {pages.length > 0 ? `Ready for page ${pages.length + 1}` : "Ready for next scan."}
                    </span>
                 </div>
            </div>
            
            {/* Guide */}
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                <div className="w-[80%] h-[70%] border-2 border-[#4285F4] shadow-[0_0_0_9999px_rgba(0,0,0,0.3)] rounded-sm"></div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black via-black/80 to-transparent pb-10 pt-20">
                <div className="flex items-center justify-around px-8">
                    {/* Flash Toggle */}
                    <button onClick={toggleFlash} className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 active:scale-95 transition-transform">
                        {flash ? <Zap className="w-5 h-5 text-yellow-400" /> : <ZapOff className="w-5 h-5 text-white" />}
                    </button>

                    {/* Shutter */}
                    <button 
                        onClick={capturePhoto}
                        className="group relative cursor-pointer transform active:scale-95 transition-all duration-150"
                    >
                        <div className="w-20 h-20 rounded-full border-[5px] border-white flex items-center justify-center">
                             <div className="w-[66px] h-[66px] bg-white rounded-full group-active:bg-slate-300 transition-colors"></div>
                        </div>
                    </button>

                    {/* Save Button (With Page Count) */}
                    <button 
                        onClick={handleGeneratePDF}
                        disabled={pages.length === 0 || isSaving}
                        className={`w-12 h-12 flex items-center justify-center rounded-full backdrop-blur-md border active:scale-95 transition-all ${
                            pages.length > 0 
                                ? 'bg-white text-black border-white' 
                                : 'bg-black/40 border-white/10 text-white/50'
                        }`}
                    >
                        {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : pages.length > 0 ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <span className="font-bold text-sm">Save</span>
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#4285F4] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-black">
                                    {pages.length}
                                </div>
                            </div>
                        ) : (
                            <Files className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>
        </>
      )}

      {/* 2. CROP / EDIT MODE */}
      {step === 'crop' && originalImage && (
        <div className="absolute inset-0 z-20 bg-black flex flex-col">
            
            {/* Main Interactive Area */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#121212]">
                <div 
                    ref={containerRef}
                    className="relative max-w-full max-h-full shadow-2xl touch-none"
                    style={{ aspectRatio: `${imageDims.width} / ${imageDims.height}` }}
                    onMouseMove={handleDragMove}
                    onMouseUp={handleDragEnd}
                    onTouchMove={handleDragMove}
                    onTouchEnd={handleDragEnd}
                >
                    <img 
                        ref={imageRef}
                        src={originalImage} 
                        className="w-full h-full object-contain pointer-events-none select-none" 
                        draggable={false}
                    />
                    
                    {/* SVG Mask & Lines */}
                    <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
                        <defs>
                            <mask id="cropMask">
                                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                                <polygon 
                                    points={`${corners[0].x}%,${corners[0].y}% ${corners[1].x}%,${corners[1].y}% ${corners[2].x}%,${corners[2].y}% ${corners[3].x}%,${corners[3].y}%`} 
                                    fill="black" 
                                />
                            </mask>
                        </defs>
                        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#cropMask)" />
                        <polygon 
                            points={`${corners[0].x}%,${corners[0].y}% ${corners[1].x}%,${corners[1].y}% ${corners[2].x}%,${corners[2].y}% ${corners[3].x}%,${corners[3].y}%`}
                            fill="none" stroke="white" strokeWidth="2.5" vectorEffect="non-scaling-stroke"
                        />
                    </svg>

                    {/* Handles */}
                    {corners.map((p, i) => (
                        <div
                            key={i}
                            className="absolute w-14 h-14 -ml-7 -mt-7 z-20 flex items-center justify-center cursor-move"
                            style={{ left: `${p.x}%`, top: `${p.y}%` }}
                            onMouseDown={() => handleDragStart(i)}
                            onTouchStart={() => handleDragStart(i)}
                        >
                            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full border-[3px] border-white shadow-lg"></div>
                        </div>
                    ))}

                    {/* Magnifier */}
                    {activeCorner !== null && magnifierPos && (
                        <div 
                            className="absolute w-32 h-32 rounded-full border-4 border-white bg-black overflow-hidden shadow-2xl z-50 pointer-events-none"
                            style={{
                                left: `clamp(0%, ${magnifierPos.x}%, 100%)`, 
                                top: `clamp(0%, ${magnifierPos.y - 15}%, 100%)`, 
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            <div 
                                className="w-full h-full bg-no-repeat"
                                style={{
                                    backgroundImage: `url(${originalImage})`,
                                    backgroundSize: '200%',
                                    backgroundPositionX: `${magnifierPos.x}%`,
                                    backgroundPositionY: `${magnifierPos.y}%`
                                }}
                            >
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_2px_black]"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Overlays: Top Buttons */}
            <div className="absolute top-6 left-4 z-30">
                <button 
                    onClick={() => setStep('camera')}
                    className="bg-[#1c1c1e]/80 backdrop-blur-md text-white px-5 py-2.5 rounded-full font-semibold text-sm shadow-lg border border-white/5 active:scale-95 transition-transform"
                >
                    Retake
                </button>
            </div>
            
            {/* Auto-detect pill */}
            {isDetecting && (
                <div className="absolute top-20 inset-x-0 flex justify-center z-30 pointer-events-none">
                    <div className="bg-[#245656]/90 text-white backdrop-blur-md px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-white/20 animate-pulse">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">Auto-detecting edges...</span>
                    </div>
                </div>
            )}
            
            <div className="absolute top-6 right-4 z-30">
                <button 
                    onClick={handleKeepScan}
                    className="bg-[#1c1c1e]/80 backdrop-blur-md text-white px-5 py-2.5 rounded-full font-semibold text-sm shadow-lg border border-white/5 active:scale-95 transition-transform"
                >
                    Keep Scan
                </button>
            </div>

            {/* Bottom Tools */}
            <div className="h-20 bg-black flex items-center justify-center gap-12 text-white/80 z-30">
                 <button onClick={handleFull} className="flex flex-col items-center gap-1 active:text-white transition-colors">
                    <Maximize className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Full Page</span>
                 </button>
                 <button onClick={handleRotate} className="flex flex-col items-center gap-1 active:text-white transition-colors">
                    <RotateCcw className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Rotate</span>
                 </button>
            </div>
        </div>
      )}
    </div>
  );
};
