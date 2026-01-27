
import React, { useState, useRef } from 'react';
import { InvoiceRecord } from '../types';
import { ChevronRight, Loader2, FileText, Search, Camera, UploadCloud, ChevronDown, Sparkles } from 'lucide-react';

interface MobilePurchasesScreenProps {
  invoices: InvoiceRecord[];
  onSelectInvoice: (id: string) => void;
  onUpload: (file: File, vendor: string) => void;
  onScan: (vendor: string) => void;
  activeTab: 'unretailed' | 'purchases';
  onTabChange: (tab: 'unretailed' | 'purchases') => void;
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

export const MobilePurchasesScreen: React.FC<MobilePurchasesScreenProps> = ({ 
  invoices, 
  onSelectInvoice,
  onUpload,
  onScan,
  activeTab,
  onTabChange
}) => {
  const [selectedVendor, setSelectedVendor] = useState(VENDORS[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0], selectedVendor);
      e.target.value = '';
    }
  };

  const renderInvoiceList = () => (
    <div className="pb-24 h-full flex flex-col">
        
        {/* Compact Upload Section */}
        <div className="bg-white border-b border-slate-200 p-4 space-y-3">
             <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-[#245656]" />
                <h3 className="text-sm font-semibold text-slate-800">AI Invoice Reader</h3>
             </div>
             
             {/* Vendor Select */}
             <div className="relative">
                <select 
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-[#245656] focus:border-[#245656] block p-2.5 pr-8"
                >
                    {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3">
                 <button 
                    onClick={() => onScan(selectedVendor)}
                    className="flex items-center justify-center gap-2 bg-[#245656] text-white py-2.5 rounded-lg shadow hover:bg-[#1e4646] active:scale-95 transition-all"
                 >
                     <Camera className="w-4 h-4" />
                     <span className="font-medium text-sm">Scan</span>
                 </button>
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 bg-white text-[#245656] border border-[#245656] py-2.5 rounded-lg shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                 >
                     <UploadCloud className="w-4 h-4" />
                     <span className="font-medium text-sm">Upload</span>
                 </button>
            </div>
            
            <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
            />
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search purchases..." 
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#245656] shadow-sm"
                />
            </div>
        </div>

        {/* Invoices List */}
        <div className="divide-y divide-slate-100 bg-white flex-1 overflow-y-auto">
            {invoices.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center mt-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <FileText className="w-6 h-6 text-slate-300" />
                    </div>
                    <h3 className="text-slate-900 font-medium text-sm">No Purchases Found</h3>
                    <p className="text-slate-500 text-xs mt-1">Scan or upload an invoice above.</p>
                </div>
            ) : (
                invoices.map((inv) => (
                    <div 
                        key={inv.id} 
                        onClick={() => inv.status !== 'processing' && onSelectInvoice(inv.id)}
                        className={`p-4 flex items-center justify-between hover:bg-slate-50 transition-colors ${inv.status === 'processing' ? 'opacity-75 cursor-wait' : 'cursor-pointer'}`}
                    >
                        <div className="flex items-center gap-4">
                            {/* Thumbnail / Icon */}
                            <div className="w-12 h-12 rounded bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 flex items-center justify-center relative">
                                {inv.status === 'processing' ? (
                                    <Loader2 className="w-5 h-5 text-[#245656] animate-spin" />
                                ) : inv.thumbnailUrl ? (
                                    <img src={inv.thumbnailUrl} alt="doc" className="w-full h-full object-cover" />
                                ) : (
                                    <FileText className="w-6 h-6 text-slate-400" />
                                )}
                                {inv.isAiGenerated && (
                                    <div className="absolute top-0 right-0 p-0.5 bg-indigo-500 rounded-bl-md">
                                        <Sparkles className="w-2 h-2 text-white" />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-900 text-sm">{inv.vendor}</span>
                                    {inv.status === 'saved' && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 rounded font-medium">SAVED</span>}
                                </div>
                                <span className="text-xs text-slate-500">{inv.uploadDate}</span>
                                
                                {inv.status === 'processing' && (
                                    <span className="text-xs text-amber-600 font-medium mt-0.5 animate-pulse">Processing...</span>
                                )}
                                {inv.status === 'error' && (
                                    <span className="text-xs text-red-500 font-medium mt-0.5">Analysis Failed</span>
                                )}
                                    {inv.status === 'ready' && inv.data && (
                                    <span className="text-xs text-emerald-600 font-medium mt-0.5">
                                        ${inv.data.invoice_header.invoice_total?.toFixed(2) || '0.00'} • {inv.data.line_items.length} Items
                                    </span>
                                )}
                            </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-slate-300" />
                    </div>
                ))
            )}
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 flex shrink-0">
        <button 
          onClick={() => onTabChange('unretailed')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'unretailed' ? 'border-[#245656] text-[#245656]' : 'border-transparent text-slate-500'}`}
        >
          Un-retailed
        </button>
        <button 
          onClick={() => onTabChange('purchases')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'purchases' ? 'border-[#245656] text-[#245656]' : 'border-transparent text-slate-500'}`}
        >
          Purchases
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'unretailed' && (
           <div className="p-8 text-center text-slate-400 mt-10">
              <p>No un-retailed items.</p>
           </div>
        )}

        {activeTab === 'purchases' && renderInvoiceList()}
      </div>
    </div>
  );
};
