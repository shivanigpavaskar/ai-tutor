import { useRef, useState, useEffect } from "react";

export const useAudioEngine = (audioUrl: string | null) => {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Create audio + context once
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.crossOrigin = "anonymous";

    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;

    audioContextRef.current = new AudioContextClass();

    const analyserNode = audioContextRef.current.createAnalyser();
    analyserNode.fftSize = 512;
    analyserNode.smoothingTimeConstant = 0.6;

    setAnalyser(analyserNode);

    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // 🔥 Auto play when audioUrl changes
  useEffect(() => {
    if (!audioUrl || !audioRef.current || !audioContextRef.current || !analyser)
      return;

    const audio = audioRef.current;

    audio.src = audioUrl;

    if (!sourceRef.current) {
      sourceRef.current =
        audioContextRef.current.createMediaElementSource(audio);

      sourceRef.current.connect(analyser);
      analyser.connect(audioContextRef.current.destination);
    }

    audioContextRef.current.resume();

    audio.play().then(() => {
      setIsPlaying(true);
    });

    audio.onended = () => {
      setIsPlaying(false);
    };
  }, [audioUrl, analyser]);

  return {
    analyser,
    isPlaying,
  };
};
