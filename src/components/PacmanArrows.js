import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Box } from "@mui/material";
import { useAtom } from "jotai";
import { confidenceThresholdsAtom } from "../GlobalState";

function PacmanArrows({ predictions }) {
  const [thresholds] = useAtom(confidenceThresholdsAtom);

  const getConfidenceColor = (confidence) => {
    if (confidence >= thresholds.green) return "rgba(76, 175, 80, 0.8)"; // Green
    if (confidence >= thresholds.yellow) return "rgba(255, 193, 7, 0.8)"; // Yellow
    if (confidence >= thresholds.orange) return "rgba(255, 87, 34, 0.8)"; // Orange
    return "rgba(244, 67, 54, 0.8)"; // Red
  };

  const renderPredictionWheel = () => {
    const DIRECTIONS = ["up", "down", "left", "right"];
    const CENTER_STYLES = {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };

    const getDirectionSymbol = (direction) => {
      const symbols = {
        up: "↑",
        down: "↓",
        left: "←",
        right: "→",
      };
      return symbols[direction] || "";
    };

    return (
      <div
        style={{
          position: "relative",
          width: "250px",
          height: "250px",
          borderRadius: "50%",
          backgroundColor: "rgba(230, 230, 230, 0.2)",
          border: "2px solid rgba(0,0,0,0.1)",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          margin: "auto",
        }}
      >
        {predictions.map(({ direction, confidence }, idx) => {
          const positionStyles = {
            up: { top: "15%", left: "50%" },
            down: { bottom: "15%", left: "50%" },
            left: { top: "50%", left: "15%" },
            right: { top: "50%", right: "15%" },
          }[direction];

          return (
            <motion.div
              key={idx}
              style={{
                ...CENTER_STYLES,
                ...positionStyles,
                color: "white",
                fontSize: "70px",
                fontWeight: "900",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor: getConfidenceColor(confidence),
                opacity: confidence,
                boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
              }}
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {getDirectionSymbol(direction)}
              <div
                style={{
                  position: "absolute",
                  bottom: "-25px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "rgba(0,0,0,1.0)",
                }}
              >
                {`${(confidence * 100).toFixed(0)}%`}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: "20px",
      }}
    >
      {renderPredictionWheel()}
    </div>
  );
}

export default PacmanArrows;
