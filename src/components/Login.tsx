'use client';

import { useState, useEffect } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

export default function Login() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 監聽登入狀態改變
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
      alert('登入失敗');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {/* 顯示頭像或名字 */}
        <img 
          src={user.photoURL || ''} 
          alt="Avatar" 
          className="w-8 h-8 rounded-full border border-white/20"
        />
        <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-white">
          登出
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleLogin}
      className="px-3 py-1.5 bg-white/5 backdrop-blur-md border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 rounded-full font-medium text-sm transition-all"
      aria-label="Google 登入"
    >
      G 登入
    </button>
  );
}