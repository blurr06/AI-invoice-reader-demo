
import React from 'react';
import { ArrowLeft, Menu, FileText } from 'lucide-react';

interface MobileHeaderProps {
  title: string;
  showBack: boolean;
  onBack: () => void;
  onDocsClick?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ title, showBack, onBack, onDocsClick }) => {
  return (
    <header className="bg-[#245656] text-white h-14 flex items-center px-4 justify-between shadow-md shrink-0 z-20">
      <div className="flex items-center gap-4">
        {showBack ? (
            <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full">
                <ArrowLeft className="w-6 h-6" />
            </button>
        ) : (
            <button className="p-1 hover:bg-white/10 rounded-full">
                <Menu className="w-6 h-6" />
            </button>
        )}
        <h1 className="text-lg font-medium tracking-wide">{title}</h1>
      </div>
      
      <div>
         <button 
           onClick={onDocsClick}
           className="flex flex-col items-center justify-center text-white/90 hover:text-white active:scale-95 transition-transform"
         >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none mt-0.5">Docs</span>
         </button>
      </div>
    </header>
  );
};
