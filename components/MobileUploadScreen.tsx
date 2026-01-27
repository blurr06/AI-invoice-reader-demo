
import React, { useState, useRef } from 'react';
import { Camera, UploadCloud, ChevronDown } from 'lucide-react';

interface MobileUploadScreenProps {
  onCancel?: () => void;
  onUpload: (file: File, vendor: string) => void;
}

const VENDORS = [
  "Coca Cola",
  "Frito Lay",
  "Pepsi Co",
  "Reyes Coca-Cola",
  "Core-Mark",
  "McLane",
  "Sysco",
  "US Foods",
  "Costco Wholesale",
  "Sam's Club"
];

export const MobileUploadScreen: React.FC<MobileUploadScreenProps> = ({ onUpload }) => {
  const [selectedVendor, setSelectedVendor] = useState(VENDORS[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0], selectedVendor);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 space-y-8">
        
        <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-slate-800">New Invoice</h2>
            <p className="text-slate-500 text-sm">Select a vendor and scan your document</p>
        </div>

        {/* Vendor Selection */}
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Select Vendor</label>
            <div className="relative">
                <select 
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-[#245656] focus:border-[#245656] block p-4 pr-10 shadow-sm"
                >
                    {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 grid grid-cols-1 gap-4">
            {/* Camera Button */}
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-5 hover:bg-[#245656]/5 hover:border-[#245656]/30 active:scale-95 transition-all group"
            >
                <div className="w-12 h-12 bg-emerald-100/50 rounded-full flex items-center justify-center group-hover:bg-[#245656] transition-colors">
                    <Camera className="w-6 h-6 text-[#245656] group-hover:text-white" />
                </div>
                <div className="flex flex-col text-left">
                     <span className="text-base font-semibold text-slate-800">Take Photo</span>
                     <span className="text-xs text-slate-500">Use camera to scan invoice</span>
                </div>
            </button>

            {/* Upload Button */}
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-5 hover:bg-indigo-50 hover:border-indigo-200 active:scale-95 transition-all group"
            >
                 <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                    <UploadCloud className="w-6 h-6 text-indigo-600 group-hover:text-white" />
                </div>
                <div className="flex flex-col text-left">
                     <span className="text-base font-semibold text-slate-800">Upload File</span>
                     <span className="text-xs text-slate-500">PDF, PNG, or JPEG</span>
                </div>
            </button>
        </div>

        <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            accept="image/*,application/pdf"
            capture="environment" // Hints mobile browsers to use rear camera
            onChange={handleFileChange}
        />
      </div>
    </div>
  );
};
