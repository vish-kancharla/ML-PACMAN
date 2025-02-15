import React from "react";
import PropTypes from "prop-types";

export default function TopBar({ ...props }) {
  const { score } = props;

  return (
    <div className="pacmancovid-topbar">
      <span className="running-score">Score: {score}</span>
    </div>
  );
}

TopBar.propTypes = {
  lost: PropTypes.bool.isRequired,
  score: PropTypes.number.isRequired,
};
