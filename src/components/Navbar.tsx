'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);

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
  ];

  return (
    <nav 
      id="navbar" // 👈 重要：一定要有這個 ID
      className={clsx(
        "fixed top-0 left-0 w-full z-[40] h-[70px] bg-[#0f111a]/95 backdrop-blur-md border-b border-[#232942] transition-transform duration-500 ease-in-out",
        !isVisible && "-translate-y-full" // 控制顯示/隱藏
      )}
    >
       <div className="container h-full flex items-center justify-between !max-w-7xl !py-0 px-4">
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

          <div className="flex items-center gap-2 sm:gap-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
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
       </div>
    </nav>
  );
}