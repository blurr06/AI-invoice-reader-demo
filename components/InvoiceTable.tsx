import React from 'react';
import { InvoiceData, LineItem } from '../types';
import { AlertTriangle, Trash2, Calculator } from 'lucide-react';

interface InvoiceTableProps {
  data: InvoiceData;
  onDataChange: (data: InvoiceData) => void;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({ data, onDataChange }) => {
  
  const handleCellChange = (rowIndex: number, field: keyof LineItem, value: any) => {
    const updatedItems = [...data.line_items];
    updatedItems[rowIndex] = { ...updatedItems[rowIndex], [field]: value };
    onDataChange({ ...data, line_items: updatedItems });
  };

  const handleDeleteRow = (rowIndex: number) => {
     const updatedItems = data.line_items.filter((_, idx) => idx !== rowIndex);
     onDataChange({ ...data, line_items: updatedItems });
  };

  // Helper to render confidence indicator
  const renderConfidence = (conf: number) => {
    if (conf > 0.8) return <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto" title="High Confidence"></div>;
    if (conf > 0.5) return <div className="w-2 h-2 rounded-full bg-amber-500 mx-auto" title="Medium Confidence"></div>;
    return <AlertTriangle className="w-3 h-3 text-red-500 mx-auto" title="Low Confidence - Check this" />;
  };

  const calculatedTotal = data.line_items.reduce((sum, item) => sum + (item.extended_case_cost || 0), 0);
  const invoiceTotal = data.invoice_header.invoice_total || 0;
  const discrepancy = Math.abs(calculatedTotal - invoiceTotal);
  const isMatch = discrepancy < 0.05; // allow small rounding error

  return (
    <div className="w-full h-full overflow-auto custom-scrollbar bg-slate-50 flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs text-left">
            <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm text-slate-600 font-semibold">
            <tr>
                <th className="p-2 border-b border-slate-200 w-8 text-center">#</th>
                <th className="p-2 border-b border-slate-200 w-8 text-center" title="Confidence">Conf</th>
                <th className="p-2 border-b border-slate-200 w-16">Qty</th>
                <th className="p-2 border-b border-slate-200 w-24">Item Code</th>
                <th className="p-2 border-b border-slate-200 w-32">Scan Code</th>
                <th className="p-2 border-b border-slate-200 min-w-[200px]">Description</th>
                <th className="p-2 border-b border-slate-200 w-24">Dept</th>
                <th className="p-2 border-b border-slate-200 w-16">Units/Case</th>
                <th className="p-2 border-b border-slate-200 w-20 text-right">Case Cost</th>
                <th className="p-2 border-b border-slate-200 w-16 text-right">Disc/Case</th>
                <th className="p-2 border-b border-slate-200 w-20 text-right">Ext Cost</th>
                <th className="p-2 border-b border-slate-200 w-20 text-right">Retail</th>
                <th className="p-2 border-b border-slate-200 w-16 text-right">Margin %</th>
                <th className="p-2 border-b border-slate-200 w-24">Notes</th>
                <th className="p-2 border-b border-slate-200 w-10 text-center"></th>
            </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
            {data.line_items.map((item, idx) => (
                <tr key={idx} className="hover:bg-indigo-50/30 group transition-colors">
                <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                <td className="p-2 text-center">{renderConfidence(item.confidence)}</td>
                <td className="p-2">
                    <input
                    type="number"
                    value={item.qty ?? ''}
                    onChange={(e) => handleCellChange(idx, 'qty', parseFloat(e.target.value))}
                    className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                    />
                </td>
                <td className="p-2 font-mono text-slate-600">
                    <input
                    type="text"
                    value={item.item_code ?? ''}
                    onChange={(e) => handleCellChange(idx, 'item_code', e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                    />
                </td>
                <td className="p-2 font-mono text-slate-500">
                    <input
                    type="text"
                    value={item.scan_code ?? ''}
                    onChange={(e) => handleCellChange(idx, 'scan_code', e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                    />
                </td>
                <td className="p-2">
                    <input
                    type="text"
                    value={item.item_description ?? ''}
                    onChange={(e) => handleCellChange(idx, 'item_description', e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-1 font-medium text-slate-700"
                    />
                </td>
                <td className="p-2">
                    <input
                    type="text"
                    value={item.department ?? ''}
                    onChange={(e) => handleCellChange(idx, 'department', e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                    />
                </td>
                <td className="p-2 text-center">
                    <input
                    type="number"
                    value={item.units ?? ''}
                    onChange={(e) => handleCellChange(idx, 'units', parseFloat(e.target.value))}
                    className="w-full text-center bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                    />
                </td>
                <td className="p-2 text-right font-mono">
                    <div className="relative">
                        <span className="absolute left-0 text-slate-400">$</span>
                        <input
                        type="number"
                        step="0.01"
                        value={item.case_cost ?? ''}
                        onChange={(e) => handleCellChange(idx, 'case_cost', parseFloat(e.target.value))}
                        className="w-full text-right bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                        />
                    </div>
                </td>
                <td className="p-2 text-right font-mono text-slate-500">
                    <input
                        type="number"
                        step="0.01"
                        value={item.case_discount ?? ''}
                        onChange={(e) => handleCellChange(idx, 'case_discount', parseFloat(e.target.value))}
                        className="w-full text-right bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                        placeholder="-"
                    />
                </td>
                <td className="p-2 text-right font-mono font-medium text-slate-700">
                    ${item.extended_case_cost?.toFixed(2) ?? '0.00'}
                </td>
                <td className="p-2 text-right font-mono">
                    <input
                        type="number"
                        step="0.01"
                        value={item.unit_retail ?? ''}
                        onChange={(e) => handleCellChange(idx, 'unit_retail', parseFloat(e.target.value))}
                        className="w-full text-right bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                    />
                </td>
                <td className={`p-2 text-right font-bold ${
                    (item.calculated_margin_percent ?? 0) < 20 ? 'text-red-500' : 'text-emerald-600'
                }`}>
                    {(item.calculated_margin_percent ?? 0).toFixed(1)}%
                </td>
                <td className="p-2 text-slate-400 italic truncate max-w-[100px]" title={item.notes ?? ''}>
                    {item.notes}
                </td>
                <td className="p-2 text-center">
                    <button 
                        onClick={() => handleDeleteRow(idx)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-all"
                        title="Remove Row"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </td>
                </tr>
            ))}
            {data.line_items.length === 0 && (
                <tr>
                    <td colSpan={15} className="p-8 text-center text-slate-400">No line items found.</td>
                </tr>
            )}
            </tbody>
        </table>
      </div>
      
      {/* Footer Summary */}
      <div className="bg-slate-50 border-t border-slate-200 p-4">
        <div className="flex justify-end items-center gap-8 text-sm">
            <div className="text-slate-500">
                Total Items: <span className="font-semibold text-slate-800">{data.line_items.length}</span>
            </div>
            
            <div className="flex items-center gap-6 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex flex-col items-end">
                    <span className="text-xs text-slate-500">Calculated Sum</span>
                    <span className="font-mono font-bold text-lg text-slate-700">
                        ${calculatedTotal.toFixed(2)}
                    </span>
                </div>
                
                {invoiceTotal > 0 && (
                    <>
                        <div className="text-slate-300">|</div>
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-slate-500">Invoice Total</span>
                            <span className="font-mono font-bold text-lg text-slate-900">
                                ${invoiceTotal.toFixed(2)}
                            </span>
                        </div>
                    </>
                )}

                {invoiceTotal > 0 && !isMatch && (
                     <div className="flex items-center gap-2 text-red-600 bg-red-50 px-2 py-1 rounded ml-2">
                        <Calculator className="w-4 h-4" />
                        <span className="font-semibold text-xs">Diff: ${(calculatedTotal - invoiceTotal).toFixed(2)}</span>
                     </div>
                )}

                 {invoiceTotal > 0 && isMatch && (
                     <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded ml-2">
                        <span className="font-semibold text-xs">Match</span>
                     </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};