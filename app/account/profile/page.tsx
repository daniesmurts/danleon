'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';

export default function ProfilePage() {
  const { user } = useAuth();

  // Profile fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setFirstName(d.firstName ?? '');
        setLastName(d.lastName ?? '');
        setPhone(d.phone ?? '');
      } else {
        // Fall back to Firebase Auth displayName
        const parts = user.displayName?.split(' ') ?? [];
        setFirstName(parts[0] ?? '');
        setLastName(parts.slice(1).join(' '));
      }
      setLoading(false);
    });
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess(false);
    try {
      await updateProfile(auth.currentUser!, { displayName: `${firstName} ${lastName}` });
      await updateDoc(doc(db, 'users', user.uid), {
        firstName,
        lastName,
        phone,
        updatedAt: serverTimestamp(),
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch {
      setProfileError('Не удалось сохранить изменения');
    }
    setProfileSaving(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auth.currentUser) return;
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('Пароли не совпадают');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setPasswordSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setPasswordError('Неверный текущий пароль');
      } else {
        setPasswordError('Не удалось изменить пароль');
      }
    }
    setPasswordSaving(false);
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-5 h-5 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-black tracking-widest text-espresso uppercase">Профиль</h1>

      {/* Personal info */}
      <form onSubmit={handleProfileSave} className="bg-white border border-cream/40 p-6 space-y-5">
        <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-espresso">Личные данные</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-heading text-[10px] uppercase tracking-widest text-espresso/50 mb-1.5">Имя</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border border-espresso/20 px-4 py-2.5 font-body text-sm text-espresso focus:outline-none focus:border-espresso"
              required
            />
          </div>
          <div>
            <label className="block font-heading text-[10px] uppercase tracking-widest text-espresso/50 mb-1.5">Фамилия</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border border-espresso/20 px-4 py-2.5 font-body text-sm text-espresso focus:outline-none focus:border-espresso"
              required
            />
          </div>
        </div>

        <div>
          <label className="block font-heading text-[10px] uppercase tracking-widest text-espresso/50 mb-1.5">Email</label>
          <input
            value={user?.email ?? ''}
            disabled
            className="w-full border border-espresso/10 px-4 py-2.5 font-body text-sm text-espresso/40 bg-[#F9F9F9] cursor-not-allowed"
          />
          <p className="mt-1 font-body text-[11px] text-espresso/30">Email изменить нельзя</p>
        </div>

        <div>
          <label className="block font-heading text-[10px] uppercase tracking-widest text-espresso/50 mb-1.5">Телефон</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (___) ___-__-__"
            className="w-full border border-espresso/20 px-4 py-2.5 font-body text-sm text-espresso focus:outline-none focus:border-espresso"
          />
        </div>

        {profileError && <p className="font-body text-xs text-red-600">{profileError}</p>}
        {profileSuccess && <p className="font-body text-xs text-green-700">Изменения сохранены</p>}

        <button
          type="submit"
          disabled={profileSaving}
          className="bg-espresso hover:bg-espresso/90 disabled:opacity-50 text-cream font-heading font-bold uppercase tracking-widest text-xs px-8 py-3 transition-colors"
        >
          {profileSaving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>

      {/* Change password */}
      <form onSubmit={handlePasswordChange} className="bg-white border border-cream/40 p-6 space-y-5">
        <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-espresso">Изменить пароль</h2>

        <div>
          <label className="block font-heading text-[10px] uppercase tracking-widest text-espresso/50 mb-1.5">Текущий пароль</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full border border-espresso/20 px-4 py-2.5 font-body text-sm text-espresso focus:outline-none focus:border-espresso"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-heading text-[10px] uppercase tracking-widest text-espresso/50 mb-1.5">Новый пароль</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-espresso/20 px-4 py-2.5 font-body text-sm text-espresso focus:outline-none focus:border-espresso"
            />
          </div>
          <div>
            <label className="block font-heading text-[10px] uppercase tracking-widest text-espresso/50 mb-1.5">Повторите пароль</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full border border-espresso/20 px-4 py-2.5 font-body text-sm text-espresso focus:outline-none focus:border-espresso"
            />
          </div>
        </div>

        {passwordError && <p className="font-body text-xs text-red-600">{passwordError}</p>}
        {passwordSuccess && <p className="font-body text-xs text-green-700">Пароль успешно изменён</p>}

        <button
          type="submit"
          disabled={passwordSaving}
          className="bg-crimson hover:bg-crimson-dark disabled:opacity-50 text-white font-heading font-bold uppercase tracking-widest text-xs px-8 py-3 transition-colors"
        >
          {passwordSaving ? 'Сохранение...' : 'Изменить пароль'}
        </button>
      </form>
    </div>
  );
}
