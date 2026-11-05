'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import toast from 'react-hot-toast';

export default function Login() {
  const [user, setUser] = useState<User | null>(null);
  // 頭像載入失敗時退回顯示名字首字，避免整個頭像區塊空白
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    // 監聽登入狀態改變
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setPhotoFailed(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
      toast.error('登入失敗，請再試一次');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {/* 顯示頭像或名字 */}
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[#dcd0c2]/50 bg-[#e6e2d8] text-xs font-bold text-[#3d3a36]"
        >
          {user.photoURL && !photoFailed ? (
            // 為何不帶 Referer：Google 頭像網址在帶來源網址時常被限流（403/429）導致不顯示
            <Image
              src={user.photoURL}
              alt="使用者頭像"
              width={32}
              height={32}
              unoptimized
              referrerPolicy="no-referrer"
              onError={() => setPhotoFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span role="img" aria-label="使用者頭像">{user.displayName?.slice(0, 1) ?? 'B'}</span>
          )}
        </span>
        <button onClick={handleLogout} className="min-h-10 px-2 text-sm text-[#3d3a36] transition-colors hover:text-[#b87e6b]">
          登出
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleLogin}
      className="min-h-10 px-4 py-1.5 bg-[#dcd0c2]/30 border-2 border-dashed border-[#dcd0c2]/50 text-[#3d3a36] hover:text-[#b87e6b] hover:bg-[#dcd0c2]/50 rounded-full font-medium text-sm transition-colors duration-200"
      aria-label="Google 登入"
    >
      G 登入
    </button>
  );
}
