import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { SUPPORTED_COUNTRIES } from '../data/mockData';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  Volume2, 
  VolumeX, 
  SwitchCamera, 
  ShieldAlert, 
  Ban, 
  Sparkles, 
  Clock, 
  Coins, 
  Crown,
  AlertCircle
} from 'lucide-react';

export const VideoCallModal: React.FC = () => {
  const { 
    activeCall, 
    endActiveCall, 
    toggleMute, 
    toggleVideo, 
    toggleSpeaker, 
    toggleCameraFlip, 
    extendCallWithCoins, 
    extendCallWithPremium, 
    openRewardedAd,
    coins,
    currentUser,
    setReportModalUser,
    blockUser,
    setPremiumModalOpen
  } = useApp();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [simulatedAudioLevel, setSimulatedAudioLevel] = useState(40);

  const peer = activeCall?.peer;

  // Initialize real user webcam via navigator.mediaDevices.getUserMedia
  useEffect(() => {
    if (!activeCall) return;

    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: activeCall.isFrontCam ? 'user' : 'environment' },
          audio: true,
        });
        currentStream = stream;
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setCameraError(null);
      } catch (err: any) {
        console.warn('Webcam permission not granted or device missing:', err);
        setCameraError('Camera access not granted or not available.');
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [activeCall?.isFrontCam]);

  // Handle Mute & Video toggles on real track
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => {
        t.enabled = !activeCall?.isMuted;
      });
      localStream.getVideoTracks().forEach(t => {
        t.enabled = !activeCall?.isVideoOff;
      });
    }
  }, [activeCall?.isMuted, activeCall?.isVideoOff, localStream]);

  // Animated audio level for realistic call feedback
  useEffect(() => {
    if (activeCall?.state !== 'connected' || activeCall?.isCallPausedDueToTimer) return;
    const interval = setInterval(() => {
      setSimulatedAudioLevel(Math.floor(Math.random() * 50) + 30);
    }, 400);
    return () => clearInterval(interval);
  }, [activeCall?.state, activeCall?.isCallPausedDueToTimer]);

  if (!activeCall || !peer) return null;

  const countryInfo = SUPPORTED_COUNTRIES.find(c => c.name === peer.country);

  // Format call duration MM:SS
  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSpendCoinsForTime = () => {
    const success = extendCallWithCoins();
    if (!success) {
      alert('Not enough coins! Watch a quick ad to get +50 free coins.');
    }
  };

  return (
    <div id="video-call-modal-overlay" className="fixed inset-0 z-50 bg-neutral-950 flex flex-col justify-between overflow-hidden select-none">
      
      {/* Background / Peer Video Feed */}
      <div className="absolute inset-0 z-0">
        {activeCall.state === 'connected' ? (
          <div className="relative w-full h-full bg-neutral-950 flex items-center justify-center overflow-hidden">
            {/* Ambient High Definition Peer Video Background */}
            <img
              src={peer.avatar}
              alt={peer.name}
              className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.05] scale-105 transition duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/80 via-transparent to-neutral-950/90 pointer-events-none"></div>

            {/* Simulated Live Calling Indicator Badge */}
            <div className="absolute top-20 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-800 flex items-center space-x-2 text-xs text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-semibold">{peer.name}</span>
              <span className="text-neutral-400">({formatDuration(activeCall.duration)})</span>
            </div>

            {/* Peer Audio Waveform */}
            <div className="absolute top-20 right-4 flex items-center space-x-1 bg-black/60 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-neutral-800">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <div className="flex items-center space-x-0.5 h-3">
                <span className="w-1 bg-emerald-400 rounded-full transition-all" style={{ height: `${simulatedAudioLevel}%` }}></span>
                <span className="w-1 bg-emerald-400 rounded-full transition-all" style={{ height: `${Math.max(20, simulatedAudioLevel - 20)}%` }}></span>
                <span className="w-1 bg-emerald-400 rounded-full transition-all" style={{ height: `${Math.min(100, simulatedAudioLevel + 20)}%` }}></span>
              </div>
            </div>
          </div>
        ) : (
          /* Ringing / Calling Screen */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-neutral-900 to-neutral-950 text-center space-y-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 animate-pulse">
                <img
                  src={peer.avatar}
                  alt={peer.name}
                  className="w-full h-full rounded-full object-cover border-4 border-neutral-950"
                />
              </div>
              <span className="absolute -bottom-2 right-6 bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow">
                15s Free Trial
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">{peer.name}</h2>
              <p className="text-xs text-neutral-400 mt-1 flex items-center justify-center space-x-1">
                <span>{countryInfo?.flag} {peer.country}</span>
                <span>•</span>
                <span>{peer.language}</span>
              </p>
              <div className="inline-flex items-center space-x-2 text-rose-400 font-semibold text-xs mt-4 bg-rose-950/40 border border-rose-900/50 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>Connecting 1-to-1 Video Stream...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Picture-in-Picture Local User Video Stream (Bottom-Right or Top-Right) */}
      <div className="absolute top-4 right-4 z-20 w-28 sm:w-36 aspect-[3/4] bg-neutral-900 rounded-2xl overflow-hidden border-2 border-neutral-700 shadow-2xl">
        {!activeCall.isVideoOff && !cameraError ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${activeCall.isFrontCam ? '-scale-x-100' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-neutral-900 text-center">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover mb-1 border border-neutral-700"
            />
            <span className="text-[9px] text-neutral-400">
              {activeCall.isVideoOff ? 'Camera Off' : 'Virtual Mirror'}
            </span>
          </div>
        )}
        <span className="absolute bottom-1 left-2 text-[9px] bg-black/60 px-1.5 py-0.5 rounded text-white font-medium">
          You
        </span>
      </div>

      {/* Top Header Controls: 15-second Free Timer Countdown & Safety */}
      <header className="relative z-10 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Free Call Timer Badge */}
          {activeCall.isFreeTrial ? (
            <div className="flex items-center space-x-2 bg-rose-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-lg border border-rose-400/40 animate-pulse">
              <Clock className="w-3.5 h-3.5 text-amber-200" />
              <span className="text-xs font-bold tracking-wide">
                Free Trial: {activeCall.freeTrialRemaining}s left
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full Video Call</span>
            </div>
          )}
        </div>

        {/* Quick Safety Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setReportModalUser(peer)}
            className="p-2 bg-black/50 hover:bg-black/70 text-neutral-300 hover:text-amber-400 rounded-full border border-neutral-800 backdrop-blur-md transition"
            title="Report during call"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (window.confirm(`Block ${peer.name} and end call immediately?`)) {
                blockUser(peer.id);
                endActiveCall();
              }
            }}
            className="p-2 bg-black/50 hover:bg-black/70 text-neutral-300 hover:text-rose-400 rounded-full border border-neutral-800 backdrop-blur-md transition"
            title="Block and end call"
          >
            <Ban className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* PAUSE / FREE TRIAL ENDED DIALOG OVERLAY (Section 10 & 11) */}
      {activeCall.isCallPausedDueToTimer && (
        <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 mx-auto mb-4 flex items-center justify-center">
              <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
                <Clock className="w-7 h-7 text-rose-500" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-1">
              Free 15s Video Call Ended!
            </h3>
            <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
              Continue your 1-to-1 conversation with <strong className="text-white">{peer.name}</strong> using Coins or unlock unlimited time with Premium.
            </p>

            <div className="space-y-2.5">
              {/* Option 2: Watch Ad & Earn Coins to Continue */}
              <button
                id="btn-call-watch-ad-continue"
                onClick={() => openRewardedAd('call_extension')}
                className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 flex items-center justify-center space-x-2 transition active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Watch Ad → Earn +10 Coins & Resume (+60s)</span>
              </button>

              {/* Option 2B: Spend 20 Coins if user has coins */}
              <button
                id="btn-call-spend-coins-continue"
                onClick={handleSpendCoinsForTime}
                className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 transition border border-neutral-750"
              >
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Use 20 Coins for +60s (Balance: {coins})</span>
              </button>

              {/* Option 1: Upgrade to Premium */}
              <button
                id="btn-call-premium-continue"
                onClick={() => setPremiumModalOpen(true)}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer active:scale-95"
              >
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Upgrade to VIP Premium (Unlimited Time)</span>
              </button>

              {/* Leave Call */}
              <button
                id="btn-call-end-from-dialog"
                onClick={endActiveCall}
                className="w-full py-2 text-xs text-neutral-400 hover:text-white transition pt-2"
              >
                End Call Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Control Bar (Mute, Cam, Flip, Speaker, End) */}
      <footer className="relative z-10 p-5 pb-8 flex items-center justify-center space-x-3 sm:space-x-4">
        {/* Flip Camera */}
        <button
          id="btn-call-flip-cam"
          onClick={toggleCameraFlip}
          className="p-3.5 bg-neutral-900/80 hover:bg-neutral-800 text-white rounded-2xl border border-neutral-800 backdrop-blur-md transition active:scale-95"
          title="Flip camera"
        >
          <SwitchCamera className="w-5 h-5" />
        </button>

        {/* Video On / Off */}
        <button
          id="btn-call-toggle-video"
          onClick={toggleVideo}
          className={`p-3.5 rounded-2xl border backdrop-blur-md transition active:scale-95 ${
            activeCall.isVideoOff
              ? 'bg-rose-950/80 border-rose-800 text-rose-400'
              : 'bg-neutral-900/80 border-neutral-800 text-white hover:bg-neutral-800'
          }`}
          title={activeCall.isVideoOff ? 'Enable camera' : 'Disable camera'}
        >
          {activeCall.isVideoOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
        </button>

        {/* End Call Button */}
        <button
          id="btn-call-end-main"
          onClick={endActiveCall}
          className="p-4 bg-rose-600 hover:bg-rose-500 text-white rounded-3xl shadow-xl shadow-rose-600/30 transition active:scale-95"
          title="End Video Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>

        {/* Mic On / Off */}
        <button
          id="btn-call-toggle-mic"
          onClick={toggleMute}
          className={`p-3.5 rounded-2xl border backdrop-blur-md transition active:scale-95 ${
            activeCall.isMuted
              ? 'bg-rose-950/80 border-rose-800 text-rose-400'
              : 'bg-neutral-900/80 border-neutral-800 text-white hover:bg-neutral-800'
          }`}
          title={activeCall.isMuted ? 'Unmute' : 'Mute mic'}
        >
          {activeCall.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Speaker On / Off */}
        <button
          id="btn-call-toggle-speaker"
          onClick={toggleSpeaker}
          className={`p-3.5 rounded-2xl border backdrop-blur-md transition active:scale-95 ${
            !activeCall.isSpeakerOn
              ? 'bg-neutral-800 border-neutral-700 text-neutral-400'
              : 'bg-neutral-900/80 border-neutral-800 text-white hover:bg-neutral-800'
          }`}
          title={activeCall.isSpeakerOn ? 'Mute speaker' : 'Enable speaker'}
        >
          {activeCall.isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </footer>
    </div>
  );
};
