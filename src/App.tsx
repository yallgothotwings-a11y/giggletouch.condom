import React, { useState, useEffect } from 'react';
import { Search, Gamepad2, Globe, Play, ExternalLink, Settings as SettingsIcon, MessageSquare, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import gamesData from './games.json';
import Settings from './components/Settings';
import MouseTrail from './components/MouseTrail';
import Chat from './components/Chat';

type Game = {
  id: string;
  name: string;
  file: string;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'games' | 'unblocker' | 'chat' | 'settings'>('games');
  const [searchQuery, setSearchQuery] = useState('');
  const [unblockerUrl, setUnblockerUrl] = useState('');
  const [loadingGame, setLoadingGame] = useState<string | null>(null);

  // Socket & Online State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    newSocket.on('online_count', (count: number) => {
      setOnlineCount(count);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Settings State
  const [themeColor, setThemeColor] = useState(() => localStorage.getItem('themeColor') || '#9333ea');
  const [mouseTrailEnabled, setMouseTrailEnabled] = useState(() => localStorage.getItem('mouseTrail') !== 'false');
  const [crtEnabled, setCrtEnabled] = useState(() => localStorage.getItem('crtEnabled') === 'true');
  const [customCursor, setCustomCursor] = useState(() => localStorage.getItem('customCursor') || '');

  useEffect(() => {
    localStorage.setItem('themeColor', themeColor);
    document.documentElement.style.setProperty('--theme-color', themeColor);
  }, [themeColor]);

  useEffect(() => {
    localStorage.setItem('mouseTrail', String(mouseTrailEnabled));
  }, [mouseTrailEnabled]);

  useEffect(() => {
    localStorage.setItem('crtEnabled', String(crtEnabled));
    if (crtEnabled) {
      document.body.classList.add('crt');
    } else {
      document.body.classList.remove('crt');
    }
  }, [crtEnabled]);

  // Tab Cloaking (Google Classroom)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const favicon = document.getElementById('favicon') as HTMLLinkElement;
      if (document.hidden) {
        document.title = 'Classes';
        if (favicon) {
          favicon.href = 'https://ssl.gstatic.com/classroom/favicon.png';
        }
      } else {
        document.title = 'Babii Games';
        if (favicon) {
          favicon.href = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎮</text></svg>';
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const filteredGames = gamesData.filter((game) =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openGameInAboutBlank = async (game: Game) => {
    setLoadingGame(game.id);
    
    const newWin = window.open('about:blank', '_blank');
    if (!newWin) {
      alert('Popup blocked! Please allow popups for this site to play games.');
      setLoadingGame(null);
      return;
    }

    newWin.document.open();
    newWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Loading...</title>
          <style>
            body {
              margin: 0;
              background-color: #0a0a0a;
              color: #ffffff;
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
            }
            .spinner {
              width: 50px;
              height: 50px;
              border: 4px solid rgba(255, 255, 255, 0.1);
              border-top-color: ${themeColor};
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin-bottom: 20px;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            h1 {
              font-size: 2rem;
              font-weight: bold;
              margin-bottom: 10px;
            }
            p {
              color: #888;
            }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <h1 id="loading-msg">be paitient lil buddy</h1>
          <p>Initializing ${game.name}...</p>
          <script>
            setTimeout(() => {
              const msg = document.getElementById('loading-msg');
              if (msg) msg.innerText = 'still waiting huh?';
            }, 5000);
          </script>
        </body>
      </html>
    `);
    newWin.document.close();

    try {
      // encodeURIComponent doesn't encode parentheses, which can cause issues with some CDNs
      const encoded = encodeURIComponent(game.file).replace(/\(/g, '%28').replace(/\)/g, '%29');
      // jsDelivr rejects requests with query parameters (like ?t=...), so we remove it
      const response = await fetch(`https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile/UGS-Files/${encoded}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch game file: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      
      newWin.document.open();
      newWin.document.write(text);
      newWin.document.close();
    } catch (error) {
      console.error('Error loading game:', error);
      newWin.document.open();
      newWin.document.write(`
        <body style="background:#0a0a0a;color:white;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;">
          <h2 style="color:#ef4444;margin-bottom:10px;">Failed to load game</h2>
          <p style="color:#888;">Please close this tab and try again later.</p>
        </body>
      `);
      newWin.document.close();
    } finally {
      setLoadingGame(null);
    }
  };

  const handleUnblockerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unblockerUrl) return;

    let finalUrl = unblockerUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    const newWin = window.open('about:blank', '_blank');
    if (newWin) {
      newWin.document.body.style.margin = '0';
      newWin.document.body.style.height = '100vh';
      newWin.document.body.style.overflow = 'hidden';
      
      const iframe = newWin.document.createElement('iframe');
      iframe.style.border = 'none';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.margin = '0';
      iframe.src = finalUrl;
      
      newWin.document.body.appendChild(iframe);
    } else {
      alert('Popup blocked! Please allow popups for this site to use the unblocker.');
    }
  };

  const NavButton = ({ tab, icon: Icon, label }: { tab: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
        activeTab === tab
          ? 'bg-[var(--theme-color)]/10 text-[var(--theme-color)] border border-[var(--theme-color)]/20'
          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-gray-100 font-sans selection:bg-[var(--theme-color)]/30">
      {customCursor && (
        <style>{`
          * {
            cursor: url("${customCursor}"), auto !important;
          }
        `}</style>
      )}
      {mouseTrailEnabled && <MouseTrail color={themeColor} />}
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-[var(--theme-color)]/30 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-[var(--theme-color)]/20"
                style={{ background: `linear-gradient(to bottom right, ${themeColor}, #000)` }}
              >
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span 
                  className="text-xl font-bold bg-clip-text text-transparent leading-none"
                  style={{ backgroundImage: `linear-gradient(to right, ${themeColor}, #fff)` }}
                >
                  Babii Games
                </span>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: themeColor }}></span>
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: themeColor }}></span>
                  </div>
                  <span className="font-medium">{onlineCount} {onlineCount === 1 ? 'user' : 'users'} online</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <NavButton tab="games" icon={Gamepad2} label="Games" />
              <NavButton tab="unblocker" icon={Globe} label="Unblocker" />
              <NavButton tab="chat" icon={MessageSquare} label="Chat" />
              <NavButton tab="settings" icon={SettingsIcon} label="Settings" />
              <a 
                href="https://www.tiktok.com/@dihhhblud" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 text-gray-400 hover:text-[#ff0050] hover:bg-white/5"
                title="Follow me on TikTok @dihhhblud"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                <span className="hidden sm:inline">TikTok</span>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === 'games' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-end gap-6 mb-10">
              <div className="relative w-full md:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-[var(--theme-color)]/30 rounded-xl leading-5 bg-[#141414] text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)]/50 focus:border-[var(--theme-color)]/50 transition-all duration-200"
                />
              </div>
            </div>

            {filteredGames.length === 0 ? (
              <div className="text-center py-20">
                <Gamepad2 className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-300">No games found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your search query.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredGames.map((game) => (
                  <motion.div
                    key={game.id}
                    whileHover={{ y: -5 }}
                    className="group relative bg-[#141414] rounded-2xl overflow-hidden border border-[var(--theme-color)]/20 hover:border-[var(--theme-color)]/50 transition-all duration-300 shadow-lg hover:shadow-[var(--theme-color)]/20 flex flex-col p-6 items-center justify-center text-center gap-4"
                  >
                    <h3 
                      className="font-semibold text-gray-200 transition-colors"
                      style={{ '--hover-color': themeColor } as any}
                    >
                      {game.name}
                    </h3>
                    <button
                      onClick={() => openGameInAboutBlank(game)}
                      disabled={loadingGame === game.id}
                      className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100"
                      style={{ backgroundColor: themeColor, boxShadow: `0 4px 14px 0 ${themeColor}40` }}
                    >
                      {loadingGame === game.id ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Play className="w-5 h-5 ml-1" />
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'unblocker' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-[#141414] border border-[var(--theme-color)]/30 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-[var(--theme-color)]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-[var(--theme-color)]/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-[var(--theme-color)]/20 rounded-2xl flex items-center justify-center mb-6 border border-[var(--theme-color)]/30">
                  <Globe className="w-8 h-8 text-[var(--theme-color)]" />
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-4">Web Unblocker</h2>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  Browse any website privately and securely. Enter a URL below and it will open in a cloaked about:blank tab, hiding it from history and monitoring.
                </p>

                <form onSubmit={handleUnblockerSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="url" className="block text-sm font-medium text-gray-400 mb-2">
                      Website URL
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="url"
                        placeholder="example.com"
                        value={unblockerUrl}
                        onChange={(e) => setUnblockerUrl(e.target.value)}
                        className="block w-full pl-4 pr-12 py-4 border border-[var(--theme-color)]/50 rounded-xl bg-black/50 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)]/50 focus:border-[var(--theme-color)]/50 transition-all duration-200"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <kbd className="hidden sm:inline-flex items-center px-2 py-1 border border-gray-700 rounded text-xs font-sans text-gray-500 bg-gray-800/50">
                          Enter
                        </kbd>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!unblockerUrl}
                    className="w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
                    style={{ backgroundColor: themeColor }}
                  >
                    <span>Launch in about:blank</span>
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'chat' && (
          <Chat themeColor={themeColor} socket={socket} />
        )}

        {activeTab === 'settings' && (
          <Settings 
            themeColor={themeColor}
            setThemeColor={setThemeColor}
            mouseTrailEnabled={mouseTrailEnabled}
            setMouseTrailEnabled={setMouseTrailEnabled}
            crtEnabled={crtEnabled}
            setCrtEnabled={setCrtEnabled}
            customCursor={customCursor}
            setCustomCursor={setCustomCursor}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--theme-color)]/20 bg-black/40 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-center gap-2 text-gray-400 text-sm">
          <span>Created by babiiunc.</span>
        </div>
      </footer>
    </div>
  );
}
