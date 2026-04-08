import React from 'react';
import { 
  Search,
  ChevronLeft,
  Bell,
  CircleHelp,
  Settings
} from 'lucide-react';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-800 bg-[#181C21]/85 px-8 backdrop-blur-md">
      <div className="flex items-center gap-8">
        {title && (
          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-white">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold tracking-tighter text-white">{title}</h1>
          </div>
        )}
        {!title && <h1 className="text-xl font-bold tracking-tighter text-white">ConstructPro</h1>}
        
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquisar no ConstructPro..." 
            className="w-96 rounded-xl border border-slate-800 bg-[#0B0F15] py-2.5 pl-10 pr-4 text-sm text-slate-100 focus:border-[#4170FF] outline-none transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex gap-4 text-slate-400">
          <button className="relative p-2 hover:bg-white/5 rounded-full transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-secondary border-2 border-[#13171f]"></span>
          </button>
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <CircleHelp className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <Settings className="h-5 w-5" />
          </button>
        </div>
        <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-800 border-2 border-slate-700 shadow-xl cursor-pointer hover:border-[#4170FF] transition-colors">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDr2KBEM3IfNuLeYQzBV2epZtmQRHo705P26eLsIJNDiEclnujrH-W8yGNhysNXXqjOiVzILkQhCDIwxjR0PGIerPvj8eqJTY7Oc8UEQKKnhaSsupnlPqauvvqKk3HoJNEcvL1Kyc0iwjG1Z-tQN2YkiFoDh5SO8ALfjcgKp8FuaK6v3Tsp4RQcn2s7yE3k14OYP1RI8jfXjJ8uHoczokjDD4vwOK4TciQdENZTm185x4zIDC_1ElKSlJ8kQxS_R-2KzY0iRSGLhg" 
            alt="Profile" 
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
}
