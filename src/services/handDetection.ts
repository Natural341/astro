// On-device hand landmark detection for Palm Reading — runs Google's MediaPipe
// Hands model (21 joints per hand) fully on-device via TensorFlow.js. Used to
// position the palmistry line overlay onto the user's ACTUAL photographed hand
// (correct scale/rotation/position) instead of a generic fixed diagram.
//
// Fails open: any error, missing native module, or "no hand found" returns
// null — callers must treat this as an enhancement layer, not a hard
// requirement (the reading still works from the AI text analysis alone).

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
// expo-file-system v19 removed the promise-based readAsStringAsync/EncodingType
// API from the default export in favor of new File/Directory classes — the
// old API is still available under the /legacy subpath.
import * as FileSystem from 'expo-file-system/legacy';

export type HandJointName =
  | 'wrist'
  | 'thumb_cmc' | 'thumb_mcp' | 'thumb_ip' | 'thumb_tip'
  | 'index_finger_mcp' | 'index_finger_pip' | 'index_finger_dip' | 'index_finger_tip'
  | 'middle_finger_mcp' | 'middle_finger_pip' | 'middle_finger_dip' | 'middle_finger_tip'
  | 'ring_finger_mcp' | 'ring_finger_pip' | 'ring_finger_dip' | 'ring_finger_tip'
  | 'pinky_finger_mcp' | 'pinky_finger_pip' | 'pinky_finger_dip' | 'pinky_finger_tip';

export interface HandPoint { x: number; y: number }

export interface HandDetectionResult {
  /** Pixel-coordinate joints, keyed by name, in the original image's coordinate space. */
  joints: Record<HandJointName, HandPoint>;
  handedness: 'Left' | 'Right';
  score: number;
}

let detectorPromise: Promise<handPoseDetection.HandDetector> | null = null;

const getDetector = (): Promise<handPoseDetection.HandDetector> => {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      await tf.ready();
      return handPoseDetection.createDetector(handPoseDetection.SupportedModels.MediaPipeHands, {
        runtime: 'tfjs',
        modelType: 'lite',
        maxHands: 1,
      });
    })();
  }
  return detectorPromise;
};

/** Warm up the model in the background (e.g. on screen mount) so the first real detection is fast. */
export const preloadHandDetector = (): void => {
  getDetector().catch(() => {
    // Swallow — detectHand() will simply return null later if this never succeeds.
  });
};

export const detectHand = async (uri: string): Promise<HandDetectionResult | null> => {
  try {
    const detector = await getDetector();

    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const raw = tf.util.encodeString(base64, 'base64').buffer;
    const imageTensor = decodeJpeg(new Uint8Array(raw));

    let hands: handPoseDetection.Hand[];
    try {
      hands = await detector.estimateHands(imageTensor, { flipHorizontal: false });
    } finally {
      imageTensor.dispose();
    }

    if (!hands || hands.length === 0) return null;
    const hand = hands[0];

    const joints = {} as Record<HandJointName, HandPoint>;
    for (const kp of hand.keypoints) {
      const name = kp.name as HandJointName | undefined;
      if (name) joints[name] = { x: kp.x, y: kp.y };
    }
    if (!joints.wrist) return null; // sanity check — malformed result

    return {
      joints,
      handedness: hand.handedness === 'Left' ? 'Left' : 'Right',
      score: hand.score ?? 0,
    };
  } catch {
    return null; // model unavailable / failed to load / decode error — fail open
  }
};
