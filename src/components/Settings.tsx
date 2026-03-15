import React, { useRef } from 'react';
import { Settings as SettingsIcon, Palette, MousePointer2, Monitor, Upload, X } from 'lucide-react';
import { motion } from 'motion/react';

type SettingsProps = {
  themeColor: string;
  setThemeColor: (color: string) => void;
  mouseTrailEnabled: boolean;
  setMouseTrailEnabled: (enabled: boolean) => void;
  crtEnabled: boolean;
  setCrtEnabled: (enabled: boolean) => void;
  customCursor: string;
  setCustomCursor: (cursor: string) => void;
};

const COLORS = [
  { name: 'Purple', value: '#9333ea' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Cyan', value: '#06b6d4' },
];

export default function Settings({
  themeColor,
  setThemeColor,
  mouseTrailEnabled,
  setMouseTrailEnabled,
  crtEnabled,
  setCrtEnabled,
  customCursor,
  setCustomCursor
}: SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCursorUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image if it's too large (cursors should be small, max 128x128)
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 64; // 64x64 is a good max size for cursors
        
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/png');
          setCustomCursor(dataUrl);
          localStorage.setItem('customCursor', dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const clearCustomCursor = () => {
    setCustomCursor('');
    localStorage.removeItem('customCursor');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-[#141414] border border-[var(--theme-color)]/30 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-[var(--theme-color)]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="w-16 h-16 bg-[var(--theme-color)]/20 rounded-2xl flex items-center justify-center mb-6 border border-[var(--theme-color)]/30">
            <SettingsIcon className="w-8 h-8 text-[var(--theme-color)]" />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-8">Settings</h2>

          <div className="space-y-8">
            {/* Theme Color */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-200">Theme Color</h3>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setThemeColor(color.value)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                      themeColor === color.value ? 'ring-2 ring-white scale-110' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-dashed border-gray-600 hover:border-gray-400 transition-colors">
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="absolute inset-[-10px] w-20 h-20 cursor-pointer opacity-0"
                    title="Custom Color"
                  />
                  <div 
                    className="w-full h-full" 
                    style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-800" />

            {/* Toggles */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center border border-gray-800">
                    <MousePointer2 className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-200">Mouse Trail</h3>
                    <p className="text-sm text-gray-500">Show a colorful trail behind your cursor</p>
                  </div>
                </div>
                <button
                  onClick={() => setMouseTrailEnabled(!mouseTrailEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:ring-offset-2 focus:ring-offset-[#141414] ${
                    mouseTrailEnabled ? 'bg-[var(--theme-color)]' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      mouseTrailEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center border border-gray-800">
                    <Monitor className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-200">CRT Effect</h3>
                    <p className="text-sm text-gray-500">Add retro scanlines and screen curvature</p>
                  </div>
                </div>
                <button
                  onClick={() => setCrtEnabled(!crtEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)] focus:ring-offset-2 focus:ring-offset-[#141414] ${
                    crtEnabled ? 'bg-[var(--theme-color)]' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      crtEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center border border-gray-800">
                    <MousePointer2 className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-200">Custom Cursor</h3>
                    <p className="text-sm text-gray-500">Upload an image to use as your cursor</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {customCursor && (
                    <button
                      onClick={clearCustomCursor}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors bg-gray-900 rounded-lg border border-gray-800 hover:border-red-500/30"
                      title="Clear custom cursor"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-[var(--theme-color)]/50 rounded-lg text-sm font-medium text-gray-300 transition-all duration-200"
                  >
                    <Upload className="w-4 h-4" />
                    {customCursor ? 'Change' : 'Upload'}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleCursorUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
