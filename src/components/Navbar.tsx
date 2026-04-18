'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Menu, X, ExternalLink } from 'lucide-react';
import Login from '@/components/Login';

export default function Navbar() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 🖱️ 滑動偵測邏輯
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const controlNavbar = () => {
      if (typeof window === 'undefined') return;

      const currentScrollY = window.scrollY;

      // 往下滑超過 100px 就隱藏，往上滑就顯示
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', controlNavbar, { passive: true });
    return () => window.removeEventListener('scroll', controlNavbar);
  }, []);

  const navItems = [
    { name: '總覽', href: '/' },
    { name: '食譜神器', href: '/recipes' },
    { name: '冥夜小助手', href: 'https://brianlien09.github.io/schedule_app/' },
    { name: '冥夜音樂 🎵', href: 'https://brianlien09.github.io/Music_app/' },
  ];

  return (
    <nav
      id="navbar" // 👈 重要：一定要有這個 ID
      className={clsx(
        "fixed top-0 left-0 w-full z-[40] backdrop-blur-md border-b transition-all duration-500 ease-in-out",
        "bg-[#0f111a]/95 border-[#232942]",
        !isVisible && "-translate-y-full" // 控制顯示/隱藏
      )}
    >
       <div className="container flex items-center justify-between !max-w-7xl px-4 h-[70px]">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden shrink-0">
                <span className="text-white text-xs font-bold">B</span>
             </div>
             <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 hidden sm:block">
                我們家的小助手
             </span>
             <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 sm:hidden">
                小助手
             </span>
          </div>

          {/* Desktop Nav + Login */}
          <div className="flex items-center gap-4">
            {/* 導航項目（桌面版） */}
            <div className="hidden md:flex items-center gap-3">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const isExternal = item.href.startsWith('http');

                if (isExternal) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap text-gray-400 hover:text-white hover:bg-white/5"
                    >
                      {item.name}
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                      isActive
                        ? "bg-[#6366f1] text-white shadow-lg shadow-indigo-500/20"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* 登入按鈕（桌面版） */}
            <div className="hidden md:block shrink-0">
              <Login />
            </div>
          </div>

          {/* Mobile Menu Button + Login */}
          <div className="flex items-center gap-3 md:hidden">
            {/* 登入按鈕（移動版） */}
            <div className="shrink-0">
              <Login />
            </div>

            {/* 漢堡選單按鈕 */}
            <button
              className="p-2 rounded-lg transition-colors text-slate-300 hover:text-white hover:bg-white/10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="選單"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
       </div>

       {/* Mobile Nav Dropdown */}
       <div
         className={clsx(
           "md:hidden border-b overflow-hidden transition-all duration-500 ease-in-out",
           "bg-[#0f111a] border-[#232942]",
           isMobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
         )}
       >
         <div className="flex flex-col p-4 space-y-1">
           {navItems.map((item) => {
             const isActive = pathname === item.href;
             const isExternal = item.href.startsWith('http');

             if (isExternal) {
               return (
                 <a
                   key={item.href}
                   href={item.href}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="px-4 py-3 rounded-lg text-base font-bold transition-all flex items-center justify-between group text-slate-300 hover:text-white hover:bg-white/5"
                   onClick={() => setIsMobileMenuOpen(false)}
                 >
                   {item.name}
                   <ExternalLink size={16} className="text-slate-500 group-hover:text-white transition-colors" />
                 </a>
               );
             }

             return (
               <Link
                 key={item.href}
                 href={item.href}
                 onClick={() => setIsMobileMenuOpen(false)}
                 className={clsx(
                   "px-4 py-3 rounded-lg text-base font-bold transition-all",
                   isActive
                     ? "bg-[#6366f1]/10 text-[#818cf8] border border-[#6366f1]/20"
                     : "text-slate-300 hover:text-white hover:bg-white/5"
                 )}
               >
                 {item.name}
               </Link>
             );
           })}
         </div>
       </div>
    </nav>
  );
}