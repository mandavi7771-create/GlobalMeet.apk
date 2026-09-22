import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SUPPORTED_COUNTRIES } from '../data/mockData';
import { 
  ArrowLeft, 
  Video, 
  Send, 
  Image as ImageIcon, 
  Camera, 
  Smile, 
  ShieldAlert, 
  MoreVertical, 
  Check, 
  CheckCheck, 
  X,
  AlertTriangle 
} from 'lucide-react';

const COMMON_EMOJIS = ['😊', '👋', '❤️', '🔥', '✨', '🌍', '☕', '🎉', '✈️', '📸', '👍', '🙏'];

export const ChatScreen: React.FC = () => {
  const { 
    activeChatUser, 
    closeChat, 
    messages, 
    sendMessage, 
    startVideoCall, 
    setReportModalUser, 
    blockUser,
    currentUser
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const peer = activeChatUser;
  const peerMessages = peer ? (messages[peer.id] || []) : [];

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [peerMessages]);

  // Clean up camera stream if closed
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [cameraStream]);

  if (!peer) return null;

  const countryInfo = SUPPORTED_COUNTRIES.find(c => c.name === peer.country);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(peer.id, inputText.trim());
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText(prev => prev + emoji);
  };

  // Image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Url = uploadEvent.target?.result as string;
        sendMessage(peer.id, undefined, base64Url);
      };
      reader.readAsDataURL(file);
    }
  };

  // Camera Snapshot capture
  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Unable to access camera for snapshot: ' + err);
    }
  };

  const handleCapturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        sendMessage(peer.id, '📷 Photo snapshot', dataUrl);
      }
    }
    // Stop camera
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const handleCancelCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  return (
    <div id="chat-screen-view" className="fixed inset-0 z-50 bg-neutral-950 flex flex-col">
      {/* Chat Header */}
      <header className="bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 px-3 sm:px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <button
            id="btn-chat-back"
            onClick={closeChat}
            className="p-1.5 -ml-1 text-neutral-400 hover:text-white rounded-full transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative cursor-pointer" onClick={() => {}}>
            <img
              src={peer.avatar}
              alt={peer.name}
              className="w-10 h-10 rounded-full object-cover bg-neutral-800"
            />
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-neutral-900 ${
              peer.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'
            }`}></span>
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="text-xs font-bold text-white leading-tight">{peer.name}</h3>
              <span className="text-xs">{countryInfo?.flag}</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-tight">
              {peer.status === 'online' ? '🟢 Online now' : '⚪ Active recently'} • {peer.language}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center space-x-1">
          <button
            id="btn-chat-call"
            onClick={() => startVideoCall(peer)}
            className="flex items-center space-x-1.5 py-1.5 px-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
            title="Video Call"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Call (15s)</span>
          </button>

          {/* More options dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(prev => !prev)}
              className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 w-44 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl py-1.5 z-20">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setReportModalUser(peer);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-amber-300 hover:bg-neutral-800 flex items-center space-x-2"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Report User</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    if (window.confirm(`Block ${peer.name}?`)) blockUser(peer.id);
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-rose-400 hover:bg-neutral-800 flex items-center space-x-2"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Block User</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Safety Guideline Banner */}
      <div className="bg-neutral-900/60 border-b border-neutral-800/60 px-4 py-1.5 text-center flex items-center justify-center space-x-2 text-[11px] text-neutral-400">
        <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
        <span>End-to-end encrypted private chat. Keep chats friendly & respectful (18+ strictly enforced).</span>
      </div>

      {/* Camera Snapshot Modal Overlay if active */}
      {isCameraActive && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden p-4 text-center space-y-3">
            <h4 className="text-xs font-semibold text-white">Capture Photo for Chat</h4>
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={handleCancelCamera}
                className="py-2 px-4 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-medium hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCapturePhoto}
                className="py-2 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow flex items-center space-x-1"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Snap & Send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages List Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Profile Card greeting */}
        <div className="text-center my-4 space-y-1">
          <img
            src={peer.avatar}
            alt={peer.name}
            className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-neutral-800"
          />
          <h4 className="text-xs font-bold text-white">{peer.name}</h4>
          <p className="text-[11px] text-neutral-400">
            {countryInfo?.flag} {peer.country} • Speaks {peer.languagesSpoken.join(', ')}
          </p>
          <p className="text-[11px] text-neutral-500 max-w-xs mx-auto pt-1">
            "{peer.bio}"
          </p>
        </div>

        {peerMessages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[78%] sm:max-w-md rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                  isMe
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-br-none'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-bl-none'
                }`}
              >
                {/* Optional attached image */}
                {msg.imageUrl && (
                  <img
                    src={msg.imageUrl}
                    alt="shared media"
                    className="w-full max-h-60 object-cover rounded-xl mb-1.5 border border-neutral-800/40 bg-black/40"
                  />
                )}
                {msg.text && <div>{msg.text}</div>}
              </div>

              {/* Timestamp & status ticks */}
              <div className="flex items-center space-x-1 text-[10px] text-neutral-500 mt-1 px-1">
                <span>{msg.timestamp}</span>
                {isMe && (
                  <span>
                    {msg.status === 'read' ? (
                      <CheckCheck className="w-3.5 h-3.5 text-blue-400 inline" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-neutral-400 inline" />
                    )}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker Bar */}
      {showEmojiPicker && (
        <div className="bg-neutral-900 border-t border-neutral-800 p-2 flex items-center space-x-2 overflow-x-auto scrollbar-none">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="text-lg p-1.5 hover:bg-neutral-800 rounded-lg transition"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <footer className="bg-neutral-900 border-t border-neutral-800 p-3">
        <form onSubmit={handleSend} className="flex items-center space-x-2 max-w-5xl mx-auto">
          {/* Media Attachments Buttons */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
            title="Upload photo"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleStartCamera}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
            title="Snap Camera Photo"
          >
            <Camera className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setShowEmojiPicker(prev => !prev)}
            className={`p-2 rounded-xl transition ${
              showEmojiPicker ? 'text-rose-500 bg-neutral-800' : 'text-neutral-400 hover:text-white'
            }`}
            title="Insert emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            id="chat-message-input"
            placeholder={`Message ${peer.name.split(' ')[0]}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`p-2.5 rounded-2xl transition duration-150 ${
              inputText.trim()
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 active:scale-95'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>
    </div>
  );
};
