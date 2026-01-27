
import React, { useState } from 'react';
import { MobileHeader } from './components/MobileHeader';
import { MobilePurchasesScreen } from './components/MobilePurchasesScreen';
import { MobileUploadScreen } from './components/MobileUploadScreen';
import { MobileReviewScreen } from './components/MobileReviewScreen';
import { MobileDocsScreen } from './components/MobileDocsScreen';
import { DocumentScanner } from './components/DocumentScanner';
import { analyzeInvoice } from './services/geminiService';
import { InvoiceRecord, InvoiceData } from './types';
import { LayoutGrid, FileText, CreditCard, BarChart3, Database, User, Menu } from 'lucide-react';

type Screen = 'dashboard' | 'purchases' | 'upload' | 'review' | 'docs';
type PurchasesTab = 'unretailed' | 'purchases';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  
  // State for Document Scanner
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerVendor, setScannerVendor] = useState<string>('');

  // Lifted state to control the active tab in Purchases Screen
  const [purchasesTab, setPurchasesTab] = useState<PurchasesTab>('purchases');

  // --- Background Processing Logic ---
  const handleStartUpload = async (file: File, vendorName: string, shouldRedirect: boolean = true) => {
    const newId = Date.now().toString();
    
    // 1. Create a "Processing" record immediately
    const newRecord: InvoiceRecord = {
      id: newId,
      vendor: vendorName,
      uploadDate: new Date().toLocaleDateString(),
      status: 'processing',
      file: file,
      thumbnailUrl: URL.createObjectURL(file),
      isAiGenerated: true
    };

    setInvoices(prev => [newRecord, ...prev]);
    
    // 2. Logic to decide where to navigate after upload
    if (shouldRedirect) {
        setCurrentScreen('purchases');
        setPurchasesTab('purchases'); 
    }

    // 3. Trigger Gemini API (Fire and Forget)
    try {
      const data = await analyzeInvoice(file, null);
      
      // Update record with data when done
      setInvoices(prev => prev.map(inv => {
        if (inv.id === newId) {
          // If the AI didn't find a vendor, use the one selected by the user
          if (!data.invoice_header.vendor_name) {
             data.invoice_header.vendor_name = vendorName;
          }
          return { ...inv, status: 'ready', data: data };
        }
        return inv;
      }));
    } catch (err: any) {
      setInvoices(prev => prev.map(inv => 
        inv.id === newId 
          ? { ...inv, status: 'error', error: err.message || "Extraction Failed" } 
          : inv
      ));
    }
  };

  const handleSaveInvoice = (id: string, updatedData: InvoiceData) => {
    setInvoices(prev => prev.map(inv => 
      inv.id === id ? { ...inv, status: 'saved', data: updatedData } : inv
    ));
    setCurrentScreen('purchases');
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    if (currentScreen === 'review') {
        setCurrentScreen('purchases');
    }
  };

  const handleOpenReview = (id: string) => {
    setActiveInvoiceId(id);
    setCurrentScreen('review');
  };

  const triggerScanner = (vendor: string) => {
    setScannerVendor(vendor);
    setIsScannerOpen(true);
  };

  // --- Render Views ---

  const renderContent = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <div className="p-4 grid grid-cols-3 gap-4 mt-2">
             <DashboardItem icon={<CreditCard className="w-8 h-8 text-rose-500" />} label="POS Live" />
             <DashboardItem icon={<BarChart3 className="w-8 h-8 text-orange-500" />} label="Daily Sales" />
             <DashboardItem icon={<LayoutGrid className="w-8 h-8 text-slate-600" />} label="POS Closing" />
             <DashboardItem icon={<FileText className="w-8 h-8 text-blue-500" />} label="Transactions" />
             <DashboardItem icon={<Database className="w-8 h-8 text-amber-600" />} label="Inventory" />
             <div onClick={() => setCurrentScreen('purchases')} className="cursor-pointer">
                <DashboardItem icon={<User className="w-8 h-8 text-emerald-600" />} label="Purchases" active />
             </div>
          </div>
        );
      case 'purchases':
        return (
          <MobilePurchasesScreen 
            invoices={invoices}
            onSelectInvoice={handleOpenReview}
            onUpload={(f, v) => handleStartUpload(f, v, true)}
            onScan={triggerScanner}
            activeTab={purchasesTab}
            onTabChange={setPurchasesTab}
          />
        );
      case 'upload':
        // Legacy fallback
        return (
          <MobileUploadScreen 
            onUpload={(f, v) => handleStartUpload(f, v, true)}
          />
        );
      case 'review':
        const activeRecord = invoices.find(i => i.id === activeInvoiceId);
        if (!activeRecord) return <div>Record not found</div>;
        return (
          <MobileReviewScreen 
            record={activeRecord}
            onBack={() => setCurrentScreen('purchases')}
            onSave={handleSaveInvoice}
            onDelete={handleDeleteInvoice}
          />
        );
      case 'docs':
        return (
          <MobileDocsScreen 
            invoices={invoices}
            onUpload={(f, v) => handleStartUpload(f, v, false)}
            onScan={triggerScanner}
            onViewDoc={handleOpenReview}
            onNavigateToPurchases={() => {
                setCurrentScreen('purchases');
                setPurchasesTab('purchases');
            }}
          />
        );
    }
  };

  const getHeaderTitle = () => {
    switch (currentScreen) {
        case 'dashboard': return 'Dashboard';
        case 'purchases': return 'Purchases';
        case 'upload': return 'Scan & Upload';
        case 'review': return 'Invoice Review';
        case 'docs': return 'Docs';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative">
      <MobileHeader 
        title={getHeaderTitle()} 
        showBack={currentScreen !== 'dashboard'} 
        onBack={() => {
            if (currentScreen === 'upload' || currentScreen === 'review') setCurrentScreen('purchases');
            else if (currentScreen === 'docs') setCurrentScreen('dashboard');
            else if (currentScreen === 'purchases') setCurrentScreen('dashboard');
        }}
        onDocsClick={() => setCurrentScreen('docs')}
      />
      <div className="flex-1 overflow-hidden relative bg-slate-50">
        {renderContent()}
      </div>

      {isScannerOpen && (
        <DocumentScanner 
          onClose={() => setIsScannerOpen(false)}
          onCapture={(file) => {
            setIsScannerOpen(false);
            handleStartUpload(file, scannerVendor);
          }}
        />
      )}
    </div>
  );
};

const DashboardItem = ({ icon, label, active }: { icon: any, label: string, active?: boolean }) => (
    <div className={`flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border ${active ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200'} h-32 space-y-3`}>
        <div className="bg-slate-50 p-3 rounded-full">
            {icon}
        </div>
        <span className="text-xs font-medium text-slate-700 text-center">{label}</span>
    </div>
);

export default App;
