import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface VoiceNotePlayerProps {
  audioData: string; // Base64 data URI or URL
  durationSec: number;
  isUserMessage?: boolean;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  audioData,
  durationSec,
  isUserMessage = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(durationSec || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioData);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setAudioDuration(Math.round(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(Math.round(audio.currentTime));
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioData]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.warn('Audio playback notice:', err?.message || err);
          setIsPlaying(false);
        });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatSec = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Waveform amplitude spectrum bars
  const bars = [40, 75, 55, 90, 60, 45, 80, 100, 65, 50, 70, 85, 45, 60, 95, 70, 50, 85, 65, 40];

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-xl text-xs select-none ${
      isUserMessage 
        ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-100' 
        : 'bg-[#111726]/80 border border-slate-700/80 text-slate-200'
    }`}>
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition shrink-0 shadow-md ${
          isUserMessage
            ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
            : 'bg-indigo-600 text-white hover:bg-indigo-500'
        }`}
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform & Progress */}
      <div className="flex-1 min-w-[140px] flex flex-col justify-center gap-1.5">
        <div className="flex items-center gap-0.5 h-6">
          {bars.map((h, i) => {
            const barProgress = i / bars.length;
            const currentProgress = audioDuration > 0 ? currentTime / audioDuration : 0;
            const isFilled = barProgress <= currentProgress;
            return (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={`flex-1 rounded-full transition-all duration-150 ${
                  isFilled
                    ? (isUserMessage ? 'bg-emerald-400' : 'bg-indigo-400')
                    : (isUserMessage ? 'bg-emerald-800/40' : 'bg-slate-700/60')
                } ${isPlaying && isFilled ? 'scale-y-110' : ''}`}
              />
            );
          })}
        </div>

        {/* Seek track (invisible slider over waveform or simple timestamp) */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-slate-400" />
            <span>{formatSec(currentTime)} / {formatSec(audioDuration || durationSec)}</span>
          </span>
          <span className="uppercase text-[9px] tracking-wider opacity-75">Voice Note</span>
        </div>
      </div>
    </div>
  );
};
