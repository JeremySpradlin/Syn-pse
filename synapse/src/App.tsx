import Chat from "./components/chat";
import { Settings } from 'lucide-react';
import { useState } from 'react';
import SettingsModal from "./components/settings/SettingsModal";

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      <div 
        data-tauri-drag-region 
        className="h-10 bg-black/20 backdrop-blur-sm flex items-center justify-between px-4 text-gray-300 select-none border-b border-white/5"
      >
        <div className="flex items-center">
          <span className="text-blue-400 font-semibold">Syn</span>
          <span className="font-semibold">@pse</span>
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-1.5 hover:bg-white/5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <Settings className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <Chat />
      </div>
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}
