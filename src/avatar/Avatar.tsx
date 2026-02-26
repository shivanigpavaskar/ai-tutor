import React, { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useGraph } from "@react-three/fiber";
import { SkeletonUtils } from "three-stdlib";
import { useLipSync } from "../avatar/useLipSync";
import { useBlink } from "../avatar/useBlink";
import type { Avatar3DProps } from "../avatar/types";
import * as THREE from "three";
import avatarUrl from "../assets/avatar.glb";

// Define constants outside to avoid re-creation and duplication
// const DEFAULT_MODEL = "https://models.readyplayer.me/6992e2123781699417c34b13.glb";
const DEFAULT_MODEL = avatarUrl;

// Helper to get URL (handles env var)
const getAvatarUrl = (propUrl?: string) => {
  return DEFAULT_MODEL;
  // propUrl || import.meta.env.VITE_DEFAULT_AVATAR_URL ||
};

/**
 * Avatar
 * Renders the GLB model and applies lip-sync logic.
 */
const Avatar: React.FC<Avatar3DProps> = ({ analyser, url,isPlaying }) => {
  const modelUrl = getAvatarUrl(url);
  const { scene } = useGLTF(modelUrl);

  // Clone the scene to avoid mutating the cached GLTF object.
  // We use SkeletonUtils.clone() because standard scene.clone()
  // does not correctly clone SkinnedMeshes (bones relationships break).
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  // useGraph creates a reactive graph of the cloned scene,
  // giving us access to nodes and materials if needed.s
  const { nodes } = useGraph(clone);

  // Find the mesh that actually has the morph targets (specifically for blinking)
  // Find the mesh that actually has the morph targets (specifically for blinking)
  // OR find the separate Eye meshes if morphs are missing.
  const { headMesh, eyeLeft, eyeRight } = useMemo(() => {
    let morphMesh: THREE.Mesh | undefined = undefined;
    let leftEye: THREE.Mesh | undefined = undefined;
    let rightEye: THREE.Mesh | undefined = undefined;

    console.log("Searching for blink targets...");

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;

        if (mesh.name === "EyeLeft") leftEye = mesh;
        if (mesh.name === "EyeRight") rightEye = mesh;

        // Debug log for every mesh with morph targets
        if (mesh.morphTargetDictionary) {
          console.log(
            `Found mesh: ${mesh.name}, Morphs: ${Object.keys(mesh.morphTargetDictionary).length}`,
          );
        }

        if (
          mesh.morphTargetDictionary &&
          mesh.morphTargetDictionary["eyeBlinkLeft"] !== undefined
        ) {
          console.log(`✅ MATCH FOUND: ${mesh.name} has eyeBlinkLeft`);
          morphMesh = mesh;
        }
      }
    });

    if (!morphMesh) {
      console.warn("❌ No mesh found with 'eyeBlinkLeft'.");
      if (leftEye && rightEye) {
        console.log(
          "✅ Found separate Eye meshes. Will use scaling fallback for blinking.",
        );
      } else {
        console.warn(
          "❌ Could not find separate Eye meshes either. Blinking will fail.",
        );
      }
      // Fallback to name if not found for lip sync purposes
      const fallback = clone.getObjectByName("Wolf3D_Head") as THREE.Mesh;
      morphMesh = fallback;
    }
    return { headMesh: morphMesh, eyeLeft: leftEye, eyeRight: rightEye };
  }, [clone]);

  // Apply Lip Sync Logic to the FOUND head mesh
useLipSync(analyser, headMesh, isPlaying);  // Apply Blinking Logic to the FOUND head mesh OR separate eyes
  useBlink({ head: headMesh, eyeLeft, eyeRight });

  // Setup initial model position/scale/shadows on the clone
  useEffect(() => {
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clone]);

  return <primitive object={clone} position={[0, -1.55, 0]} scale={1.0} />;
};

// Preload the default model
useGLTF.preload(getAvatarUrl());

export default Avatar;
