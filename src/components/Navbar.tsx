'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

// Simplified hook internal for now to avoid creating new file if possible, 
// strictly we should separate, but let's inline simple logic or better, create hook.
// Let's create the hook logic inline inside component for simplicity or create a new hook file if cleaner.
// Actually, creating a hook file is better practice. Let's assume I'll create the hook next.

export default function Navbar() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') { 
        if (window.scrollY > lastScrollY && window.scrollY > 100) { // scrolling down
          setIsVisible(false);
        } else { // scrolling up
          setIsVisible(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    window.addEventListener('scroll', controlNavbar);
    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
  }, [lastScrollY]);

  const navItems = [
    { name: '總覽', href: '/' },
    { name: '食譜神器', href: '/recipes' },
  ];

  return (
    <nav className={clsx(
      "fixed top-0 left-0 w-full z-50 h-[70px] bg-[#0f111a]/95 backdrop-blur-md border-b border-[#232942] transition-transform duration-300",
      !isVisible && "-translate-y-full"
    )}>
       <div className="container h-full flex items-center justify-between !max-w-7xl !py-0 px-4">
          
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

          {/* Links Section */}
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
