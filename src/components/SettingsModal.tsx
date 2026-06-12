import { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Loader, Key } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTokenSave: (token: string) => void;
}

export default function SettingsModal({ isOpen, onClose, onTokenSave }: Props) {
  const [apiToken, setApiToken] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('footballApiToken');
    if (saved) setApiToken(saved);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    localStorage.setItem('footballApiToken', apiToken);
    onTokenSave(apiToken);
    await new Promise((r) => setTimeout(r, 300));
    setIsSaving(false);
  };

  const handleTest = async () => {
    if (!apiToken.trim()) { setTestStatus('error'); return; }
    setTestStatus('testing');
    try {
      const res = await fetch('https://api.football-data.org/v4/competitions/WC', {
        headers: { 'X-Auth-Token': apiToken },
      });
      setTestStatus(res.ok ? 'success' : 'error');
    } catch {
      setTestStatus('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative w-full max-w-md mx-4 bg-white border-4 border-wc-black shadow-2xl">
        {/* Header stripe */}
        <div className="bg-wc-red px-6 py-4 flex items-center justify-between">
          <h2 className="font-anton text-white tracking-widest text-lg uppercase">Settings</h2>
          <button onClick={onClose} className="text-white hover:text-red-200 transition">
            <X size={22} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Token input */}
          <div>
            <label className="flex items-center gap-2 font-anton text-wc-black tracking-widest text-xs uppercase mb-3">
              <Key size={14} />
              Football API Token
            </label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => { setApiToken(e.target.value); setTestStatus('idle'); }}
              placeholder="Enter your API token"
              className="w-full px-4 py-3 border-2 border-gray-200 focus:border-wc-black outline-none font-inter text-sm text-wc-black placeholder-gray-300 transition"
            />
            <p className="text-xs text-gray-400 mt-2 font-inter">
              Get a free token at{' '}
              <a
                href="https://api.football-data.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-wc-blue underline font-semibold"
              >
                api.football-data.org
              </a>
            </p>
          </div>

          {/* Test button */}
          <div>
            <button
              onClick={handleTest}
              disabled={!apiToken.trim() || testStatus === 'testing'}
              className="w-full py-3 border-2 border-wc-black font-anton text-xs tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-wc-black hover:text-white transition disabled:opacity-40"
            >
              {testStatus === 'testing' ? (
                <><Loader className="animate-spin" size={14} /> Testing...</>
              ) : 'Test Connection'}
            </button>

            {testStatus === 'success' && (
              <div className="mt-3 flex items-center gap-2 font-anton text-wc-green tracking-widest text-sm">
                <CheckCircle size={18} /> Connected
              </div>
            )}
            {testStatus === 'error' && (
              <div className="mt-3 flex items-center gap-2 font-anton text-wc-red tracking-widest text-sm">
                <XCircle size={18} /> Connection failed
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex border-t-2 border-wc-black">
          <button
            onClick={onClose}
            className="flex-1 py-4 font-anton text-xs tracking-widest uppercase text-gray-400 hover:bg-gray-50 transition border-r-2 border-wc-black"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-4 font-anton text-xs tracking-widest uppercase bg-wc-black text-white hover:bg-wc-red transition disabled:opacity-40"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
