
import React, { useState, useRef } from 'react';
import { InvoiceRecord } from '../types';
import { Camera, UploadCloud, ChevronDown, FileText, Filter, Sparkles } from 'lucide-react';

interface MobileDocsScreenProps {
  invoices: InvoiceRecord[];
  onUpload: (file: File, vendor: string) => void;
  onScan: (vendor: string) => void;
  onViewDoc: (id: string) => void;
  onNavigateToPurchases: () => void;
}

const DOC_TYPES = ["Purchases", "Daily Sales", "Expenses", "Payroll", "Fuel Delivery"];
const VENDORS = [
  "Coca Cola",
  "Frito Lay",
  "Pepsi Co",
  "Reyes Coca-Cola",
  "Core-Mark",
  "McLane",
  "Sysco",
  "US Foods",
  "Costco Wholesale"
];

export const MobileDocsScreen: React.FC<MobileDocsScreenProps> = ({ invoices, onUpload, onScan, onViewDoc, onNavigateToPurchases }) => {
  const [docType, setDocType] = useState("Purchases");
  const [vendor, setVendor] = useState(VENDORS[0]);
  const [docStatus, setDocStatus] = useState("All");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0], vendor);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
      if (docStatus === "All") return true;
      return true; 
  });

  return (
    <div className="flex flex-col h-full bg-slate-100">
      
      {/* Top Filter & Action Section */}
      <div className="bg-white p-4 shadow-sm z-10 space-y-4">
          
          {/* Filters */}
          <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase">Doc Type</label>
                  <div className="relative">
                      <select 
                          value={docType} 
                          onChange={(e) => setDocType(e.target.value)}
                          className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-[#245656] focus:border-[#245656] block p-2.5 pr-8"
                      >
                          {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
              </div>

              {docType === 'Purchases' && (
                  <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-500 uppercase">Payee / Vendor</label>
                      <div className="relative">
                          <select 
                              value={vendor} 
                              onChange={(e) => setVendor(e.target.value)}
                              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg focus:ring-[#245656] focus:border-[#245656] block p-2.5 pr-8"
                          >
                              {VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                  </div>
              )}
          </div>

          {/* Upload Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
             <button 
                onClick={() => onScan(vendor)}
                className="flex items-center justify-center gap-2 bg-[#245656] text-white py-3 rounded-lg shadow hover:bg-[#1e4646] active:scale-95 transition-all"
             >
                 <Camera className="w-5 h-5" />
                 <span className="font-medium text-sm">Scan</span>
             </button>
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 bg-white text-[#245656] border border-[#245656] py-3 rounded-lg shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
             >
                 <UploadCloud className="w-5 h-5" />
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

      {/* Filter Bar (Status) */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200">
          <span className="text-sm font-medium text-slate-600">Doc Status:</span>
          <select 
             className="bg-transparent text-sm text-slate-800 font-semibold focus:outline-none"
             value={docStatus}
             onChange={(e) => setDocStatus(e.target.value)}
          >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Processed">Processed</option>
          </select>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredInvoices.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                  <p>No documents found.</p>
              </div>
          ) : (
              filteredInvoices.map((inv) => (
                  <div key={inv.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
                      <div className="flex justify-between items-start mb-2">
                          <div>
                              <div className="flex items-center gap-2">
                                  <p className="text-xs text-slate-500">Added by: <span className="text-slate-800 font-medium">user@modisoft.com</span></p>
                                  {inv.isAiGenerated && (
                                      <div className="flex items-center gap-1 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full" title="Processed by AI Invoice Reader">
                                          <Sparkles className="w-3 h-3 text-indigo-600" />
                                          <span className="text-[10px] font-medium text-indigo-700">AI</span>
                                      </div>
                                  )}
                              </div>
                              <p className="text-xs text-slate-500">Added on: <span className="text-slate-800 font-medium">{inv.uploadDate}</span></p>
                          </div>
                          <button 
                             onClick={() => onViewDoc(inv.id)}
                             className="bg-[#66bb6a] text-white text-xs font-bold px-3 py-1.5 rounded shadow-sm hover:bg-[#5da760]"
                          >
                              View Doc
                          </button>
                      </div>
                      
                      <div className="space-y-1">
                          <p className="text-sm text-slate-700">
                             <span className="font-medium">Doc Type:</span>{' '}
                             <button onClick={onNavigateToPurchases} className="text-[#245656] hover:underline font-medium hover:text-[#1e4646]">
                                 Purchase
                             </button>
                          </p>
                          <p className="text-sm text-slate-700"><span className="font-medium">Process Status:</span> 
                            {inv.status === 'processing' ? <span className="text-amber-500 ml-1">Pending</span> : 
                             inv.status === 'error' ? <span className="text-red-500 ml-1">Failed</span> :
                             <span className="text-emerald-600 ml-1">Processed</span>
                            }
                          </p>
                          <p className="text-sm text-slate-700 truncate"><span className="font-medium">Description:</span> {inv.vendor} - {inv.file.name}</p>
                      </div>
                  </div>
              ))
          )}
      </div>
    </div>
  );
};
