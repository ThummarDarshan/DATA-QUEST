import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, UserIcon, MailIcon, KeyIcon, BellIcon, GlobeIcon, ShieldIcon } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { Header } from '../components/Header';
import { uploadApi, getImageUrl } from '../services/api';

export const Profile: React.FC = () => {
  const {
    user,
    updateUser
  } = useAuth();
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const [isPersonalOpen, setIsPersonalOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const [tempName, setTempName] = useState(user?.name || '');
  const [tempEmail, setTempEmail] = useState(user?.email || '');
  const [tempAvatar, setTempAvatar] = useState(user?.avatar || '');
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

  type Settings = {
    notifications: {
      email: boolean;
      push: boolean;
      marketing: boolean;
    };
    language: string;
    region: string;
    privacy: {
      showProfilePhoto: boolean;
      shareUsageAnalytics: boolean;
    };
  };
  const defaultSettings: Settings = useMemo(() => ({
    notifications: { email: true, push: false, marketing: false },
    language: 'en',
    region: 'US',
    privacy: { showProfilePhoto: true, shareUsageAnalytics: false }
  }), []);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [successMessage, setSuccessMessage] = useState('');
  const [tempNick, setTempNick] = useState('');
  const [tempGender, setTempGender] = useState('');
  const [tempCountry, setTempCountry] = useState('');
  const [tempTimeZone, setTempTimeZone] = useState('');
  useEffect(() => {
    const stored = localStorage.getItem('gemini_settings');
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch {}
    }
  }, [defaultSettings]);
  useEffect(() => {
    const meta = localStorage.getItem('gemini_profile_meta');
    if (meta) {
      try {
        const parsed = JSON.parse(meta);
        setTempNick(parsed.nick || '');
        setTempGender(parsed.gender || '');
        setTempCountry(parsed.country || '');
        setTempTimeZone(parsed.timezone || '');
      } catch {}
    }
  }, []);
  useEffect(() => {
    setTempName(user?.name || '');
    setTempEmail(user?.email || '');
    setTempAvatar(user?.avatar || '');
  }, [user]);
  const saveSettings = (next: Settings) => {
    setSettings(next);
    localStorage.setItem('gemini_settings', JSON.stringify(next));
  };
  const handleAvatarFile = async (file: File) => {
    try {
      const result = await uploadApi.uploadAvatar(file);
      
      if (result.success) {
        setTempAvatar(result.data.url);
      } else {
        console.error('Failed to upload avatar:', result.message);
        alert('Failed to upload avatar: ' + result.message);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar');
    }
  };
  const isDirty = useMemo(() => {
    return tempName !== (user?.name || '') || tempEmail !== (user?.email || '') || tempAvatar !== (user?.avatar || '') || tempNick !== '' || tempGender !== '' || tempCountry !== '' || tempTimeZone !== '';
  }, [tempName, tempEmail, tempAvatar, tempNick, tempGender, tempCountry, tempTimeZone, user]);
  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    window.setTimeout(() => setSuccessMessage(''), 2000);
  };
  return <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Back to chat
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow rounded-lg overflow-hidden">
            {successMessage && (
              <div className="px-4 py-3 bg-green-50 text-green-800 text-sm border-b border-green-200">
                {successMessage}
              </div>
            )}
            <div className="px-4 py-6 sm:px-6 border-b bg-gradient-to-r from-blue-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 dark:text-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">Profile</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">Manage your personal details and account settings</p>
                </div>
                <button onClick={() => setIsPersonalOpen(true)} className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700">Edit</button>
              </div>
            </div>
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-5 sm:px-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <img src={getImageUrl(user?.avatar)} alt={user?.name || 'User'} className="h-24 w-24 rounded-full border-4 border-white shadow" />
                </div>
                <div className="ml-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {user?.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                  <button onClick={() => setIsPhotoOpen(true)} className="mt-2 inline-flex items-center px-3 py-1.5 border border-blue-600 text-blue-600 text-sm font-medium rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Change photo
                  </button>
                </div>
              </div>
            </div>
            <div className="px-4 py-6 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Full Name</label>
                  <input className="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" placeholder="Your First Name" value={tempName} onChange={e => setTempName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Nick Name</label>
                  <input className="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" placeholder="Your First Name" value={tempNick} onChange={e => setTempNick(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Gender</label>
                  <select className="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" value={tempGender} onChange={e => setTempGender(e.target.value)}>
                    <option value="">Select</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Country</label>
                  <input className="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" placeholder="Your Country" value={tempCountry} onChange={e => setTempCountry(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Language</label>
                  <select className="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" value={settings.language} onChange={e => saveSettings({ ...settings, language: e.target.value })}>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Time Zone</label>
                  <input className="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" placeholder="Your Time Zone" value={tempTimeZone} onChange={e => setTempTimeZone(e.target.value)} />
                </div>
              </div>
              <div className="mt-8">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3">My email Address</h4>
                <div className="flex items-start p-4 rounded-md border border-gray-200 dark:border-gray-700">
                  <div className="mt-1 mr-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                      <MailIcon className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{user?.email}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Primary</div>
                  </div>
                </div>
                <button onClick={() => setIsEmailOpen(true)} className="mt-3 inline-flex items-center px-4 py-2 rounded-md border text-sm text-blue-600 hover:bg-gray-50 dark:border-gray-700 dark:text-blue-400 dark:hover:bg-gray-700/40">+Add Email Address</button>
              </div>
            </div>
            <div className="px-4 py-4 sm:px-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-end">
                <button aria-disabled={!isDirty} disabled={!isDirty} onClick={() => {
                  if (user) {
                    updateUser({ name: tempName, email: tempEmail, avatar: tempAvatar });
                    localStorage.setItem('gemini_profile_meta', JSON.stringify({ nick: tempNick, gender: tempGender, country: tempCountry, timezone: tempTimeZone }));
                    showSuccess('Profile saved');
                  }
                }} className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDirty ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-blue-300 cursor-not-allowed'}`}>
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      {isPhotoOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4" onClick={() => setIsPhotoOpen(false)} onKeyDown={e => { if (e.key === 'Escape') setIsPhotoOpen(false); }}>
          <div role="dialog" aria-modal className="bg-white dark:bg-gray-800 dark:text-gray-100 rounded-lg shadow-lg w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Change profile photo</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <img src={getImageUrl(tempAvatar || user?.avatar)} alt="preview" className="h-16 w-16 rounded-full border" />
                <label className="inline-flex items-center px-3 py-2 border rounded-md cursor-pointer text-sm text-gray-700 dark:text-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleAvatarFile(f);
                  }} />
                </label>
              </div>
              <div className="flex justify-end space-x-2">
                <button onClick={() => setIsPhotoOpen(false)} className="px-4 py-2 rounded-md border dark:border-gray-700 dark:text-gray-100">Cancel</button>
                <button onClick={() => { updateUser({ avatar: tempAvatar }); setIsPhotoOpen(false); showSuccess('Photo updated'); }} className="px-4 py-2 rounded-md text-white bg-blue-600">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isPersonalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4" onClick={() => setIsPersonalOpen(false)} onKeyDown={e => { if (e.key === 'Escape') setIsPersonalOpen(false); }}>
          <div role="dialog" aria-modal className="bg-white dark:bg-gray-800 dark:text-gray-100 rounded-lg shadow-lg w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Edit personal information</h3>
            <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Name</label>
            <input className="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" value={tempName} onChange={e => setTempName(e.target.value)} />
            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={() => setIsPersonalOpen(false)} className="px-4 py-2 rounded-md border dark:border-gray-700">Cancel</button>
              <button onClick={() => { updateUser({ name: tempName }); setIsPersonalOpen(false); showSuccess('Name updated'); }} className="px-4 py-2 rounded-md text-white bg-blue-600">Save</button>
            </div>
          </div>
        </div>
      )}
      {isEmailOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4" onClick={() => setIsEmailOpen(false)} onKeyDown={e => { if (e.key === 'Escape') setIsEmailOpen(false); }}>
          <div role="dialog" aria-modal className="bg-white dark:bg-gray-800 dark:text-gray-100 rounded-lg shadow-lg w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Change email</h3>
            <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Email</label>
            <input type="email" className="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" value={tempEmail} onChange={e => setTempEmail(e.target.value)} />
            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={() => setIsEmailOpen(false)} className="px-4 py-2 rounded-md border dark:border-gray-700">Cancel</button>
              <button onClick={() => { updateUser({ email: tempEmail }); setIsEmailOpen(false); showSuccess('Email updated'); }} className="px-4 py-2 rounded-md text-white bg-blue-600">Save</button>
            </div>
          </div>
        </div>
      )}
      {isPasswordOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4" onClick={() => setIsPasswordOpen(false)} onKeyDown={e => { if (e.key === 'Escape') setIsPasswordOpen(false); }}>
          <div role="dialog" aria-modal className="bg-white dark:bg-gray-800 dark:text-gray-100 rounded-lg shadow-lg w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Update password</h3>
            <div className="space-y-3">
              <input type="password" placeholder="Current password" className="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} />
              <input type="password" placeholder="New password" className="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" value={passwords.next} onChange={e => setPasswords({ ...passwords, next: e.target.value })} />
              <input type="password" placeholder="Confirm new password" className="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} />
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={() => setIsPasswordOpen(false)} className="px-4 py-2 rounded-md border dark:border-gray-700">Cancel</button>
              <button onClick={() => { if (passwords.next && passwords.next === passwords.confirm) { alert('Password updated locally (mock).'); setIsPasswordOpen(false); setPasswords({ current: '', next: '', confirm: '' }); showSuccess('Password updated'); } }} className="px-4 py-2 rounded-md text-white bg-blue-600">Save</button>
            </div>
          </div>
        </div>
      )}
      {isNotificationsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4" onClick={() => setIsNotificationsOpen(false)} onKeyDown={e => { if (e.key === 'Escape') setIsNotificationsOpen(false); }}>
          <div role="dialog" aria-modal className="bg-white rounded-lg shadow-lg w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification preferences</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-2"><input type="checkbox" checked={settings.notifications.email} onChange={e => saveSettings({ ...settings, notifications: { ...settings.notifications, email: e.target.checked } })} /><span>Email notifications</span></label>
              <label className="flex items-center space-x-2"><input type="checkbox" checked={settings.notifications.push} onChange={e => saveSettings({ ...settings, notifications: { ...settings.notifications, push: e.target.checked } })} /><span>Push notifications</span></label>
              <label className="flex items-center space-x-2"><input type="checkbox" checked={settings.notifications.marketing} onChange={e => saveSettings({ ...settings, notifications: { ...settings.notifications, marketing: e.target.checked } })} /><span>Marketing emails</span></label>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => { setIsNotificationsOpen(false); showSuccess('Notification settings saved'); }} className="px-4 py-2 rounded-md text-white bg-blue-600">Done</button>
            </div>
          </div>
        </div>
      )}
      {isLanguageOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4" onClick={() => setIsLanguageOpen(false)} onKeyDown={e => { if (e.key === 'Escape') setIsLanguageOpen(false); }}>
          <div role="dialog" aria-modal className="bg-white dark:bg-gray-800 dark:text-gray-100 rounded-lg shadow-lg w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Language & Region</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Language</label>
                <select className="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" value={settings.language} onChange={e => saveSettings({ ...settings, language: e.target.value })}>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Region</label>
                <select className="w-full border rounded-md px-3 py-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" value={settings.region} onChange={e => saveSettings({ ...settings, region: e.target.value })}>
                  <option value="US">United States</option>
                  <option value="EU">Europe</option>
                  <option value="IN">India</option>
                  <option value="JP">Japan</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => { setIsLanguageOpen(false); showSuccess('Language & region saved'); }} className="px-4 py-2 rounded-md text-white bg-blue-600">Done</button>
            </div>
          </div>
        </div>
      )}
      {isPrivacyOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4" onClick={() => setIsPrivacyOpen(false)} onKeyDown={e => { if (e.key === 'Escape') setIsPrivacyOpen(false); }}>
          <div role="dialog" aria-modal className="bg-white dark:bg-gray-800 dark:text-gray-100 rounded-lg shadow-lg w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Privacy & Data</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-2"><input type="checkbox" checked={settings.privacy.showProfilePhoto} onChange={e => saveSettings({ ...settings, privacy: { ...settings.privacy, showProfilePhoto: e.target.checked } })} /><span>Show profile photo to others</span></label>
              <label className="flex items-center space-x-2"><input type="checkbox" checked={settings.privacy.shareUsageAnalytics} onChange={e => saveSettings({ ...settings, privacy: { ...settings.privacy, shareUsageAnalytics: e.target.checked } })} /><span>Share anonymous usage analytics</span></label>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => { setIsPrivacyOpen(false); showSuccess('Privacy settings saved'); }} className="px-4 py-2 rounded-md text-white bg-blue-600">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>;
};