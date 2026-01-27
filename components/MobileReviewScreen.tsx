
import React, { useState } from 'react';
import { InvoiceRecord, InvoiceData, LineItem } from '../types';
import { Save, Trash2, ArrowRight, DollarSign, AlertTriangle, Plus, Tag } from 'lucide-react';
import { ImageViewer } from './ImageViewer';

interface MobileReviewScreenProps {
  record: InvoiceRecord;
  onBack: () => void;
  onSave: (id: string, data: InvoiceData) => void;
  onDelete: (id: string) => void;
}

export const MobileReviewScreen: React.FC<MobileReviewScreenProps> = ({ record, onBack, onSave, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'items' | 'image'>('items');
  const [data, setData] = useState<InvoiceData | undefined>(record.data);

  if (record.status === 'error' || !data) {
      return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Processing Failed</h3>
              <p className="text-slate-500 text-sm mt-2">{record.error || "Could not extract data."}</p>
              <button onClick={() => onDelete(record.id)} className="mt-8 text-red-600 font-medium">Delete Invoice</button>
          </div>
      );
  }

  const handleSave = () => {
    onSave(record.id, data);
  };

  const updateItem = (index: number, field: keyof LineItem, val: any) => {
    const newItems = [...data.line_items];
    newItems[index] = { ...newItems[index], [field]: val };
    
    // Simple recalc logic for cost
    if (field === 'case_cost' || field === 'qty') {
         const item = newItems[index];
         const cost = field === 'case_cost' ? parseFloat(val) : (item.case_cost || 0);
         const qty = field === 'qty' ? parseFloat(val) : (item.qty || 0);
         item.extended_case_cost = cost * qty;
    }

    setData({ ...data, line_items: newItems });
  };

  const handleAddItem = () => {
    const newItem: LineItem = {
      row_index: data.line_items.length + 1,
      qty: 1,
      item_code: '',
      scan_code: '',
      item_description: '',
      department: 'Grocery',
      price_group: '',
      product_category: '',
      units: 1,
      case_cost: 0,
      case_discount: 0,
      cost_per_unit_after_discount: 0,
      extended_case_cost: 0,
      unit_retail: 0,
      extended_unit_retail: 0,
      size: '',
      default_margin_percent: 0,
      calculated_margin_percent: 0,
      confidence: 1,
      notes: 'Manual Entry'
    };
    // Add to top of list for visibility
    setData({ ...data, line_items: [newItem, ...data.line_items] });
  };

  const handleAddFee = () => {
    const newFee: LineItem = {
      row_index: data.line_items.length + 1,
      qty: 1,
      item_code: 'FEE',
      scan_code: '',
      item_description: 'Fee / Adjustment',
      department: 'Fees',
      price_group: '',
      product_category: '',
      units: 1,
      case_cost: 0,
      case_discount: 0,
      cost_per_unit_after_discount: 0,
      extended_case_cost: 0,
      unit_retail: 0,
      extended_unit_retail: 0,
      size: '',
      default_margin_percent: 0,
      calculated_margin_percent: 0,
      confidence: 1,
      notes: 'Manual Fee'
    };
    setData({ ...data, line_items: [newFee, ...data.line_items] });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
       {/* Sub-header Tabs */}
       <div className="bg-[#245656] px-4 pb-2 flex gap-4 text-white/80 text-sm">
           <button 
             onClick={() => setActiveTab('items')}
             className={`pb-1 border-b-2 transition-colors ${activeTab === 'items' ? 'border-white text-white font-medium' : 'border-transparent'}`}
           >
             Items ({data.line_items.length})
           </button>
           <button 
             onClick={() => setActiveTab('image')}
             className={`pb-1 border-b-2 transition-colors ${activeTab === 'image' ? 'border-white text-white font-medium' : 'border-transparent'}`}
           >
             Original Receipt
           </button>
       </div>

       {/* Content */}
       <div className="flex-1 overflow-y-auto">
          {activeTab === 'image' ? (
              <ImageViewer file={record.file} />
          ) : (
              <div className="pb-24">
                  {/* Invoice Meta */}
                  <div className="bg-white p-4 border-b border-slate-200 mb-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                              <p className="text-slate-500 text-xs">Vendor</p>
                              <p className="font-medium text-slate-800">{data.invoice_header.vendor_name || record.vendor}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-slate-500 text-xs">Total</p>
                              <p className="font-bold text-lg text-[#245656]">${data.invoice_header.invoice_total?.toFixed(2)}</p>
                          </div>
                          <div>
                              <p className="text-slate-500 text-xs">Invoice #</p>
                              <p className="font-medium text-slate-800">{data.invoice_header.invoice_number || '-'}</p>
                          </div>
                           <div className="text-right">
                              <p className="text-slate-500 text-xs">Date</p>
                              <p className="font-medium text-slate-800">{data.invoice_header.invoice_date || '-'}</p>
                          </div>
                      </div>
                  </div>

                  {/* Manual Entry Actions */}
                  <div className="grid grid-cols-2 gap-3 px-3 mb-3">
                      <button 
                        onClick={handleAddItem}
                        className="flex items-center justify-center gap-2 bg-white border border-dashed border-slate-300 text-slate-600 py-3 rounded-lg text-sm font-medium hover:bg-slate-50 hover:border-[#245656] hover:text-[#245656] transition-colors shadow-sm"
                      >
                          <Plus className="w-4 h-4" />
                          Add Item
                      </button>
                      <button 
                        onClick={handleAddFee}
                        className="flex items-center justify-center gap-2 bg-white border border-dashed border-slate-300 text-slate-600 py-3 rounded-lg text-sm font-medium hover:bg-slate-50 hover:border-[#245656] hover:text-[#245656] transition-colors shadow-sm"
                      >
                          <Tag className="w-4 h-4" />
                          Add Fee
                      </button>
                  </div>

                  {/* Line Items Cards */}
                  <div className="space-y-2 px-2">
                      {data.line_items.map((item, idx) => (
                          <div key={idx} className="bg-white rounded-lg shadow-sm border border-slate-200 p-3 flex flex-col gap-2">
                              <div className="flex justify-between items-start gap-2">
                                  <div className="flex-1">
                                      <input 
                                        className="font-medium text-slate-800 text-sm w-full border-none p-0 focus:ring-0 placeholder-slate-400" 
                                        value={item.item_description || ''} 
                                        onChange={(e) => updateItem(idx, 'item_description', e.target.value)}
                                        placeholder="Item Description"
                                      />
                                      <div className="flex items-center gap-2 mt-1">
                                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1 rounded border border-slate-200">
                                            {item.item_code || 'No Code'}
                                          </span>
                                           <span className="text-[10px] bg-slate-100 text-slate-500 px-1 rounded border border-slate-200">
                                            UPC: {item.scan_code || '-'}
                                          </span>
                                      </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                      <div className="flex items-center justify-end font-mono text-sm font-bold text-slate-700">
                                          <span>$</span>
                                          <span>{item.extended_case_cost?.toFixed(2)}</span>
                                      </div>
                                  </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2 mt-1 pt-2 border-t border-slate-50">
                                  <div>
                                      <label className="text-[10px] text-slate-400 uppercase">Qty</label>
                                      <input 
                                        type="number"
                                        className="w-full text-xs font-medium bg-slate-50 rounded border-transparent focus:bg-white focus:border-[#245656] focus:ring-0 p-1"
                                        value={item.qty || 0}
                                        onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                                      />
                                  </div>
                                  <div>
                                      <label className="text-[10px] text-slate-400 uppercase">Cost</label>
                                       <input 
                                        type="number"
                                        step="0.01"
                                        className="w-full text-xs font-medium bg-slate-50 rounded border-transparent focus:bg-white focus:border-[#245656] focus:ring-0 p-1"
                                        value={item.case_cost || 0}
                                        onChange={(e) => updateItem(idx, 'case_cost', e.target.value)}
                                      />
                                  </div>
                                  <div>
                                      <label className="text-[10px] text-slate-400 uppercase">Margin</label>
                                      <div className={`text-xs font-bold pt-1.5 ${(item.calculated_margin_percent || 0) < 20 ? 'text-red-500' : 'text-emerald-600'}`}>
                                          {item.calculated_margin_percent?.toFixed(1)}%
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
       </div>

       {/* Footer Actions */}
       {record.status !== 'saved' && (
           <div className="bg-white border-t border-slate-200 p-4 sticky bottom-0 z-20 shadow-lg">
               <button 
                  onClick={handleSave}
                  className="w-full bg-[#245656] hover:bg-[#1e4646] text-white font-bold py-3.5 rounded-xl shadow flex items-center justify-center gap-2 active:scale-95 transition-transform"
               >
                  <Save className="w-5 h-5" />
                  Save to Purchase Entries
               </button>
               <button onClick={() => onDelete(record.id)} className="w-full mt-3 text-red-500 text-sm font-medium">
                   Discard Invoice
               </button>
           </div>
       )}
    </div>
  );
};
