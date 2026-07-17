// On-device subject validation for the photo features (face / palm / coffee cup).
// Uses ML Kit face detection + image labeling. Runs fully on device — no API call,
// no photo upload. Requires a native build (won't run in Expo Go / before a rebuild;
// in that case it transparently accepts — see the fail-open behavior below).
//
// DESIGN PRINCIPLE — ACCEPTANCE-BIASED:
// We must never wrongly reject a genuine photo (a real face/palm/cup). So we REJECT
// ONLY when the model is confident the image clearly shows something else
// (e.g. a foot in place of a palm). Whenever detection is unavailable or uncertain,
// we ACCEPT and let the reading proceed ("if unsure, say we saw it").

import FaceDetection from '@react-native-ml-kit/face-detection';
import ImageLabeling from '@react-native-ml-kit/image-labeling';

export type Subject = 'face' | 'palm' | 'coffee';

export type FaceLandmarkType =
  | 'leftEar' | 'rightEar' | 'leftEye' | 'rightEye' | 'noseBase'
  | 'leftCheek' | 'rightCheek' | 'mouthLeft' | 'mouthRight' | 'mouthBottom';

export interface Point { x: number; y: number }

export interface FaceGeometry {
  /** Face bounding box, original-image pixel coords. */
  frame: { top: number; left: number; width: number; height: number };
  /** Named landmark points (only the ones ML Kit actually detected), original-image pixel coords. */
  landmarks: Partial<Record<FaceLandmarkType, Point>>;
  /** Full face outline contour (jaw → cheeks → forehead), original-image pixel coords. Ordered. */
  faceContour: Point[];
}

export interface DetectionResult {
  accepted: boolean;
  /** Present only for subject === 'face' when a face was found — real geometry for overlay + shape analysis. */
  faceGeometry?: FaceGeometry;
  /** Internal reason — useful for debugging / telemetry. */
  reason: string;
}

type RawLabel = { text: string; confidence: number };

// Label keywords that count as "the right subject was seen". Kept broad so a genuine
// photo passes easily (acceptance bias).
const SUBJECT_LABELS: Record<Subject, string[]> = {
  face: ['face', 'head', 'selfie', 'person', 'skin', 'nose', 'eye', 'lip', 'forehead',
         'cheek', 'chin', 'hair', 'eyebrow', 'jaw', 'smile', 'beard', 'moustache', 'glasses'],
  palm: ['hand', 'finger', 'nail', 'thumb', 'wrist', 'arm', 'palm', 'skin', 'gesture'],
  coffee: ['cup', 'coffee', 'mug', 'drink', 'tableware', 'saucer', 'tea', 'espresso',
           'cappuccino', 'latte', 'ceramic', 'dishware', 'bowl', 'liquid', 'caffeine', 'porcelain'],
};

// Labels that, seen with HIGH confidence, indicate a clearly wrong subject. Deliberately
// conservative — only obvious mismatches trip a rejection.
const NEGATIVE_LABELS: Record<Subject, string[]> = {
  face: ['foot', 'shoe', 'leg', 'plant', 'food', 'vehicle', 'car', 'wall', 'sky', 'animal', 'dog', 'cat'],
  palm: ['foot', 'shoe', 'face', 'food', 'vehicle', 'car', 'plant', 'animal', 'document'],
  coffee: ['foot', 'shoe', 'face', 'hand', 'vehicle', 'car', 'plant', 'animal', 'document', 'mobile phone'],
};

const NEGATIVE_MIN_CONFIDENCE = 0.6;

const findMatch = (labels: RawLabel[], words: string[], minConf = 0): RawLabel | undefined =>
  labels.find((l) => l.confidence >= minConf && words.some((w) => l.text.toLowerCase().includes(w)));

const safeLabel = async (uri: string): Promise<RawLabel[] | null> => {
  try {
    return await ImageLabeling.label(uri);
  } catch {
    return null; // native module unavailable → caller treats as "uncertain" → accept
  }
};

const extractFaceGeometry = (face: any): FaceGeometry => {
  const landmarks: Partial<Record<FaceLandmarkType, Point>> = {};
  const lm = face?.landmarks;
  if (lm) {
    for (const key of Object.keys(lm) as FaceLandmarkType[]) {
      const p = lm[key]?.position;
      if (p && typeof p.x === 'number' && typeof p.y === 'number') {
        landmarks[key] = { x: p.x, y: p.y };
      }
    }
  }

  const faceContour: Point[] = (face?.contours?.face?.points ?? [])
    .filter((p: any) => p && typeof p.x === 'number' && typeof p.y === 'number')
    .map((p: any) => ({ x: p.x, y: p.y }));

  const frame = face?.frame ?? { top: 0, left: 0, width: 0, height: 0 };

  return { frame, landmarks, faceContour };
};

// Decide based on labels alone (palm / coffee, and face fallback).
const decideByLabels = (labels: RawLabel[] | null, subject: Subject): DetectionResult => {
  if (!labels) return { accepted: true, reason: 'labels-unavailable' }; // fail-open
  if (findMatch(labels, SUBJECT_LABELS[subject])) return { accepted: true, reason: 'subject-by-label' };
  const negative = findMatch(labels, NEGATIVE_LABELS[subject], NEGATIVE_MIN_CONFIDENCE);
  if (negative) return { accepted: false, reason: `wrong-subject:${negative.text}` };
  return { accepted: true, reason: 'uncertain-accept' }; // bias toward acceptance
};

export const detectSubject = async (uri: string, subject: Subject): Promise<DetectionResult> => {
  // Face: the ML Kit face detector is the strongest, most reliable signal.
  if (subject === 'face') {
    try {
      const faces = await FaceDetection.detect(uri, {
        performanceMode: 'accurate',
        landmarkMode: 'all',
        contourMode: 'all',
      });
      if (faces && faces.length > 0) {
        return { accepted: true, faceGeometry: extractFaceGeometry(faces[0]), reason: 'face-detected' };
      }
      // No face from the detector — double-check via labels before rejecting.
      return decideByLabels(await safeLabel(uri), 'face');
    } catch {
      return { accepted: true, reason: 'face-module-unavailable' }; // fail-open
    }
  }

  // Palm / coffee: label-based gate.
  return decideByLabels(await safeLabel(uri), subject);
};
