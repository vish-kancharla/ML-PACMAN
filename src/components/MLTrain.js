import {} from "@mui/material";
import * as tf from "@tensorflow/tfjs";
import {
  Button,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Tabs,
  Tab,
  Box,
} from "@mui/material";
import React, { useEffect, useState, Suspense, useRef } from "react";
import { buildModel, processImages, predictDirection } from "../model";
import {
  batchArrayAtom,
  trainingProgressAtom,
  lossAtom,
  modelAtom,
  truncatedMobileNetAtom,
  epochsAtom,
  batchSizeAtom,
  learningRateAtom,
  hiddenUnitsAtom,
  stopTrainingAtom,
  imgSrcArrAtom,
  gameRunningAtom,
  predictionAtom,
  trainingEndedAtom,
  visualizationActiveAtom,
  confidenceThresholdsAtom,
  directionAveragesAtom,
} from "../GlobalState";
import { useAtom } from "jotai";
import InfoIcon from "@mui/icons-material/Info";

import { data, train } from "@tensorflow/tfjs";
import UMAPVisualization from "./UMAPVisualization";
// import JSONWriter from "./JSONWriter";
// import JSONLoader from "./JSONLoader";

function generateSelectComponent(
  label,
  options,
  handleChange,
  currentValue,
  isDisabled = false
) {
  return (
    <>
      <InputLabel id="demo-simple-select-label">{label}</InputLabel>
      <Select
        size="small"
        sx={{ minWidth: 120 }}
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        value={currentValue}
        label={label}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isDisabled}
      >
        {options.map((option) => (
          <MenuItem value={option}>{option}</MenuItem>
        ))}
      </Select>
    </>
  );
}

export default function MLTrain({ webcamRef }) {
  // ---- Configurations ----
  const [learningRate, setLearningRate] = useAtom(learningRateAtom);
  const [epochs, setEpochs] = useAtom(epochsAtom);
  const [hiddenUnits, setHiddenUnits] = useAtom(hiddenUnitsAtom);
  const [isRunning] = useAtom(gameRunningAtom);
  const [, setPredictionDirection] = useAtom(predictionAtom);

  // ---- Model Training ----
  const [model, setModel] = useAtom(modelAtom);
  const [truncatedMobileNet] = useAtom(truncatedMobileNetAtom);
  const [imgSrcArr] = useAtom(imgSrcArrAtom);

  // ---- UI Display ----
  const [lossVal, setLossVal] = useAtom(lossAtom);
  const [trainingProgress, setTrainingProgress] = useAtom(trainingProgressAtom);

  const [batchSize, setBatchSize] = useAtom(batchSizeAtom);
  const batchValueArray = [0.05, 0.1, 0.4, 1].map((r) =>
    Math.floor(imgSrcArr.length * r)
  );

  const [, setStopTraining] = useAtom(stopTrainingAtom);

  const [trainingCompleted, setTrainingCompleted] = useState(false);
  const [, setTrainingEnded] = useAtom(trainingEndedAtom);
  const [imageScores, setImageScores] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false); // New state for dialog visibility

  const [confidenceScore, setConfidenceScore] = useState(null);
  const [, setVisualizationActive] = useAtom(visualizationActiveAtom);
  const [currentTab, setCurrentTab] = useState(0);
  const [thresholds] = useAtom(confidenceThresholdsAtom);
  const [averages, setAverages] = useAtom(directionAveragesAtom);

  useEffect(() => {
    // Check if imgSrcArr is empty and set trainingEnded to false
    if (imgSrcArr.length === 0) {
      setTrainingEnded(false);
    }
  }, [imgSrcArr, setTrainingEnded]);

  // Reference to update isRunning
  const isRunningRef = useRef(isRunning);

  // Updating reference
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Loop to predict direction
  async function runPredictionLoop() {
    while (isRunningRef.current) {
      setPredictionDirection(
        await predictDirection(webcamRef, truncatedMobileNet, model)
      );
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  // Call to run prediction loop
  useEffect(() => {
    if (isRunning && webcamRef.current != null && model != null) {
      runPredictionLoop();
    }
  }, [isRunning]);

  const handleTrainingEnd = () => {
    setTrainingEnded(true);
    calculateConfidenceScore();
  };

  useEffect(() => {
    if (model && imgSrcArr.length > 0 && trainingCompleted) {
      calculateConfidenceScore();
    }
  }, [model, imgSrcArr, trainingCompleted]);

  async function calculateConfidenceScore() {
    if (model && imgSrcArr.length > 0) {
      const dataset = await processImages(imgSrcArr, truncatedMobileNet);
      const predictions = model.predict(dataset.xs);
      const probabilities = tf.softmax(predictions);
      const confidenceScores = probabilities.arraySync();

      const meanConfidence = tf.mean(probabilities.max(1)).dataSync()[0];
      setConfidenceScore(meanConfidence);

      const imageScores = imgSrcArr.map((img, idx) => ({
        image: img,
        scores: confidenceScores[idx],
        maxScore: Math.max(...confidenceScores[idx]),
      }));
      console.log("Image Scores:", imageScores);
      setImageScores(imageScores); // Update state with detailed scores
    }
  }

  function getConfidenceColor(confidence) {
    if (confidence >= thresholds.green) {
      return "green"; // High confidence
    } else if (confidence >= thresholds.yellow) {
      return "gold"; // Moderate confidence
    } else if (confidence >= thresholds.orange) {
      return "orange";
    } else {
      return "red"; // Low confidence
    }
  }

  function getConfidenceLabel(confidence) {
    if (confidence >= thresholds.green) return "Very Confident";
    if (confidence >= thresholds.yellow) return "Confident";
    if (confidence >= thresholds.orange) return "Neutral";
    return "Very Uncertain";
  }

  function getConfidenceEmoji(confidence) {
    if (confidence >= 0.8) return "🌕"; // Full moon
    if (confidence >= 0.6) return "🌖"; // Waxing Gibbous
    if (confidence >= 0.4) return "🌗"; // Waning Gibbous
    if (confidence >= 0.2) return "🌑"; // New moon
    return "🌚"; // Dark moon
  }

  // Train the model when called
  async function trainModel() {
    setTrainingProgress("Stop");
    setVisualizationActive(true); // Enable visualization when training starts
    const dataset = await processImages(imgSrcArr, truncatedMobileNet);
    const model = await buildModel(
      truncatedMobileNet,
      setLossVal,
      dataset,
      hiddenUnits,
      batchSize,
      epochs,
      learningRate,
      setTrainingCompleted,
      handleTrainingEnd
    );
    setModel(model);
  }

  const stopTrain = () => {
    setStopTraining(true);
    setVisualizationActive(false); // Disable visualization when training stops
  };

  const EmptyDatasetDisaply = (
    <Typography variant="h6" sx={{ marginTop: "10px" }}>
      Please collect some data first!
      {/* Or <JSONLoader /> */}
    </Typography>
  );

  const confidenceDetailDisplay = (
    <Dialog
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Confidence Details</DialogTitle>

      <Tabs
        value={currentTab}
        onChange={(event, newValue) => setCurrentTab(newValue)}
        centered
      >
        {["Up", "Down", "Left", "Right"].map((direction, index) => {
          const averageScore =
            imageScores
              .filter(
                (score) =>
                  score.image.label.toLowerCase() === direction.toLowerCase()
              )
              .map((score) => score.scores[index] * 100)
              .reduce((a, b) => a + b, 0) /
              imageScores.filter(
                (score) =>
                  score.image.label.toLowerCase() === direction.toLowerCase()
              ).length || 0;

          useEffect(() => {
            setAverages((prev) => ({
              ...prev,
              [direction]: averageScore,
            }));
          }, [averageScore, direction]);
          return (
            <Tab
              key={direction}
              label={`${direction} (Avg: ${averageScore.toFixed(2)}%)`}
            />
          );
        })}
      </Tabs>

      <DialogContent>
        {["Up", "Down", "Left", "Right"].map((direction, dirIndex) => (
          <div key={direction} role="tabpanel" hidden={currentTab !== dirIndex}>
            {currentTab === dirIndex && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 2,
                }}
              >
                {imageScores
                  .filter(
                    (score) =>
                      score.image.label.toLowerCase() ===
                      direction.toLowerCase()
                  )
                  .map((score, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        border: "1px solid #ddd",
                        borderRadius: 2,
                        p: 2,
                        textAlign: "center",
                      }}
                    >
                      <img
                        src={score.image.src}
                        alt={`${direction} Image ${idx + 1}`}
                        style={{
                          width: "100%",
                          maxHeight: "200px",
                          objectFit: "cover",
                          marginBottom: "10px",
                        }}
                      />
                      <Typography variant="subtitle1">
                        <strong>Direction Label: {score.image.label}</strong>
                      </Typography>
                      {score.scores.map((val, dir) => (
                        <Typography key={dir}>
                          Direction {dir + 1}: {(val * 100).toFixed(2)}%
                        </Typography>
                      ))}
                      <Typography variant="body2" color="textSecondary">
                        <strong>Highest Confidence:</strong>{" "}
                        {(score.maxScore * 100).toFixed(2)}%
                      </Typography>
                    </Box>
                  ))}
              </Box>
            )}
          </div>
        ))}
      </DialogContent>

      <DialogActions>
        <Button onClick={() => setDialogOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  const confidenceDisplay = (
    <div style={{ width: "100%", marginTop: "10px" }}>
      <div
        style={{
          width: "100%",
          backgroundColor: "#e0e0e0",
          borderRadius: "5px",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            height: "10px",
            width: `${confidenceScore * 100}%`,
            backgroundColor: getConfidenceColor(confidenceScore),
            borderRadius: "5px",
          }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Typography variant="h6" color={getConfidenceColor(confidenceScore)}>
          Confidence:{" "}
          {confidenceScore === null
            ? "Not available yet"
            : `${(confidenceScore * 100).toFixed(2)}%`}
          <span>{getConfidenceEmoji(confidenceScore)}</span>
        </Typography>
        <Tooltip title="This score indicates how confident the model is about its prediction. Higher values mean more confidence.">
          <InfoIcon style={{ marginLeft: "8px", cursor: "pointer" }} />
        </Tooltip>
      </div>
      <Typography variant="body2" color={getConfidenceColor(confidenceScore)}>
        {confidenceScore === null
          ? "Waiting for predictions..."
          : getConfidenceLabel(confidenceScore)}
      </Typography>
      {/* Button to view details */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => setDialogOpen(true)}
        disabled={imageScores.length === 0}
        style={{ marginTop: "10px" }}
      >
        View Confidence Scores
      </Button>
    </div>
  );

  const ReguarlDisplay = (
    <Grid
      container
      spacing={3}
      sx={{
        alignItems: "flex-start",
        width: "100%",
        margin: 0,
      }}
    >
      <Grid item xs={6}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            trainingProgress == -1 ? trainModel() : stopTrain();
          }}
        >
          {trainingProgress == -1 ? "Train" : lossVal ? "Stop" : "Loading..."}
        </Button>
        <LinearProgress
          variant="determinate"
          value={trainingProgress}
          style={{
            display: trainingProgress === 0 ? "none" : "block",
            width: "75%",
            marginTop: "10px",
          }}
        />
        <Typography variant="h6">
          LOSS: {lossVal === null ? "" : lossVal} <br />
          Dataset Size: {imgSrcArr.length} <br />
          {confidenceDisplay}
        </Typography>
        {/* <JSONWriter /> <br /> */}
      </Grid>
      <Grid item xs={6}>
        <div className="hyper-params">
          {/* <label>Learning rate</label> */}
          {generateSelectComponent(
            "Learning Rate",
            [0.003, 0.001, 0.0001, 0.00001],
            setLearningRate,
            learningRate
          )}

          {/* <label>Epochs</label> */}
          {generateSelectComponent(
            "Epochs",
            [10, 100, 200, 500],
            setEpochs,
            epochs
          )}

          {/* <label>Batch size </label> */}
          {generateSelectComponent(
            "Batch Size",
            batchValueArray,
            setBatchSize,
            batchSize,
            false
          )}

          {/* <label>Hidden units</label> */}
          {generateSelectComponent(
            "Hidden units",
            [10, 100, 200],
            setHiddenUnits,
            hiddenUnits
          )}
        </div>
      </Grid>
      <Grid
        item
        sx={{
          ml: -1.5,
          mt: 2,
          px: 3, // Add horizontal padding to align with items above
          "& > div": {
            width: "100%",
            maxWidth: "100%", // Allow visualization to take full width of container
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start", // Align content to the left
          },
        }}
      ></Grid>
      <Grid>
        <UMAPVisualization />
      </Grid>
    </Grid>
  );

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        {imgSrcArr.length === 0 ? EmptyDatasetDisaply : ReguarlDisplay}
      </Suspense>
      {confidenceDetailDisplay}
      <Dialog
        open={trainingCompleted}
        onClose={() => setTrainingCompleted(false)}
      >
        <DialogTitle>Training Completed</DialogTitle>
        <DialogContent>
          <Typography>Your model has been successfully trained!</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTrainingCompleted(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
