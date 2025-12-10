import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { InvoiceTable } from './components/InvoiceTable';
import { ImageViewer } from './components/ImageViewer';
import { Header } from './components/Header';
import { analyzeInvoice } from './services/geminiService';
import { InvoiceData } from './types';
import { ArrowLeft, Save, CheckCircle2, Trash2, Upload } from 'lucide-react';

const App: React.FC = () => {
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [priceBookFile, setPriceBookFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = () => {
    setInvoiceFile(null);
    setPriceBookFile(null);
    setInvoiceData(null);
    setError(null);
  };

  const handleProcess = async () => {
    if (!invoiceFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      const data = await analyzeInvoice(invoiceFile, priceBookFile);
      setInvoiceData(data);
    } catch (err: any) {
      setError(err.message || "Failed to process invoice. Please try again.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDataChange = useCallback((newData: InvoiceData) => {
    setInvoiceData(newData);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden text-slate-800">
      <Header />

      <main className="flex-1 overflow-hidden relative">
        {!invoiceFile ? (
          // Initial Upload Screen
          <div className="h-full overflow-y-auto p-6 flex flex-col items-center justify-center">
            <div className="max-w-2xl w-full space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-slate-900">Upload Invoice</h1>
                <p className="text-slate-500">
                  Upload an invoice (PDF or Image) to begin extraction.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <FileUpload
                    id="invoice-upload"
                    accept="image/*,application/pdf"
                    file={invoiceFile}
                    onFileSelect={setInvoiceFile}
                    label="Drop invoice PDF or Image here"
                  />
              </div>
            </div>
          </div>
        ) : (
          // Split View (Pre-process and Post-process)
          <div className="flex h-full">
            {/* Left Panel: Image Viewer */}
            <div className="w-1/3 h-full border-r border-slate-200 bg-slate-100 flex flex-col">
              <div className="p-3 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm z-10">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Original Document</span>
              </div>
              <div className="flex-1 overflow-hidden relative bg-slate-200/50">
                <ImageViewer file={invoiceFile} />
              </div>
            </div>

            {/* Right Panel: Controls or Data */}
            <div className="w-2/3 h-full flex flex-col bg-white">
              {isProcessing ? (
                // Loading State
                 <div className="h-full flex flex-col items-center justify-center space-y-6 bg-slate-50/50">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-xl font-semibold text-slate-900">Analyzing Invoice...</h2>
                        <p className="text-slate-500 max-w-sm">
                        Gemini is reading line items, matching product codes, and calculating margins. This may take a moment.
                        </p>
                    </div>
                </div>
              ) : !invoiceData ? (
                // Configuration State (Price Book & Process)
                <div className="h-full overflow-y-auto p-12 flex flex-col items-center justify-center">
                   <div className="max-w-lg w-full space-y-6">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-900">Ready to Process</h2>
                        <p className="text-slate-500">Add an optional price book or start extraction.</p>
                      </div>

                      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
                        <div className="space-y-3">
                          <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-500 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Optional: Price Book
                          </h3>
                          <FileUpload
                            id="pricebook-upload"
                            accept=".csv,.txt"
                            file={priceBookFile}
                            onFileSelect={setPriceBookFile}
                            label="Drop price book CSV here"
                          />
                        </div>

                        {error && (
                          <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
                            {error}
                          </div>
                        )}

                        <button
                            onClick={handleProcess}
                            className="w-full py-4 rounded-lg font-bold text-white shadow-md bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transition-all"
                        >
                            Process Invoice
                        </button>
                      </div>
                   </div>
                </div>
              ) : (
                // Results State
                <>
                  <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                    <div>
                      <h2 className="font-bold text-lg text-slate-900">Extracted Data</h2>
                      {invoiceData.invoice_header && (
                        <div className="text-xs text-slate-500 flex gap-4 mt-1">
                            <span>Inv #: <strong className="text-slate-700">{invoiceData.invoice_header.invoice_number}</strong></span>
                            <span>Date: <strong className="text-slate-700">{invoiceData.invoice_header.invoice_date}</strong></span>
                            <span>Vendor: <strong className="text-slate-700">{invoiceData.invoice_header.vendor_name}</strong></span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleReset}
                        className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md text-sm font-medium transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Another
                      </button>
                      <button 
                        onClick={handleReset}
                        className="flex items-center gap-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md text-sm font-medium transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm">
                        <Save className="w-4 h-4" />
                        Save to Purchase Entries
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <InvoiceTable data={invoiceData} onDataChange={handleDataChange} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;