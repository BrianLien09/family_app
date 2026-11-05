'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Menu, X, ExternalLink } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import Login from '@/components/Login';
import IconButton from '@/components/ui/IconButton';
import { DURATION, EASE_IN, EASE_OUT, SPRING_SOFT } from '@/lib/motion';
import siteIcon from '../../public/icon-192x192.png';
import { Caveat } from 'next/font/google';

// 品牌名稱改用手寫草寫體，呼應織物手作質感；僅載入 700 字重以減少字型體積
const brandFont = Caveat({ subsets: ['latin'], weight: ['700'] });

const NAV_ITEMS = [
  { name: '總覽', href: '/' },
  { name: '食譜神器', href: '/recipes' },
  { name: '家庭帳本', href: '/expenses' },
  { name: '家庭購買紀錄', href: '/purchases' },
  { name: '冥夜小助手', href: 'https://brianlien09.github.io/schedule_app/' },
];

const MOBILE_MENU_ID = 'mobile-nav-menu';

export default function Navbar() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // 路由改變時收起選單；用「記錄上一個路徑」在 render 階段調整，避免 effect 內同步 setState
  const [menuPathname, setMenuPathname] = useState(pathname);
  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    setIsMobileMenuOpen(false);
  }

  // 滾動偵測，加上 rAF 節流
  // 為何用 rAF：手機快速滾動時 scroll 事件可能 1 秒上百次，逐次 setState 會造成不必要的 re-render；
  // rAF 與螢幕更新對齊，每幀最多處理一次
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const controlNavbar = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        // 往下滑超過 100px 就隱藏，往上滑就顯示
        setIsVisible(!(currentScrollY > lastScrollY && currentScrollY > 100));
        lastScrollY = currentScrollY;
        ticking = false;
      });
    };

    window.addEventListener('scroll', controlNavbar, { passive: true });
    return () => window.removeEventListener('scroll', controlNavbar);
  }, []);

  // 選單開啟時按 Esc 關閉，鍵盤使用者才不會被困住
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isMobileMenuOpen]);

  return (
    <m.nav
      id="navbar" // 沉浸模式（Modal 開啟）會用這個 ID 隱藏導覽列
      // 隱藏時只做 transform 位移；選單展開中不收起，避免使用者正在操作時選單消失
      animate={{ y: isVisible || isMobileMenuOpen ? 0 : '-100%' }}
      transition={{ duration: DURATION.slow, ease: EASE_OUT }}
      className="fixed top-0 left-0 z-[40] w-full border-b border-dashed border-[#dcd0c2] bg-[#e6e2d8]/95 backdrop-blur-md"
    >
      <div className="mx-auto flex h-[70px] w-full max-w-[80rem] items-center justify-between px-4 sm:px-8 lg:px-12">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-3">
          {/* 使用與 PWA／favicon 相同的網站圖標，維持品牌一致 */}
          <Image
            src={siteIcon}
            alt="Famly Hub 圖標"
            width={36}
            height={36}
            priority
            className="h-9 w-9 shrink-0 rounded-xl"
          />
          <span className={clsx(brandFont.className, 'text-3xl font-bold leading-none text-[#3d3a36]')}>
            Famly Hub
          </span>
        </Link>

        {/* Desktop Nav + Login */}
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const isExternal = item.href.startsWith('http');

              if (isExternal) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold text-[#3d3a36] transition-colors duration-200 hover:bg-[#dcd0c2]/30 hover:text-[#b87e6b]"
                  >
                    {item.name}
                    <ExternalLink size={16} className="shrink-0" aria-hidden="true" />
                  </a>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'relative whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition-colors duration-200',
                    isActive ? 'text-[#f0ece1]' : 'text-[#3d3a36] hover:bg-[#dcd0c2]/30 hover:text-[#b87e6b]',
                  )}
                >
                  {/* 共用 layoutId：切換頁面時底板會滑到新的項目，而不是各自閃現 */}
                  {isActive && (
                    <m.span
                      layoutId="nav-active-pill"
                      transition={SPRING_SOFT}
                      className="absolute inset-0 rounded-lg bg-[#b87e6b] shadow-[0_4px_12px_rgba(184,126,107,0.2)]"
                    />
                  )}
                  <span className="relative">{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="hidden shrink-0 md:block">
            <Login />
          </div>
        </div>

        {/* Mobile Menu Button + Login */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="shrink-0">
            <Login />
          </div>
          <IconButton
            aria-label={isMobileMenuOpen ? '關閉選單' : '開啟選單'}
            aria-expanded={isMobileMenuOpen}
            aria-controls={MOBILE_MENU_ID}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </IconButton>
        </div>
      </div>

      {/* Mobile Nav Dropdown
          用 motion 的 height: auto 動畫取代 max-height／grid-rows hack：
          兩者都需要預先知道高度或額外包裝層，motion 會直接量測實際高度 */}
      <AnimatePresence initial={false}>
        {isMobileMenuOpen && (
          <m.div
            id={MOBILE_MENU_ID}
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: { duration: DURATION.slow, ease: EASE_OUT } }}
            exit={{ height: 0, opacity: 0, transition: { duration: DURATION.base, ease: EASE_IN } }}
            className="overflow-hidden border-t border-dashed border-[#dcd0c2] bg-[#e6e2d8] md:hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const isExternal = item.href.startsWith('http');

                if (isExternal) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-11 items-center gap-1.5 rounded-lg px-4 py-3 text-base font-bold text-[#3d3a36] transition-colors duration-200 hover:bg-[#dcd0c2]/30 hover:text-[#b87e6b]"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.name}
                      <ExternalLink size={16} className="shrink-0" aria-hidden="true" />
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={clsx(
                      'flex min-h-11 items-center rounded-lg px-4 py-3 text-base font-bold transition-colors duration-200',
                      isActive
                        ? 'border-2 border-dashed border-[#b87e6b]/30 bg-[#b87e6b]/10 text-[#b87e6b]'
                        : 'text-[#3d3a36] hover:bg-[#dcd0c2]/30 hover:text-[#b87e6b]',
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.nav>
  );
}
