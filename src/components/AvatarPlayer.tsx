import React, { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows, OrbitControls } from "@react-three/drei";
import Avatar from "../avatar/Avatar";
import { VOICE_MAP } from "../avatar/types";
import { useAudioEngine } from "../avatar/useAudioEngine";

interface Props {
  text: string;
  audioBase64?: string | null;
  language: keyof typeof VOICE_MAP;
  gender?: "male" | "female";
  rate?: string;
  onEnded?: () => void;
}

const AvatarPlayer: React.FC<Props> = ({
  text,
  audioBase64,
  language,
  gender = "female",
  rate = "+0%",
  onEnded,
}) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentVoice, setCurrentVoice] = useState(
    VOICE_MAP[language]?.[gender] || VOICE_MAP["en"]["female"],
  );

  const { analyser, isPlaying } = useAudioEngine(audioUrl);

  const previousPlayingRef = useRef<boolean>(false);

  // Update voice when language/gender changes
  useEffect(() => {
    if (VOICE_MAP[language]?.[gender]) {
      setCurrentVoice(VOICE_MAP[language][gender]);
    }
  }, [language, gender]);

  // Convert base64 to audio URL
  useEffect(() => {
    if (!audioBase64) return;

    const url = `data:audio/mpeg;base64,${audioBase64}`;
    setAudioUrl(url);
  }, [audioBase64]);

  // 🔥 VERY IMPORTANT: Detect audio finish properly
  useEffect(() => {
    // If it was playing before and now stopped → audio finished
    if (previousPlayingRef.current && !isPlaying) {
      if (onEnded) {
        onEnded();
      }
    }

    previousPlayingRef.current = isPlaying;
  }, [isPlaying, onEnded]);

  return (
    <div className="w-full h-[600px] bg-slate-50 rounded-xl overflow-hidden shadow-lg border border-slate-200">
      <Canvas camera={{ position: [0, 0, 0.7], fov: 50 }} shadows>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
        <Environment preset="city" />

        <Avatar analyser={analyser} isPlaying={isPlaying} />

        <ContactShadows
          opacity={0.4}
          scale={10}
          blur={2.5}
          far={4}
          resolution={256}
        />

        <OrbitControls
          minPolarAngle={Math.PI / 2.5}
          maxPolarAngle={Math.PI / 1.8}
          enableZoom={false}
        />
      </Canvas>
    </div>
  );
};

export default AvatarPlayer;
