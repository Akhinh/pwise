'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { auth } from '@prepwise/api-client';
import { useAuthStore } from '@/store/auth.store';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TierBadge, Button } from '@/components/ui';
import { OfflineManager } from '@/components/OfflineDownload';

export default function ProfilePage() {
  const router = useRouter();
  const { user, setAuth, clearAuth } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [saving, setSaving] = useState(false);

  const initials = user?.displayName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'PW';
  const isFreeTier = !user?.subscriptionTier || user.subscriptionTier === 'FREE';

  async function handleSave() {
    if (!displayName.trim() || displayName === user?.displayName) return;
    setSaving(true);
    try {
      const res = await auth.updateProfile({ displayName });
      if (!res.success) { toast.error('Failed to update profile'); return; }
      if (user) {
        const updatedUser = { ...user, displayName };
        const stored = JSON.parse(localStorage.getItem('prepwise-auth') ?? '{}');
        stored.state = { ...stored.state, user: updatedUser };
        localStorage.setItem('prepwise-auth', JSON.stringify(stored));
      }
      toast.success('Profile updated!');
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    clearAuth();
    router.push('/');
    toast.success('Signed out successfully');
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })
    : '';

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-black text-[#0D2137] mb-8" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
          My Profile
        </h1>

        {/* Avatar & identity */}
        <div className="bg-[#0D2137] rounded-[20px] p-6 mb-5 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-[#F59E0B] flex items-center justify-center text-xl font-black text-[#0D2137] flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-white font-black text-lg" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>{user?.displayName}</p>
            <p className="text-white/50 text-sm mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <TierBadge tier={user?.subscriptionTier ?? 'FREE'} />
              {memberSince && <span className="text-white/30 text-xs">Member since {memberSince}</span>}
            </div>
          </div>
        </div>

        {/* Edit profile */}
        <div className="bg-white border border-gray-200 rounded-[14px] p-5 mb-4">
          <h2 className="text-xs font-bold text-[#0D2137] uppercase tracking-wide mb-4">Edit Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-[#1E293B] outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Email Address</label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-gray-100 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-300 mt-1">Email cannot be changed</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || displayName === user?.displayName}
              className="bg-[#0D2137] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#1A3A5C] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Subscription */}
        <div className="bg-white border border-gray-200 rounded-[14px] p-5 mb-4">
          <h2 className="text-xs font-bold text-[#0D2137] uppercase tracking-wide mb-4">Subscription</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#0D2137]">
                {user?.subscriptionTier === 'FREE' ? 'Free Plan' : `${user?.subscriptionTier} Plan`}
              </p>
              {user?.subscriptionExpiresAt ? (
                <p className="text-xs text-gray-400 mt-0.5">
                  Renews {new Date(user.subscriptionExpiresAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-0.5">Free plan — upgrade to unlock more features</p>
              )}
            </div>
            <button
              onClick={() => router.push('/pricing')}
              className="bg-[#F59E0B] text-[#0D2137] px-4 py-2 rounded-xl text-xs font-black hover:bg-[#FCD34D] transition-colors"
            >
              {user?.subscriptionTier === 'FREE' ? 'Upgrade' : 'Manage'}
            </button>
          </div>
        </div>

        {/* Offline Storage — Student+ only */}
        {!isFreeTier && (
          <div className="bg-white border border-gray-200 rounded-[14px] p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-bold text-[#0D2137] uppercase tracking-wide">
                  Offline Storage
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Subjects saved to your device for offline practice
                </p>
              </div>
              <span className="text-lg">📥</span>
            </div>
            <OfflineManager />
          </div>
        )}

        {/* Stats summary */}
        <div className="bg-white border border-gray-200 rounded-[14px] p-5 mb-4">
          <h2 className="text-xs font-bold text-[#0D2137] uppercase tracking-wide mb-4">Account Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Day Streak',     value: `${user?.streakCount ?? 0} 🔥` },
              { label: 'Member since',   value: memberSince || '—' },
              { label: 'Account status', value: 'Active ✓' },
              { label: 'Admin access',   value: user?.isAdmin ? 'Yes' : 'No' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className="text-sm font-bold text-[#0D2137] mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-red-50 border border-red-200 rounded-[14px] p-5">
          <h2 className="text-xs font-bold text-red-600 uppercase tracking-wide mb-3">Sign Out</h2>
          <p className="text-sm text-red-500 mb-4">You will be signed out of all devices.</p>
          <button
            onClick={handleSignOut}
            className="bg-white border border-red-200 text-red-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
