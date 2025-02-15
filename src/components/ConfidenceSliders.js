import React, { useEffect } from "react";
import { Slider, Typography, Box, Stack, Tooltip } from "@mui/material";
import { useAtom } from "jotai";
import { confidenceThresholdsAtom } from "../GlobalState";

export default function ConfidenceSliders() {
  const [thresholds, setThresholds] = useAtom(confidenceThresholdsAtom);

  // Set default values on component mount
  useEffect(() => {
    setThresholds({
      green: 0.7, // High confidence
      yellow: 0.4, // Moderate confidence
      orange: 0.2, // Low confidence
    });
  }, [setThresholds]);

  const handleThresholdChange = (color) => (event, newValue) => {
    setThresholds((prev) => {
      switch (color) {
        case "green":
          return { ...prev, green: newValue };
        case "yellow":
          return { ...prev, yellow: Math.min(newValue, prev.green) };
        case "orange":
          return { ...prev, orange: Math.min(newValue, prev.yellow) };
        default:
          return prev;
      }
    });
  };

  const getConfidenceLabel = (value) => `${(value * 100).toFixed(0)}%`;

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 400,
        margin: "auto",
        padding: 2,
        backgroundColor: "#f5f5f5",
        borderRadius: 2,
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          textAlign: "center",
          fontWeight: "bold",
          color: "#333",
        }}
      >
        Confidence level thresholds
      </Typography>

      <Stack spacing={3} sx={{ marginTop: 2 }}>
        {[
          {
            color: "green",
            label: "High Confidence",
            baseColor: "#4CAF50", // Actual green
          },
          {
            color: "yellow",
            label: "Moderate Confidence",
            baseColor: "#FFC107", // Actual yellow
          },
          {
            color: "orange",
            label: "Low Confidence",
            baseColor: "#FF9800", // Actual orange
          },
        ].map(({ color, label, baseColor }) => (
          <Box key={color}>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ marginBottom: 1 }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  backgroundColor: baseColor,
                  opacity: 0.7,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  flexGrow: 1,
                  color: "text.secondary",
                }}
              >
                {label}
              </Typography>
              <Tooltip
                title={getConfidenceLabel(thresholds[color])}
                placement="right"
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: "bold",
                    color: "text.primary",
                  }}
                >
                  {getConfidenceLabel(thresholds[color])}
                </Typography>
              </Tooltip>
            </Stack>
            <Slider
              value={thresholds[color]}
              onChange={handleThresholdChange(color)}
              min={0}
              max={
                color === "green"
                  ? 1
                  : thresholds[color === "yellow" ? "green" : "yellow"]
              }
              step={0.01}
              sx={{
                color: baseColor,
                "& .MuiSlider-thumb": {
                  boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
                },
              }}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
