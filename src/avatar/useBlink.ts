import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface BlinkConfig {
  head: THREE.Mesh | undefined;
  eyeLeft?: THREE.Mesh;
  eyeRight?: THREE.Mesh;
}

export function useBlink({ head, eyeLeft, eyeRight }: BlinkConfig) {
  const blinkTimer = useRef(0);
  const nextBlinkTime = useRef(Math.random() * 3 + 2); // 2–5 sec
  const isBlinking = useRef(false);
  const blinkDuration = 0.06; // 60ms

  useFrame((state, delta) => {
    let hasMorphs = false;
    let leftIndex: number | undefined;
    let rightIndex: number | undefined;

    if (head && head.morphTargetDictionary && head.morphTargetInfluences) {
      leftIndex = head.morphTargetDictionary["eyeBlinkLeft"];
      rightIndex = head.morphTargetDictionary["eyeBlinkRight"];
      if (leftIndex !== undefined && rightIndex !== undefined) {
        hasMorphs = true;
      }
    }

    // If no morphs AND no separate eyes, we can't blink.
    if (!hasMorphs && (!eyeLeft || !eyeRight)) {
      return;
    }

    blinkTimer.current += delta;

    // Start blink
    if (!isBlinking.current && blinkTimer.current >= nextBlinkTime.current) {
      isBlinking.current = true;
      blinkTimer.current = 0;
    }

    // While blinking
    if (isBlinking.current) {
      if (
        hasMorphs &&
        head &&
        leftIndex !== undefined &&
        rightIndex !== undefined
      ) {
        // Snap close for immediate visibility (replaces lerp)
        head.morphTargetInfluences![leftIndex] = 1;
        head.morphTargetInfluences![rightIndex] = 1;
      } else if (eyeLeft && eyeRight) {
        // Fallback: Scale down eyes on Y axis
        eyeLeft.scale.y = 0.1;
        eyeRight.scale.y = 0.1;
      }

      if (blinkTimer.current >= blinkDuration) {
        isBlinking.current = false;
        blinkTimer.current = 0;
        nextBlinkTime.current = Math.random() * 3 + 2;
      }
    } else {
      // Open eyes
      if (
        hasMorphs &&
        head &&
        leftIndex !== undefined &&
        rightIndex !== undefined
      ) {
        // Smoothly open eyes (slower lerp for natural feel)
        if (head.morphTargetInfluences) {
          head.morphTargetInfluences[leftIndex] = THREE.MathUtils.lerp(
            head.morphTargetInfluences[leftIndex],
            0,
            0.35,
          );
          head.morphTargetInfluences[rightIndex] = THREE.MathUtils.lerp(
            head.morphTargetInfluences[rightIndex],
            0,
            0.35,
          );
        }
      } else if (eyeLeft && eyeRight) {
        // Smoothly scale back to 1
        eyeLeft.scale.y = THREE.MathUtils.lerp(eyeLeft.scale.y, 1, 0.35);
        eyeRight.scale.y = THREE.MathUtils.lerp(eyeRight.scale.y, 1, 0.35);
      }
    }
  });
}
