
import React, { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react';
import { SendIcon, Sparkles, History, Plus, X, Mic } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Header } from './components/Header';
import { useAuth } from './components/AuthContext';
import { useChatSessions, useChatMessages } from './hooks/useApi';
import { ErrorMessage } from './components/ErrorMessage';
import { LoadingSpinner } from './components/LoadingSpinner';
import { FileUploadModal } from './components/FileUpload';
import { getImageUrl } from './services/api';

// Utility function to format timestamps
const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return '';
  
  // Handle different timestamp formats
  let date: Date;
  
  // Debug what we're receiving
  console.log('formatTimestamp received:', typeof timestamp, timestamp);
  
  // If timestamp is already a Date object
  if (timestamp instanceof Date) {
    date = timestamp;
  } 
  // If timestamp is a string
  else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  }
  // If timestamp is an object (like from Sequelize), try to extract the date
  else if (typeof timestamp === 'object' && timestamp !== null) {
    // Try common date properties
    if (timestamp.createdAt) {
      date = new Date(timestamp.createdAt);
    } else if (timestamp.date) {
      date = new Date(timestamp.date);
    } else if (timestamp.timestamp) {
      date = new Date(timestamp.timestamp);
    } else {
      // Try to convert the object to string and parse
      date = new Date(timestamp.toString());
    }
  }
  // If it's a number (Unix timestamp)
  else if (typeof timestamp === 'number') {
    // Check if it's in seconds or milliseconds
    if (timestamp < 10000000000) {
      // Unix timestamp in seconds
      date = new Date(timestamp * 1000);
    } else {
      // Unix timestamp in milliseconds
      date = new Date(timestamp);
    }
  }
  else {
    console.warn('Invalid timestamp type:', typeof timestamp, timestamp);
    return 'Invalid date';
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date after parsing:', timestamp);
    return 'Invalid date';
  }
  
  const now = new Date();
  
  // Get local date components for comparison
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Calculate difference in days
  const diffInDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // For debugging - log the date calculation
  console.log('Date formatting result:', {
    originalTimestamp: timestamp,
    parsedDate: date.toISOString(),
    localDate: date.toLocaleDateString(),
    now: now.toISOString(),
    localNow: now.toLocaleDateString(),
    diffInDays,
    messageDate: messageDate.toISOString(),
    today: today.toISOString()
  });
  
  // If the message is from today
  if (diffInDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  // If the message is from yesterday
  else if (diffInDays === 1) {
    return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  // If the message is from this week (within 7 days)
  else if (diffInDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  }
  // For older messages, show date and time
  else {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
};

export function App() {
  const [input, setInput] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionMenuId, setSessionMenuId] = useState<string | null>(null);
  const [modal, setModal] = useState<null | { type: 'rename' | 'share' | 'remove'; id: string }>(null);
  const [renameValue, setRenameValue] = useState('');
  const [bottomPadding, setBottomPadding] = useState<number>(160);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileUploadOpen, setFileUploadOpen] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputBarRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  
  // Use API hooks
  const {
    sessions,
    error: sessionsError,
    createSession,
    updateSession,
    deleteSession,
    clearAllSessions,
  } = useChatSessions();
  
  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    sendMessage,
  } = useChatMessages(currentSessionId);
  const deriveTitle = (): string => {
    const titleBase = messages.find(m => m.role === 'user')?.content || 'New chat';
    return titleBase.slice(0, 40);
  };

  const startNewChat = async () => {
    setError(null);
    const newSession = await createSession('New chat');
    if (newSession) {
      setCurrentSessionId(newSession.id);
      setInput('');
      setHistoryOpen(false);
    } else {
      setError('Failed to create new chat session');
    }
  };

  const openSession = (id: string) => {
    setCurrentSessionId(id);
    setHistoryOpen(false);
  };

  const handleClearAllSessions = async () => {
    setError(null);
    const success = await clearAllSessions();
    if (success) {
      setCurrentSessionId(null);
    } else {
      setError('Failed to clear all sessions');
    }
  };

  const handleRenameSession = async (id: string, title: string) => {
    if (!title.trim()) return;
    setError(null);
    const success = await updateSession(id, { title: title.trim() });
    if (!success) {
      setError('Failed to rename session');
    }
  };

  const handleDeleteSession = async (id: string) => {
    setError(null);
    const success = await deleteSession(id);
    if (success) {
      if (currentSessionId === id) {
        setCurrentSessionId(null);
      }
    } else {
      setError('Failed to delete session');
    }
  };
  const buildTranscript = (id: string): string => {
    if (id === currentSessionId) {
      return messages.map(m => `${m.role === 'user' ? 'You' : 'Fixit'}: ${m.content}`).join('\n');
    }
    const s = sessions.find(x => x.id === id);
    if (!s) return '';
    // For sessions not currently loaded, we'd need to fetch messages
    // For now, return a placeholder
    return `Chat session: ${s.title}`;
  };
  const buildShareLink = (id: string): string => {
    try {
      const payload = buildTranscript(id);
      const encoded = btoa(unescape(encodeURIComponent(payload)));
      return `${window.location.origin}${window.location.pathname}?share=${encoded}`;
    } catch {
      return window.location.href;
    }
  };
  // Close history when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      // If a sub-option modal is open, do not close the History panel
      if (modal) return;
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setHistoryOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [modal]);
  // Reusable function to scroll the chat to show the latest message
  const scrollToLatest = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const barH = inputBarRef.current?.offsetHeight ?? 0;
    const target = Math.max(0, el.scrollHeight - barH - 24);
    el.scrollTo({ top: target, behavior: 'smooth' });
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Scroll to latest message and keep it centered whenever messages or loading indicator change
  useLayoutEffect(() => {
    const scrollNow = () => { scrollToLatest(); };
    // Try a few frames to ensure layout/height is finalized
    let tries = 0;
    const rafScroll = () => {
      scrollNow();
      if (tries < 3) {
        tries += 1;
        requestAnimationFrame(rafScroll);
      }
    };
    requestAnimationFrame(rafScroll);
    // Final nudge after async renders (images/fonts)
    const t = setTimeout(scrollNow, 120);
    // Re-apply on window resize to keep the chat centered
    const onResize = () => scrollNow();
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
    };
  }, [messages, messagesLoading, scrollToLatest]);
  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    // Ensure the chat container scrolls when the input grows so it never hides behind the panel
    if (scrollContainerRef.current) {
      const barH = inputBarRef.current?.offsetHeight ?? 0;
      const target = Math.max(0, scrollContainerRef.current.scrollHeight - barH - 24);
      scrollContainerRef.current.scrollTo({ top: target, behavior: 'smooth' });
    }
  }, [input]);

  // Keep enough bottom padding so messages never hide behind the fixed input bar
  useEffect(() => {
    const measure = () => {
      const barH = inputBarRef.current?.offsetHeight ?? 0;
      // Add a little extra spacing for comfort
      setBottomPadding(barH + 24);
    };
    measure();
    const r = new ResizeObserver(() => measure());
    if (inputBarRef.current) r.observe(inputBarRef.current);
    window.addEventListener('resize', measure);
    return () => {
      r.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  // Initialize speech recognition lazily
  const ensureRecognition = () => {
    if (recognitionRef.current) return recognitionRef.current;
    const SpeechRecognition: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    let finalTranscript = '';
    rec.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalTranscript += res[0].transcript;
        else interim += res[0].transcript;
      }
      setInput((finalTranscript + interim).trimStart());
    };
    rec.onerror = () => { setIsListening(false); };
    rec.onend = () => { setIsListening(false); };
    recognitionRef.current = rec;
    return rec;
  };
  const toggleVoice = () => {
    const rec = ensureRecognition();
    if (!rec) { alert('Voice not supported in this browser.'); return; }
    if (isListening) { rec.stop(); setIsListening(false); }
    else { try { rec.start(); setIsListening(true); } catch {} }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || messagesLoading) return;
    
    let sessionId = currentSessionId;
    
    if (!sessionId) {
      // Create a new session if none exists
      const newSession = await createSession(deriveTitle());
      if (!newSession) {
        setError('Failed to create chat session');
        return;
      }
      sessionId = newSession.id;
      setCurrentSessionId(sessionId);
    }

    setError(null);
    const userMessage = input.trim();
    setInput('');
    
    // Send message via API with the correct session ID
    const response = await sendMessage(userMessage, sessionId || undefined);
    if (!response) {
      setError('Failed to send message');
    }
  };
  return <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header />
      {/* Main chat container */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 relative text-gray-900 dark:text-gray-100" ref={scrollContainerRef} style={{ paddingBottom: bottomPadding }}>
        {/* Error Display */}
        {(error || sessionsError || messagesError) && (
          <div className="max-w-3xl mx-auto mb-4">
            <ErrorMessage
              error={error || sessionsError || messagesError || 'An error occurred'}
              variant="inline"
              onDismiss={() => setError(null)}
            />
          </div>
        )}
        {/* Floating actions - left side stack */}
        <div className="fixed left-4 top-20 z-40 flex flex-col items-start gap-2" ref={historyRef}>
          <button onClick={startNewChat} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.2)] transition-shadow backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[130px]" style={{ backgroundImage: 'linear-gradient(135deg, rgba(16,185,129,0.95) 0%, rgba(59,130,246,0.95) 100%)' }}>
            <Plus className="h-4 w-4" />
            New Chat
          </button>
          <button onClick={() => setHistoryOpen(v => !v)} className="group relative inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.2)] transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-md min-w-[130px]" style={{ backgroundImage: 'linear-gradient(135deg, rgba(59,130,246,0.95) 0%, rgba(168,85,247,0.95) 100%)' }}>
            <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></span>
            <History className="h-4 w-4" />
            History
          </button>
          {historyOpen && <div className="fixed inset-0 z-50" role="dialog" aria-modal>
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setHistoryOpen(false)}></div>
              <div className="absolute inset-0 flex items-start md:items-center justify-center p-4">
                <div className="w-full max-w-md rounded-2xl border border-white/40 dark:border-white/10 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl shadow-2xl animate-slideDown modal-surface">
                  <div className="p-3 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                    <div className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-300">Recent</div>
                    <button onClick={() => setHistoryOpen(false)} className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10">
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-auto divide-y divide-black/5 dark:divide-white/10 text-gray-900 dark:text-gray-100">
                    {sessions.length === 0 && <div className="p-4 text-sm text-gray-500">No chats yet</div>}
                    {sessions.map(s => (
                      <div key={s.id} className="relative group">
                        <button onClick={() => openSession(s.id)} className="w-full text-left p-3 pr-12 hover:bg-white/60 dark:hover:bg-white/5 transition-colors">
                          <div className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">{s.title}</div>
                          <div className="text-[10px] text-gray-500 mt-1">{new Date(s.createdAt).toLocaleString()}</div>
                        </button>
                        <button aria-label="More" className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-gray-500 hover:bg-black/5 dark:hover:bg-white/10" onClick={(e) => { e.stopPropagation(); setSessionMenuId(prev => prev === s.id ? null : s.id); }}>
                          ⋮
                        </button>
                        {sessionMenuId === s.id && <div className="absolute right-2 top-8 z-10 w-40 rounded-md border border-black/5 dark:border-white/10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg">
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10" onClick={() => { setSessionMenuId(null); setRenameValue(s.title); setModal({ type: 'rename', id: s.id }); }}>Rename</button>
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10" onClick={() => { setSessionMenuId(null); setModal({ type: 'share', id: s.id }); }}>Share</button>
                            <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => { setSessionMenuId(null); setModal({ type: 'remove', id: s.id }); }}>Remove</button>
                          </div>}
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-black/5 dark:border-white/10 flex justify-end">
                    <button onClick={handleClearAllSessions} className="text-xs px-2 py-1 rounded-md btn-muted hover:bg-gray-50 dark:hover:bg-gray-800">Clear all</button>
                  </div>
                </div>
              </div>
            </div>}
        </div>
        {/* Action modal for rename/share/remove - keeps History open */}
        {modal && <div className="fixed inset-0 z-50" role="dialog" aria-modal>
            <div className="absolute inset-0" onClick={() => setModal(null)}></div>
            <div className="absolute inset-0 flex items-start md:items-center justify-center p-4">
              <div className="w-full max-w-md rounded-2xl border border-white/40 dark:border-white/10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl animate-slideDown">
                {modal.type === 'rename' && <div>
                    <div className="px-5 py-4 border-b border-black/5 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-gray-200">Rename chat</div>
                    <form className="p-5 space-y-4" onSubmit={e => { e.preventDefault(); handleRenameSession(modal.id, renameValue); setModal(null); }}>
                      <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter chat name" />
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundImage: 'linear-gradient(135deg, rgba(59,130,246,1) 0%, rgba(99,102,241,1) 100%)' }}>Save</button>
                      </div>
                    </form>
                  </div>}
                {modal.type === 'share' && <div>
                    <div className="px-5 py-4 border-b border-black/5 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-gray-200">Share chat</div>
                    <div className="p-5 space-y-3">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-1">Share link</div>
                        <div className="flex items-center gap-2">
                          <input readOnly value={buildShareLink(modal.id)} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 text-gray-900 dark:text-gray-100" />
                          <button type="button" onClick={async () => { await navigator.clipboard.writeText(buildShareLink(modal.id)); }} className="px-3 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundImage: 'linear-gradient(135deg, rgba(59,130,246,1) 0%, rgba(99,102,241,1) 100%)' }}>Copy link</button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button type="button" className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700" onClick={async () => {
                          const text = buildTranscript(modal.id);
                          const url = buildShareLink(modal.id);
                          if (navigator.share) { try { await navigator.share({ title: 'Chat', text, url }); } catch {} } else { await navigator.clipboard.writeText(url); }
                        }}>System share</button>
                        <a className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700" href={`https://wa.me/?text=${encodeURIComponent(buildShareLink(modal.id))}`} target="_blank" rel="noreferrer">WhatsApp</a>
                        <a className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check this chat: ' + buildShareLink(modal.id))}`} target="_blank" rel="noreferrer">Twitter/X</a>
                        <a className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700" href={`mailto:?subject=${encodeURIComponent('Shared chat')}&body=${encodeURIComponent(buildShareLink(modal.id))}`} target="_blank" rel="noreferrer">Email</a>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700">Close</button>
                      </div>
                    </div>
                  </div>}
                {modal.type === 'remove' && <div>
                    <div className="px-5 py-4 border-b border-black/5 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-gray-200">Delete chat</div>
                    <div className="p-5 space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">Are you sure you want to delete this chat? This action cannot be undone.</p>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700">Cancel</button>
                        <button type="button" onClick={() => { handleDeleteSession(modal.id); setModal(null); }} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700">Delete</button>
                      </div>
                    </div>
                  </div>}
              </div>
            </div>
          </div>}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 my-4">
          {/* Welcome message if no messages */}
          {messages.length === 0 && <div className="text-center py-16 px-4">
              <div className="flex items-center justify-center mb-6">
                <div className="h-28 w-28 rounded-full overflow-hidden ring-1 ring-blue-500/20 shadow-[0_10px_30px_rgba(59,130,246,0.25)]">
                  <img src="/logo.jpg" alt="Fixit" className="h-full w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold mb-3 text-gray-900 dark:text-white tracking-tight">
                How can Fixit help you today{user ? ', ' + user.name : ''}?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
                Ask me anything about any topic, request information, or just chat with me.
              </p>
            </div>}
          {/* Messages */}
          <div className="space-y-6">
            {messages.map((message, index) => <div key={index} ref={index === messages.length - 1 ? lastMessageRef : undefined} className={`animate-fadeIn transition-opacity duration-300 ease-in-out ${message.role === 'user' ? 'pl-4' : ''}`} style={{
            animationDelay: `${index * 0.1}s`
          }}>
                <div className="flex items-start">
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-4 shadow-sm ${message.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {message.role === 'user' ? user ? <img key={user.avatar} src={getImageUrl(user.avatar, true)} alt={user.name} className="w-8 h-8 rounded-full" /> : 'U' : <Sparkles className="h-4 w-4" />}
                  </div>
                  {/* Message content */}
                  <div className={`flex-1 prose prose-slate dark:prose-invert max-w-none ${message.role === 'assistant' ? 'bg-white p-4 rounded-lg shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700' : ''}`}>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 opacity-70">
                      {formatTimestamp(message.createdAt)}
                    </div>
                  </div>
                </div>
              </div>)}
          </div>
          {/* Loading indicator */}
          {messagesLoading && <div className="mb-6 pl-4 mt-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-4 shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="flex-1 bg-white p-4 rounded-lg shadow-sm border border-gray-100 dark:bg-gray-800 dark:border-gray-700">
                  <LoadingSpinner size="sm" text="Thinking..." />
                </div>
              </div>
            </div>}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {/* Input area */}
      <div ref={inputBarRef} className="fixed inset-x-0 bottom-0 z-30 bg-transparent border-t-0 backdrop-blur-0 p-3 sm:p-4 shadow-none">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-end">
            <div className="flex-1 relative">
              <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} placeholder="Ask anything" className="w-full border border-gray-300 dark:border-gray-700/50 rounded-full py-3.5 pl-14 pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-[0_4px_24px_rgba(0,0,0,0.25)] transition-shadow duration-200 bg-white/90 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 no-scrollbar" rows={1} style={{
              maxHeight: '200px'
            }} onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }} />
              <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                <div className="relative">
                  <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700/70 dark:text-gray-200 dark:hover:bg-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Add attachment" onClick={() => setAttachOpen(v => !v)}>
                    <Plus className="h-5 w-5" />
                  </button>
                  {attachOpen && (
                    <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50 w-56 rounded-md border border-black/5 dark:border-white/10 bg-white dark:bg-gray-800 shadow-lg">
                      <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => { setAttachOpen(false); imageInputRef.current?.click(); }}>Upload photo</button>
                      <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => { setAttachOpen(false); setFileUploadOpen(true); }}>Upload file</button>
                    </div>
                  )}
                </div>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={async e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  console.log(`Image selected: ${f.name}`);
                  e.currentTarget.value = '';
                }} />
                <input ref={fileInputRef} type="file" className="hidden" onChange={async e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  console.log(`File selected: ${f.name}`);
                  e.currentTarget.value = '';
                }} />
              </div>
              
              <div className="absolute inset-y-0 right-2 flex items-center gap-2">
                <button type="button" onClick={toggleVoice} className={`h-10 w-10 inline-flex items-center justify-center rounded-full transition ${isListening ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700/70 dark:text-gray-200 dark:hover:bg-gray-700'}`} aria-label="Voice">
                  <Mic className="h-4 w-4" />
                </button>
                <button type="submit" className="h-10 w-10 inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700/70 dark:text-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50" disabled={!input.trim() || messagesLoading} aria-label="Send message">
                  <SendIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </form>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Fixit may display inaccurate information, including about people,
            places, or facts.
          </p>
        </div>
      </div>
      
      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={fileUploadOpen}
        onClose={() => setFileUploadOpen(false)}
        sessionId={currentSessionId || undefined}
        onUploadComplete={(file) => {
          console.log('File uploaded:', file);
          setFileUploadOpen(false);
        }}
      />
    </div>;
}