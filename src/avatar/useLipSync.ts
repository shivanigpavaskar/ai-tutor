import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const lerp = THREE.MathUtils.lerp;

export const useLipSync = (
  analyser: AnalyserNode | null,
  headMesh: THREE.Mesh | null | undefined,
  isPlaying: boolean,
) => {
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  useFrame((state) => {
    if (!headMesh || !analyser) return;

    if (!dataArrayRef.current) {
      dataArrayRef.current = new Uint8Array<ArrayBuffer>(
        new ArrayBuffer(analyser.fftSize),
      );
    }

    const meshAny = headMesh as any;

    if (!meshAny?.morphTargetDictionary || !meshAny?.morphTargetInfluences)
      return;

    const morphs = meshAny.morphTargetDictionary;
    const influences = meshAny.morphTargetInfluences;

    const visemeIndex =
      morphs["viseme_aa"] ?? morphs["mouthOpen"] ?? morphs["jawOpen"];

    if (visemeIndex === undefined) return;

    // 🔥 If audio stopped → close mouth smoothly
    if (!isPlaying) {
      influences[visemeIndex] = lerp(influences[visemeIndex], 0, 0.2);
      return;
    }

    analyser.getByteTimeDomainData(dataArrayRef.current);

    let sum = 0;
    const length = dataArrayRef.current.length;

    for (let i = 0; i < length; i++) {
      const value = (dataArrayRef.current[i] - 128) / 128;
      sum += value * value;
    }

    const rms = Math.sqrt(sum / length);
    const volume = Math.min(1, rms * 4);

    influences[visemeIndex] = lerp(influences[visemeIndex], volume, 0.5);

    // Optional subtle head motion
    const meshWithSkeleton = headMesh as any;

    if (meshWithSkeleton?.skeleton?.bones) {
      const headBone = meshWithSkeleton.skeleton.bones.find(
        (b: THREE.Bone) => b.name === "Head",
      );

      if (headBone) {
        const time = state.clock.getElapsedTime();

        headBone.rotation.y = lerp(
          headBone.rotation.y,
          Math.sin(time * 0.5) * 0.05,
          0.1,
        );

        headBone.rotation.x = lerp(
          headBone.rotation.x,
          Math.sin(time * 0.3) * 0.02,
          0.1,
        );
      }
    }
  });
};
