import React from 'react';
import { Sparkles, ShoppingCart } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 shadow-sm z-20">
      <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="bg-indigo-600 p-2 rounded-lg">
             <Sparkles className="w-5 h-5 text-white" />
           </div>
           <div className="flex flex-col">
             <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Modisoft</h1>
             <span className="text-xs text-slate-500 font-medium px-0.5">AI Invoice Reader <span className="text-amber-500 text-[10px] border border-amber-200 bg-amber-50 px-1 rounded ml-1">BETA</span></span>
           </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-sm text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              System Online
           </div>
           <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
              <ShoppingCart className="w-5 h-5" />
           </button>
        </div>
      </div>
    </header>
  );
};