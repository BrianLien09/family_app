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
          className="w-8 h-8 rounded-full border-2 border-dashed border-dashed border-[#dcd0c2]/50"
        />
        <button onClick={handleLogout} className="text-sm text-[#3d3a36] hover:text-[#b87e6b]">
          登出
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleLogin}
      className="px-3 py-1.5 bg-[#dcd0c2]/30 backdrop-blur-md border-2 border-dashed border-dashed border-[#dcd0c2]/50 text-[#3d3a36] hover:text-[#b87e6b] hover:bg-[#dcd0c2]/50 rounded-full font-medium text-sm transition-all"
      aria-label="Google 登入"
    >
      G 登入
    </button>
  );
}