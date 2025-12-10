import React from 'react';
import { InvoiceData, LineItem } from '../types';
import { AlertTriangle, Trash2, Calculator, Plus } from 'lucide-react';

interface InvoiceTableProps {
  data: InvoiceData;
  onDataChange: (data: InvoiceData) => void;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({ data, onDataChange }) => {
  
  const handleCellChange = (rowIndex: number, field: keyof LineItem, value: any) => {
    const updatedItems = [...data.line_items];
    const currentItem = { ...updatedItems[rowIndex], [field]: value };
    
    // Auto-recalculate if pricing fields change
    if (['qty', 'case_cost', 'case_discount', 'units', 'unit_retail'].includes(field as string)) {
        const qty = field === 'qty' ? value : (currentItem.qty || 0);
        const cost = field === 'case_cost' ? value : (currentItem.case_cost || 0);
        const discount = field === 'case_discount' ? value : (currentItem.case_discount || 0);
        const units = field === 'units' ? value : (currentItem.units || 1);
        const retail = field === 'unit_retail' ? value : (currentItem.unit_retail || 0);

        const costAfterDisc = cost - discount;
        currentItem.cost_per_unit_after_discount = costAfterDisc / (units || 1);
        currentItem.extended_case_cost = qty * costAfterDisc;
        
        if (retail > 0) {
            currentItem.calculated_margin_percent = ((retail - currentItem.cost_per_unit_after_discount) / retail) * 100;
        }
    }

    updatedItems[rowIndex] = currentItem;
    onDataChange({ ...data, line_items: updatedItems });
  };

  const handleDeleteRow = (rowIndex: number) => {
     const updatedItems = data.line_items.filter((_, idx) => idx !== rowIndex);
     onDataChange({ ...data, line_items: updatedItems });
  };

  const handleAddRow = () => {
    const newItem: LineItem = {
      row_index: data.line_items.length + 1,
      qty: 1,
      item_code: '',
      scan_code: '',
      item_description: 'New Item',
      department: '',
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
    onDataChange({ ...data, line_items: [...data.line_items, newItem] });
  };

  const totalQty = data.line_items.reduce((sum, item) => sum + (item.qty || 0), 0);
  const totalUnits = data.line_items.reduce((sum, item) => sum + (item.units || 0), 0);
  const totalCaseCost = data.line_items.reduce((sum, item) => sum + (item.case_cost || 0), 0);
  const calculatedTotal = data.line_items.reduce((sum, item) => sum + (item.extended_case_cost || 0), 0);
  
  const invoiceTotal = data.invoice_header.invoice_total || 0;
  const discrepancy = Math.abs(calculatedTotal - invoiceTotal);
  const isMatch = discrepancy < 0.05;

  return (
    <div className="w-full h-full overflow-auto custom-scrollbar bg-slate-50 flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs text-left">
            <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm text-slate-600 font-semibold">
            <tr>
                <th className="p-2 border-b border-slate-200 w-8 text-center">#</th>
                <th className="p-2 border-b border-slate-200 w-16">Qty</th>
                <th className="p-2 border-b border-slate-200 w-24">Item Code</th>
                <th className="p-2 border-b border-slate-200 w-32">Scan Code</th>
                <th className="p-2 border-b border-slate-200 min-w-[200px]">Description</th>
                <th className="p-2 border-b border-slate-200 w-24">Dept</th>
                <th className="p-2 border-b border-slate-200 w-16 text-center">Units/Case</th>
                <th className="p-2 border-b border-slate-200 w-20 text-right">Case Cost</th>
                <th className="p-2 border-b border-slate-200 w-16 text-right">Disc/Case</th>
                <th className="p-2 border-b border-slate-200 w-20 text-right">Ext Cost</th>
                <th className="p-2 border-b border-slate-200 w-20 text-right">Retail</th>
                <th className="p-2 border-b border-slate-200 w-16 text-right">Margin %</th>
                <th className="p-2 border-b border-slate-200 w-24">Notes</th>
                <th className="p-2 border-b border-slate-200 w-10 text-center">
                    <button onClick={handleAddRow} className="text-emerald-600 hover:text-emerald-700 p-1" title="Add Row">
                        <Plus className="w-4 h-4" />
                    </button>
                </th>
            </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
            {data.line_items.map((item, idx) => {
                // Validation Logic
                const expectedExtCost = (item.qty || 0) * ((item.case_cost || 0) - (item.case_discount || 0));
                const actualExtCost = item.extended_case_cost || 0;
                const isMathError = Math.abs(expectedExtCost - actualExtCost) > 0.05;
                const isCriticalMissing = !item.item_code || !item.item_description;
                const isRowError = isMathError || isCriticalMissing;

                return (
                <tr key={idx} className={`group transition-colors ${isRowError ? 'bg-red-50' : 'hover:bg-indigo-50/30'}`}>
                <td className="p-2 text-center text-slate-400">{idx + 1}</td>
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
                    className={`w-full bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-1 ${!item.item_code ? 'bg-red-100/50' : ''}`}
                    placeholder="Missing"
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
                        onChange={(e) => handleCellChange(idx, 'case_discount', Math.abs(parseFloat(e.target.value)))}
                        className="w-full text-right bg-transparent border-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                        placeholder="-"
                    />
                </td>
                <td className="p-2 text-right font-mono font-medium text-slate-700">
                    <div className={`flex items-center justify-end gap-1 ${isMathError ? 'text-red-600 font-bold' : ''}`}>
                         <span>${item.extended_case_cost?.toFixed(2) ?? '0.00'}</span>
                         {isMathError && <AlertTriangle className="w-3 h-3" />}
                    </div>
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
            )})}
            {data.line_items.length === 0 && (
                <tr>
                    <td colSpan={15} className="p-8 text-center text-slate-400">No line items found.</td>
                </tr>
            )}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 sticky bottom-0 z-10 shadow-[0_-1px_2px_rgba(0,0,0,0.05)] text-slate-700 font-semibold">
              <tr>
                <td className="p-2 text-center text-xs text-slate-500">Totals</td>
                <td className="p-2 text-xs">{totalQty}</td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2 text-center text-xs">{totalUnits}</td>
                <td className="p-2 text-right text-xs font-mono">${totalCaseCost.toFixed(2)}</td>
                <td className="p-2"></td>
                <td className="p-2 text-right text-xs font-mono">${calculatedTotal.toFixed(2)}</td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
                <td className="p-2"></td>
              </tr>
            </tfoot>
        </table>
      </div>
      
      {/* Footer Summary */}
      <div className="bg-slate-50 border-t border-slate-200 p-4">
        <div className="flex justify-between items-center">
            <button 
                onClick={handleAddRow}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
            >
                <Plus className="w-4 h-4" />
                Add Line Item
            </button>

            <div className="flex items-center gap-8 text-sm">
                <div className="text-slate-500">
                    Line Items: <span className="font-semibold text-slate-800">{data.line_items.length}</span>
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
    </div>
  );
};