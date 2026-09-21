import React, { useState, useRef, useEffect } from 'react';
import { Mic, Trash2, Send, AlertCircle, RefreshCw, Upload, Sparkles, X } from 'lucide-react';

interface VoiceNoteRecorderProps {
  onSendVoiceNote: (audioData: string, durationSec: number) => void;
  onCancel: () => void;
}

export const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  onSendVoiceNote,
  onCancel,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    startRecording();

    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore stop error on teardown
      }
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => track.stop());
      } catch {
        // Ignore track stop errors
      }
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      setErrorMsg(null);
      audioChunksRef.current = [];

      if (!navigator?.mediaDevices?.getUserMedia) {
        setErrorMsg('Microphone access is not available in this browser window. You can upload an audio note or send a sample memo instead.');
        setIsRecording(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Detect best supported MIME type
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported('audio/webm')) {
          if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
            mimeType = 'audio/ogg';
          } else {
            mimeType = '';
          }
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // chunk every 100ms
      setIsRecording(true);
      setSeconds(0);

      timerRef.current = window.setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      // Use console.warn to avoid triggering uncaught runtime error reports
      console.warn('Microphone permission or device access was declined:', err?.message || err);
      const isPermissionDenied = 
        err?.name === 'NotAllowedError' || 
        err?.name === 'PermissionDeniedError' || 
        (err?.message && /denied|permission/i.test(err.message));

      if (isPermissionDenied) {
        setErrorMsg('Microphone permission was blocked or denied in this preview frame. Please grant microphone permission in your browser or select an audio alternative below.');
      } else {
        setErrorMsg(err?.message || 'Unable to access microphone. Please select an audio alternative below.');
      }
      setIsRecording(false);
    }
  };

  const handleStopAndSend = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;

    const recordedDuration = Math.max(1, seconds);

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: mediaRecorderRef.current?.mimeType || 'audio/webm',
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        onSendVoiceNote(base64Data, recordedDuration);
        cleanup();
      };
      reader.readAsDataURL(audioBlob);
    };

    try {
      mediaRecorderRef.current.stop();
    } catch {
      cleanup();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleCancelRecording = () => {
    cleanup();
    onCancel();
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      onSendVoiceNote(base64Data, 5); // Approximate 5s duration for custom audio
      cleanup();
    };
    reader.readAsDataURL(file);
  };

  // Generates a clean synthetic audio memo (PCM WAV) so the user can test voice notes even when microphone is blocked
  const handleSendSampleMemo = () => {
    try {
      const sampleRate = 8000;
      const durationSec = 3;
      const numSamples = sampleRate * durationSec;
      const buffer = new ArrayBuffer(44 + numSamples * 2);
      const view = new DataView(buffer);

      // WAV Header
      const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
          view.setUint8(offset + i, str.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, 36 + numSamples * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true); // PCM chunk size
      view.setUint16(20, 1, true);  // Audio format 1 = PCM
      view.setUint16(22, 1, true);  // 1 channel (mono)
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true); // byte rate
      view.setUint16(32, 2, true);  // block align
      view.setUint16(34, 16, true); // bits per sample
      writeString(36, 'data');
      view.setUint32(40, numSamples * 2, true);

      // Simple pleasant chime tone sequence (440Hz -> 554Hz -> 659Hz)
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        let freq = 440;
        if (t > 1.0) freq = 554.37;
        if (t > 2.0) freq = 659.25;
        const sample = Math.sin(2 * Math.PI * freq * t) * 0.3 * Math.exp(-((t % 1.0) * 2));
        view.setInt16(44 + i * 2, sample < 0 ? sample * 32768 : sample * 32767, true);
      }

      const blob = new Blob([view], { type: 'audio/wav' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        onSendVoiceNote(base64Data, durationSec);
        cleanup();
      };
      reader.readAsDataURL(blob);
    } catch {
      cleanup();
      onCancel();
    }
  };

  const formatTimer = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  if (errorMsg) {
    return (
      <div className="p-3 bg-[#131b2e] border border-amber-500/40 rounded-xl text-xs space-y-2.5 animate-in fade-in duration-200">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span className="leading-snug text-[11px]">{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={handleCancelRecording}
            className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden File Input for Audio upload */}
        <input
          ref={audioFileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleAudioFileUpload}
        />

        {/* Alternatives Action Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800">
          <button
            type="button"
            onClick={() => startRecording()}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-semibold transition cursor-pointer border border-slate-700"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry Permission</span>
          </button>

          <button
            type="button"
            onClick={() => audioFileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-lg text-[11px] font-semibold transition cursor-pointer border border-blue-500/40"
          >
            <Upload className="w-3 h-3" />
            <span>Upload Audio File</span>
          </button>

          <button
            type="button"
            onClick={handleSendSampleMemo}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-[11px] font-semibold transition cursor-pointer border border-emerald-500/40"
          >
            <Sparkles className="w-3 h-3" />
            <span>Send Sample Voice Memo</span>
          </button>

          <button
            type="button"
            onClick={handleCancelRecording}
            className="ml-auto px-2 py-1 text-slate-400 hover:text-white text-[11px] transition cursor-pointer"
          >
            Type Instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 p-2 bg-[#121929] border border-amber-500/40 rounded-xl shadow-lg animate-in fade-in duration-200">
      {/* Recording Indicator & Timer */}
      <div className="flex items-center gap-2.5 pl-1">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
        </span>
        <span className="text-xs font-mono font-bold text-white tracking-wider">
          {formatTimer(seconds)}
        </span>
        <span className="text-[11px] text-amber-300 hidden sm:inline animate-pulse">
          Recording voice note...
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleCancelRecording}
          title="Cancel recording"
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleStopAndSend}
          title="Send voice note"
          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
        >
          <Send className="w-3.5 h-3.5 fill-current" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};
