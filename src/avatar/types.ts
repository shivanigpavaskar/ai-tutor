import type { ThreeElements } from "@react-three/fiber";

/**
 * Configuration for supported languages and their corresponding Edge TTS voices.
 */
export type Gender = "male" | "female";

/**
 * Configuration for supported languages and their corresponding Edge TTS voices.
 */
export const VOICE_MAP: Record<string, Record<Gender, string>> = {
  en: {
    female: "en-US-JennyNeural",
    male: "en-US-GuyNeural",
  },
  ar: {
    female: "ar-SA-ZariyahNeural",
    male: "ar-SA-HamedNeural",
  },
  hi: {
    female: "hi-IN-SwaraNeural",
    male: "hi-IN-MadhurNeural",
  },
  es: {
    female: "es-ES-ElviraNeural",
    male: "es-ES-AlvaroNeural",
  },
  fr: {
    female: "fr-FR-DeniseNeural",
    male: "fr-FR-HenriNeural",
  },
  ja: {
    female: "ja-JP-NanamiNeural",
    male: "ja-JP-KeitaNeural",
  },
};

/**
 * Props for the AvatarPlayer component.
 */
export interface AvatarPlayerProps {
  text: string;
  language: keyof typeof VOICE_MAP;
  gender?: Gender;
  rate?: string;
  analyser: AnalyserNode | null;
  play: (url: string) => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
}

/**
 * Interface for the Audio Engine return value.
 */
export interface AudioEngine {
  play: (audioUrl: string) => Promise<void>;
  stop: () => void;
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

/**
 * Props for the 3D Avatar component.
 */
export interface Avatar3DProps {
  analyser: AnalyserNode | null;
  url?: string;
  isPlaying: boolean;
}

// Augment JSX.IntrinsicElements to include React Three Fiber elements
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
