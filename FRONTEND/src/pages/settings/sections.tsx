import React, { useEffect, useMemo, useState } from 'react';
import { LockIcon, XIcon, KeyIcon, ShieldCheck } from 'lucide-react';

type GeneralSettings = {
  theme: 'system' | 'light' | 'dark';
  accent: 'default' | 'blue' | 'green' | 'purple' | 'orange';
  language: 'auto' | 'en' | 'es' | 'fr' | 'de' | 'hi';
  spokenLanguage: 'auto' | 'en' | 'es' | 'fr' | 'de' | 'hi';
  voice: 'Maple' | 'River' | 'Quartz';
};

const defaultGeneralSettings: GeneralSettings = {
  theme: 'system',
  accent: 'default',
  language: 'auto',
  spokenLanguage: 'auto',
  voice: 'Maple'
};

export const General: React.FC = () => {
  const [settings, setSettings] = useState<GeneralSettings>(defaultGeneralSettings);
  const isDarkPreferred = useMemo(() => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches, []);

  useEffect(() => {
    const raw = localStorage.getItem('app_general_settings');
    if (raw) {
      try { setSettings({ ...defaultGeneralSettings, ...JSON.parse(raw) }); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('app_general_settings', JSON.stringify(settings));
    const html = document.documentElement;
    const isDark = settings.theme === 'dark' || (settings.theme === 'system' && isDarkPreferred);
    html.classList.toggle('dark', isDark);
    html.style.setProperty('--accent-color', accentToHex(settings.accent));
  }, [settings, isDarkPreferred]);

  const accentToHex = (a: GeneralSettings['accent']): string => {
    switch (a) {
      case 'blue': return '#3b82f6';
      case 'green': return '#10b981';
      case 'purple': return '#8b5cf6';
      case 'orange': return '#f59e0b';
      default: return '#2563eb';
    }
  };

  const playVoice = () => {
    const utter = new SpeechSynthesisUtterance('This is a sample of the selected voice.');
    const all = window.speechSynthesis.getVoices();
    const candidate = all.find(v => v.name.toLowerCase().includes(settings.voice.toLowerCase()));
    if (candidate) utter.voice = candidate;
    window.speechSynthesis.speak(utter);
  };

  return <div className="divide-y dark:divide-gray-700">
      <div className="pb-4">
        <h2 className="text-base font-semibold mb-1 dark:text-gray-100">General</h2>
      </div>
      <Section label="Theme">
        <Select value={settings.theme} onChange={v => setSettings(s => ({ ...s, theme: v as GeneralSettings['theme'] }))} options={[
        { value: 'system', label: 'System' },
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' }
      ]} />
      </Section>
      {/* Accent color selection removed per request */}
      <Section label="Language">
        <Select value={settings.language} onChange={v => setSettings(s => ({ ...s, language: v as GeneralSettings['language'] }))} options={[
        { value: 'auto', label: 'Auto-detect' },
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Español' },
        { value: 'fr', label: 'Français' },
        { value: 'de', label: 'Deutsch' },
        { value: 'hi', label: 'हिन्दी' }
      ]} />
      </Section>
      <Section label="Spoken language" helper="For best results, select the language you mainly speak. If it's not listed, it may still be supported via auto-detection.">
        <Select value={settings.spokenLanguage} onChange={v => setSettings(s => ({ ...s, spokenLanguage: v as GeneralSettings['spokenLanguage'] }))} options={[
        { value: 'auto', label: 'Auto-detect' },
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Español' },
        { value: 'fr', label: 'Français' },
        { value: 'de', label: 'Deutsch' },
        { value: 'hi', label: 'हिन्दी' }
      ]} />
      </Section>
      <Section label="Voice">
        <div className="flex items-center gap-3">
          <button onClick={playVoice} className="inline-flex items-center px-3 py-1.5 rounded-md border text-sm">Play</button>
          <Select value={settings.voice} onChange={v => setSettings(s => ({ ...s, voice: v as GeneralSettings['voice'] }))} options={[
          { value: 'Maple', label: 'Maple' },
          { value: 'River', label: 'River' },
          { value: 'Quartz', label: 'Quartz' }
        ]} />
        </div>
      </Section>
    </div>;
};

const Section: React.FC<{ label: string; helper?: string; children: React.ReactNode }> = ({ label, helper, children }) => {
  return <div className="py-5">
      <div className="mb-2 text-sm text-gray-900 dark:text-gray-200">{label}</div>
      {children}
      {helper && <p className="mt-2 text-xs text-gray-500 max-w-2xl">{helper}</p>}
    </div>;
};

const Select: React.FC<{ value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }> = ({ value, onChange, options }) => {
  return <div className="relative inline-block">
      <select value={value} onChange={e => onChange(e.target.value)} className="appearance-none pr-8 border rounded-md px-3 py-2 text-sm bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">▾</span>
    </div>;
};

export const NotificationsPage: React.FC = () => {
  type Notif = {
    email: boolean;
    push: boolean;
    desktop: boolean;
    sound: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  const defaults: Notif = { email: true, push: false, desktop: false, sound: true, frequency: 'immediate' };
  const [n, setN] = React.useState<Notif>(defaults);
  const save = (next: Notif) => {
    setN(next);
    localStorage.setItem('app_notification_settings', JSON.stringify(next));
  };
  React.useEffect(() => {
    const raw = localStorage.getItem('app_notification_settings');
    if (raw) {
      try { setN({ ...defaults, ...JSON.parse(raw) }); } catch {}
    }
  }, []);
  return <div className="divide-y dark:divide-gray-700">
      <div className="pb-3">
        <h2 className="text-base font-semibold dark:text-gray-100">Notifications</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Choose how and when we notify you.</p>
      </div>
      <div className="py-5 space-y-4">
        <Toggle label="Email" checked={n.email} onChange={v => save({ ...n, email: v })} />
        <Toggle label="Push (mobile)" checked={n.push} onChange={v => save({ ...n, push: v })} />
        <Toggle label="Desktop notifications" checked={n.desktop} onChange={v => save({ ...n, desktop: v })} helper="Requires allowing notifications in your browser." />
        <Toggle label="Play sound" checked={n.sound} onChange={v => save({ ...n, sound: v })} />
        <div>
          <div className="mb-2 text-sm text-gray-900">Frequency</div>
          <div className="flex gap-3">
            {['immediate','daily','weekly'].map(f => (
              <label key={f} className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="freq" className="accent-blue-600" checked={n.frequency===f} onChange={() => save({ ...n, frequency: f as Notif['frequency'] })} />
                <span className="capitalize">{f}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>;
};

export const Personalization: React.FC = () => {
  type Pers = {
    density: 'comfortable' | 'compact';
    showAvatars: boolean;
    roundedCorners: boolean;
    reduceMotion: boolean;
    fontSize: 'sm' | 'md' | 'lg';
  };
  const defaults: Pers = { density: 'comfortable', showAvatars: true, roundedCorners: true, reduceMotion: false, fontSize: 'md' };
  const [p, setP] = React.useState<Pers>(defaults);
  const save = (next: Pers) => {
    setP(next);
    localStorage.setItem('app_personalization_settings', JSON.stringify(next));
    document.documentElement.style.setProperty('--radius', next.roundedCorners ? '0.75rem' : '0.25rem');
    document.documentElement.style.setProperty('--motion', next.reduceMotion ? '0' : '1');
    document.documentElement.style.setProperty('--font-size', next.fontSize === 'sm' ? '14px' : next.fontSize === 'lg' ? '18px' : '16px');
  };
  React.useEffect(() => {
    const raw = localStorage.getItem('app_personalization_settings');
    if (raw) {
      try { const parsed = { ...defaults, ...JSON.parse(raw) }; setP(parsed); save(parsed); } catch {}
    } else {
      save(defaults);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="divide-y dark:divide-gray-700">
      <div className="pb-3">
        <h2 className="text-base font-semibold dark:text-gray-100">Personalization</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Tune the interface to your preferences.</p>
      </div>
      <div className="py-5 space-y-5">
        <div>
          <div className="mb-2 text-sm text-gray-900">Density</div>
          <div className="flex gap-3">
            {(['comfortable','compact'] as Pers['density'][]).map(d => (
              <label key={d} className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="density" className="accent-blue-600" checked={p.density===d} onChange={() => save({ ...p, density: d })} />
                <span className="capitalize">{d}</span>
              </label>
            ))}
          </div>
        </div>
        <Toggle label="Show avatars" checked={p.showAvatars} onChange={v => save({ ...p, showAvatars: v })} />
        <Toggle label="Rounded corners" checked={p.roundedCorners} onChange={v => save({ ...p, roundedCorners: v })} />
        <Toggle label="Reduce motion" checked={p.reduceMotion} onChange={v => save({ ...p, reduceMotion: v })} />
        <div>
          <div className="mb-2 text-sm text-gray-900 dark:text-gray-200">Font size</div>
          <div className="flex gap-3">
            {(['sm','md','lg'] as Pers['fontSize'][]).map(f => (
              <label key={f} className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="fontsize" className="accent-blue-600" checked={p.fontSize===f} onChange={() => save({ ...p, fontSize: f })} />
                <span className="uppercase">{f}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>;
};

export const ConnectedApps: React.FC = () => {
  type Integration = { key: 'google' | 'github' | 'slack'; name: string; connected: boolean };
  const defaults: Integration[] = [
    { key: 'google', name: 'Google', connected: false },
    { key: 'github', name: 'GitHub', connected: false },
    { key: 'slack', name: 'Slack', connected: false }
  ];
  const [apps, setApps] = React.useState<Integration[]>(defaults);
  React.useEffect(() => {
    const raw = localStorage.getItem('app_connected_integrations');
    if (raw) {
      try { setApps(JSON.parse(raw)); } catch {}
    }
  }, []);
  const toggle = (key: Integration['key']) => {
    const next = apps.map(a => a.key === key ? { ...a, connected: !a.connected } : a);
    setApps(next);
    localStorage.setItem('app_connected_integrations', JSON.stringify(next));
  };
  return <div className="space-y-4">
      <h2 className="text-base font-semibold dark:text-gray-100">Connected apps</h2>
      {apps.map(a => (
        <div key={a.key} className="flex items-center justify-between border rounded-md p-4 dark:border-gray-700">
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{a.name}</div>
            <div className="text-xs text-gray-500">{a.connected ? 'Connected' : 'Not connected'}</div>
          </div>
          <button onClick={() => toggle(a.key)} className={`px-3 py-1.5 rounded-md text-sm border ${a.connected ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-blue-600 border-blue-200 hover:bg-blue-50'}`}>{a.connected ? 'Disconnect' : 'Connect'}</button>
        </div>
      ))}
    </div>;
};

export const DataControls: React.FC = () => {
  const exportData = () => {
    const keys = [
      'gemini_user',
      'gemini_settings',
      'gemini_profile_meta',
      'app_general_settings',
      'app_notification_settings',
      'app_personalization_settings',
      'app_connected_integrations',
      'app_security'
    ];
    const data: Record<string, any> = {};
    keys.forEach(k => {
      const v = localStorage.getItem(k);
      if (v) data[k] = JSON.parse(v);
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  const resetAll = () => {
    if (!confirm('Reset all app data? This will clear local settings.')) return;
    ['gemini_settings','gemini_profile_meta','app_general_settings','app_notification_settings','app_personalization_settings','app_connected_integrations','app_security'].forEach(k => localStorage.removeItem(k));
    alert('Data cleared. Reload the page to see defaults.');
  };
  return <div className="space-y-4">
      <h2 className="text-base font-semibold dark:text-gray-100">Data controls</h2>
      <div className="border rounded-md p-4 dark:border-gray-700">
        <div className="text-sm text-gray-900 mb-2 dark:text-gray-100">Export your data</div>
        <button onClick={exportData} className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700 dark:text-gray-100">Download JSON</button>
      </div>
      <div className="border rounded-md p-4 dark:border-gray-700">
        <div className="text-sm text-gray-900 mb-2 dark:text-gray-100">Reset app data</div>
        <button onClick={resetAll} className="px-3 py-1.5 rounded-md border text-sm text-red-600 border-red-200 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20">Clear local data</button>
      </div>
    </div>;
};

export const Security: React.FC = () => {
  const defaults = { twoFA: false };
  const [sec, setSec] = React.useState(defaults);
  const [isChangeOpen, setIsChangeOpen] = React.useState(false);
  const [pwd, setPwd] = React.useState({ current: '', next: '', confirm: '' });
  const [pwdError, setPwdError] = React.useState('');
  const [pwdSuccess, setPwdSuccess] = React.useState('');
  React.useEffect(() => {
    const raw = localStorage.getItem('app_security');
    if (raw) { try { setSec({ ...defaults, ...JSON.parse(raw) }); } catch {} }
  }, []);
  const save = (next: typeof defaults) => {
    setSec(next);
    localStorage.setItem('app_security', JSON.stringify(next));
  };
  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    if (!pwd.current || !pwd.next || !pwd.confirm) { setPwdError('Please fill in all fields.'); return; }
    if (pwd.next.length < 6) { setPwdError('New password must be at least 6 characters.'); return; }
    if (pwd.next !== pwd.confirm) { setPwdError('New passwords do not match.'); return; }
    if (pwd.next === pwd.current) { setPwdError('New password must be different from current.'); return; }
    // Mock success
    setPwdSuccess('Password updated successfully (mock).');
    setTimeout(() => { setIsChangeOpen(false); setPwd({ current: '', next: '', confirm: '' }); setPwdSuccess(''); }, 900);
  };
  return <div className="space-y-5">
      <h2 className="text-base font-semibold dark:text-gray-100">Security</h2>
      <Toggle label="Two-factor authentication" checked={sec.twoFA} onChange={v => save({ twoFA: v })} helper="Adds an extra layer of security at sign in." />
      <div>
        <div className="text-sm text-gray-900 mb-2 dark:text-gray-200">Password</div>
        <button onClick={() => setIsChangeOpen(true)} className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700 dark:text-gray-100 shadow-sm">Change password</button>
      </div>
      <div>
        <div className="text-sm text-gray-900 mb-2 dark:text-gray-200">Sessions</div>
        <button onClick={() => alert('Signed out from other devices (mock).')} className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700 dark:text-gray-100">Sign out from all other sessions</button>
      </div>
      {isChangeOpen && <div className="fixed inset-0 z-40" aria-modal role="dialog">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn" onClick={() => setIsChangeOpen(false)}></div>
          <div className="absolute inset-0 flex items-start md:items-center justify-center p-4">
            <div className="w-full max-w-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow-2xl animate-slideDown">
            <div className="px-5 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LockIcon className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Change Password</h3>
              </div>
              <button onClick={() => setIsChangeOpen(false)} className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10">
                <XIcon className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <form className="p-5 space-y-4" onSubmit={submitPassword}>
              {pwdError && <div className="text-sm px-3 py-2 rounded-md bg-red-50 text-red-700 border border-red-200">{pwdError}</div>}
              {pwdSuccess && <div className="text-sm px-3 py-2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> {pwdSuccess}</div>}
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">Current Password</label>
                <div className="relative">
                  <KeyIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="password" value={pwd.current} onChange={e => setPwd({ ...pwd, current: e.target.value })} className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" placeholder="••••••••" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">New Password</label>
                <div className="relative">
                  <KeyIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="password" value={pwd.next} onChange={e => setPwd({ ...pwd, next: e.target.value })} className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" placeholder="New password" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-600 dark:text-gray-300 mb-1">Confirm New Password</label>
                <div className="relative">
                  <KeyIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="password" value={pwd.confirm} onChange={e => setPwd({ ...pwd, confirm: e.target.value })} className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" placeholder="Confirm new password" />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsChangeOpen(false)} className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition-all" style={{ backgroundImage: 'linear-gradient(135deg, rgba(59,130,246,1) 0%, rgba(99,102,241,1) 100%)' }}>Submit</button>
              </div>
            </form>
            </div>
          </div>
        </div>}
    </div>;
};

export const Account: React.FC = () => {
  const deleteAccount = () => {
    if (!confirm('Delete your account? This is a mock and will clear local user state.')) return;
    localStorage.removeItem('gemini_user');
    alert('Account deleted from this device (mock). You will be logged out.');
    window.location.href = '/login';
  };
  return <div className="space-y-5">
      <h2 className="text-base font-semibold dark:text-gray-100">Account</h2>
      <div className="border rounded-md p-4 dark:border-gray-700">
        <div className="text-sm text-gray-900 mb-2 dark:text-gray-100">Delete account</div>
        <button onClick={deleteAccount} className="px-3 py-1.5 rounded-md border text-sm text-red-600 border-red-200 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20">Delete</button>
      </div>
    </div>;
};

const Toggle: React.FC<{ label: string; helper?: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, helper, checked, onChange }) => {
  return <div>
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <span className="relative inline-flex h-5 w-9 items-center">
          <input type="checkbox" className="peer sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
          <span className="h-5 w-9 rounded-full bg-gray-300 peer-checked:bg-blue-600 transition-colors"></span>
          <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all peer-checked:translate-x-4"></span>
        </span>
        <span className="text-sm text-gray-900 dark:text-gray-200">{label}</span>
      </label>
      {helper && <p className="text-xs text-gray-500 ml-12 mt-1">{helper}</p>}
    </div>;
};


