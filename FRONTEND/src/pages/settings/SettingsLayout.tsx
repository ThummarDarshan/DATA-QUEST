import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/Header';
import { BellIcon, ShieldIcon, ChevronLeftIcon } from 'lucide-react';
import { General } from './sections';

export const SettingsLayout: React.FC = () => {
  return <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1 p-6">
        <div className="bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="px-5 py-4 border-b flex items-center justify-between dark:border-gray-700">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h1>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center space-x-2 text-gray-500">
                <BellIcon className="h-4 w-4" />
                <ShieldIcon className="h-4 w-4" />
              </div>
              <Link to="/" className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-gray-700 dark:hover:bg-gray-700">
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Back to chat
              </Link>
            </div>
          </div>
          <div className="p-5">
            <General />
            <div className="mt-8 pt-6 border-t dark:border-gray-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Change password</h2>
              <ChangePasswordForm />
            </div>
          </div>
        </div>
      </main>
    </div>;
};

const ChangePasswordForm: React.FC = () => {
  const [pwd, setPwd] = React.useState({ current: '', next: '', confirm: '' });
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!pwd.current || !pwd.next || !pwd.confirm) { setError('Please fill in all fields.'); return; }
    if (pwd.next.length < 6) { setError('New password must be at least 6 characters.'); return; }
    if (pwd.next !== pwd.confirm) { setError('New passwords do not match.'); return; }
    if (pwd.next === pwd.current) { setError('New password must be different from current.'); return; }
    setSuccess('Password updated successfully (mock).');
    setTimeout(() => { setSuccess(''); setPwd({ current: '', next: '', confirm: '' }); }, 900);
  };
  return <form className="max-w-md space-y-4" onSubmit={onSubmit}>
      {error && <div className="text-sm px-3 py-2 rounded-md bg-red-50 text-red-700 border border-red-200">{error}</div>}
      {success && <div className="text-sm px-3 py-2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">{success}</div>}
      <div>
        <label className="block text-xs uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">Current Password</label>
        <input type="password" value={pwd.current} onChange={e => setPwd({ ...pwd, current: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" placeholder="••••••••" />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">New Password</label>
        <input type="password" value={pwd.next} onChange={e => setPwd({ ...pwd, next: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" placeholder="New password" />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">Confirm New Password</label>
        <input type="password" value={pwd.confirm} onChange={e => setPwd({ ...pwd, confirm: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" placeholder="Confirm new password" />
      </div>
      <div className="pt-1">
        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition-all" style={{ backgroundImage: 'linear-gradient(135deg, rgba(59,130,246,1) 0%, rgba(99,102,241,1) 100%)' }}>Update password</button>
      </div>
    </form>;
};


