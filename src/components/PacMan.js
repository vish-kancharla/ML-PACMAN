import { Button } from "@mui/material";
import "../lib/PacmanCovid/styles/index.scss";
import PacmanCovid from "../lib/PacmanCovid";
import PacmanArrows from "./PacmanArrows";
import {
  gameRunningAtom,
  predictionAtom,
  trainingEndedAtom,
  confidenceAtom,
  predictionDirectionAtom,
} from "../GlobalState";
import { useAtom } from "jotai";

export default function PacMan() {
  const [isRunning, setIsRuning] = useAtom(gameRunningAtom);
  const [trainingEnded] = useAtom(trainingEndedAtom);

  const pacManProps = {
    gridSize: 17,
    animate: process.env.NODE_ENV !== "development",
    locale: "pt",
    onEnd: () => {
      console.log("onEnd");
    },
  };

  const [confidence] = useAtom(confidenceAtom);
  const [predictionDirection] = useAtom(predictionDirectionAtom);

  const directionMap = ["up", "down", "left", "right"];
  const predictions =
    predictionDirection !== null
      ? [
          {
            direction: directionMap[predictionDirection],
            confidence: confidence,
          },
        ]
      : [];

  return (
    <>
      {console.log("Vishal Prediction Direction:", predictionDirection)}{" "}
      <PacmanCovid
        {...pacManProps}
        isRunning={isRunning}
        setIsRuning={setIsRuning}
        predictions={predictionDirection}
      />
      {!isRunning && (
        <Button
          variant="contained"
          onClick={() => setIsRuning(!isRunning)}
          disabled={!trainingEnded}
        >
          {" "}
          Start
        </Button>
      )}
      <div style={{ marginTop: "5px", marginBottom: "30px" }}></div>
      {predictions.length > 0 && <PacmanArrows predictions={predictions} />}
    </>
  );
}
