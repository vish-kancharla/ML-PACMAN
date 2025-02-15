import { atom } from "jotai";
import { loadTruncatedMobileNet } from "./model";

// ---- Configurations ----
export const epochsAtom = atom(100); // Number of epochs
export const batchSizeAtom = atom(1); // Selected batch size
export const hiddenUnitsAtom = atom(100); // Number of hidden units
export const learningRateAtom = atom(0.0001); // Learning rate
export const gameRunningAtom = atom(false); // Game state
export const predictionAtom = atom(null); // Current prediction
export const confidenceAtom = atom(null); // Store confidence value
export const predictionDirectionAtom = atom(null);

// ---- Model Training ----
export const modelAtom = atom(null); // Model
export const truncatedMobileNetAtom = atom(loadTruncatedMobileNet()); // truncatedMobileNet
export const imgSrcArrAtom = atom([]); // collected images, formate {src: string, label: string}

// ---- UI Display ----
export const lossAtom = atom(null); // Loss value
export const trainingProgressAtom = atom(-1); // Training progress
export const stopTrainingAtom = atom(false); // Flag to stop training
export const trainingEndedAtom = atom(false);
export const visualizationActiveAtom = atom(false); // Add this new atom
export const confidenceThresholdsAtom = atom({
  green: 0.7, // High confidence
  yellow: 0.4, // Medium confidence
  orange: 0.2, // Low confidence
});

export const directionAveragesAtom = atom({
  Up: 0,
  Down: 0,
  Left: 0,
  Right: 0,
});
