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

  // 🖱️ 滞動偵測，加上 rAF 節流
  // 為何用 rAF：原始 scroll handler 每次滞動就觸發一次 setState
  // 在手機快速滞動時可能 1秒 100+ 次，導致不必要的 re-render
  // rAF 的語意：下一幀畫面繪製前再執行，自動和 60fps 對齊
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const controlNavbar = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // 往下滑超過 100px 就隱藏，往上滑就顯示
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setIsVisible(false);
          } else {
            setIsVisible(true);
          }
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', controlNavbar, { passive: true });
    return () => window.removeEventListener('scroll', controlNavbar);
  }, []);

  const navItems = [
    { name: '總覽', href: '/' },
    { name: '食譜神器', href: '/recipes' },
    { name: '家庭帳本', href: '/expenses' },
    { name: '冥夜小助手', href: 'https://brianlien09.github.io/schedule_app/' },
    { name: '冥夜音樂 🎵', href: 'https://brianlien09.github.io/Music_app/' },
  ];

  return (
    <nav
      id="navbar" // 👈 重要：一定要有這個 ID
      className={clsx(
        "fixed top-0 left-0 w-full z-[40] backdrop-blur-md border-b transition-all duration-500 ease-in-out",
        "bg-[#e6e2d8]/90 backdrop-blur-md border-dashed border-[#dcd0c2]",
        !isVisible && "-translate-y-full" // 控制顯示/隱藏
      )}
    >
       <div className="container flex items-center justify-between !max-w-7xl px-4 h-[70px]">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-[#b87e6b] flex items-center justify-center overflow-hidden shrink-0">
                <span className="text-[#f0ece1] text-xs font-bold">B</span>
             </div>
             <span className="text-lg font-bold text-[#3d3a36] hidden sm:block">
                我們家的小助手
             </span>
             <span className="text-lg font-bold text-[#3d3a36] sm:hidden">
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
                      className="px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap text-[#3d3a36] hover:text-[#b87e6b] hover:bg-[#dcd0c2]/30"
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
                        ? "bg-[#b87e6b] text-[#f0ece1] shadow-[0_4px_12px_rgba(184,126,107,0.2)]"
                        : "text-[#3d3a36] hover:text-[#b87e6b] hover:bg-[#dcd0c2]/30"
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
              className="p-2 rounded-lg transition-all duration-200 text-[#3d3a36] hover:text-[#b87e6b] hover:bg-[#dcd0c2]/50"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="選單"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
       </div>

       {/* Mobile Nav Dropdown
            #7 原本用 max-height: 0 → 500px 做展開動畫，但瀏覽器不知道實際高度，
            easing 曲線無法精確計算，展開時有明顯頓感。
            改用 grid-template-rows: 0fr → 1fr：兩端均已知，
            動畫曲線完美。內層 div 需要 overflow-hidden 防止 0fr 時內容溢出。
       */}
       <div
         className={clsx(
           "md:hidden border-b grid transition-[grid-template-rows] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",
           "bg-[#e6e2d8] border-dashed border-[#dcd0c2]",
           isMobileMenuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
         )}
       >
         {/* overflow-hidden 是讓 0fr 時確實起作用的關鍵 */}
         <div className="overflow-hidden">
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
                     className="px-4 py-3 rounded-lg text-base font-bold transition-all flex items-center justify-between group text-[#3d3a36] hover:text-[#b87e6b] hover:bg-[#dcd0c2]/30"
                     onClick={() => setIsMobileMenuOpen(false)}
                   >
                     {item.name}
                     <ExternalLink size={16} className="text-[#3d3a36] group-hover:text-[#b87e6b] transition-all duration-200" />
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
                       ? "bg-[#b87e6b]/10 text-[#b87e6b] border-2 border-dashed border-[#b87e6b]/30"
                       : "text-[#3d3a36] hover:text-[#b87e6b] hover:bg-[#dcd0c2]/30"
                   )}
                 >
                   {item.name}
                 </Link>
               );
             })}
           </div>
         </div>
       </div>
    </nav>
  );
}