import Chat from "./components/chat";

export default function App() {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      <div 
        data-tauri-drag-region 
        className="h-10 bg-black/20 backdrop-blur-sm flex items-center px-4 text-gray-300 select-none border-b border-white/5"
      >
        <span className="text-blue-400 font-semibold">Syn</span>
        <span className="font-semibold">apse</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <Chat />
      </div>
    </div>
  );
}
