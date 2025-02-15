import React, { Component } from "react";
import PropTypes from "prop-types";
import { Dialog, DialogContentText, DialogContent } from "@mui/material";
import { KEY_COMMANDS } from "./constants";
import getInitialState from "./state";
import { animate, changeDirection } from "./game";
import Stage from "./Stage";
import TopBar from "./TopBar";
import AllFood from "./Food/All";
import Monster from "./Monster";
import Player from "./Player";

export default class PacmanCovid extends Component {
  constructor(props) {
    super(props);

    this.props = props;
    this.state = {
      ...getInitialState(),
      isShowDialog: false,
      // isRunning: props.isRunning
    };

    this.handleTheEnd = this.handleTheEnd.bind(this);

    this.onKey = (evt) => {
      if (KEY_COMMANDS[evt.key] !== undefined) {
        return this.changeDirection(KEY_COMMANDS[evt.key]);
      }
      return -1;
    };
  }

  componentDidMount() {
    this.timers = {
      start: null,
      animate: null,
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", this.onKey);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.isRunning !== this.props.isRunning && this.props.isRunning) {
      this.setState({ stepTime: Date.now() });
      this.step();
    }
    if (prevProps.predictions !== this.props.predictions) {
      console.log(this.props.predictions);
      this.changeDirection(this.props.predictions);
    }
  }

  step() {
    const result = animate(this.state);

    this.setState({
      ...result,
    });

    clearTimeout(this.timers.animate);
    this.timers.animate = setTimeout(() => this.step(), 20);
  }

  componentWillUnmount() {
    document.body.style.overflow = "unset";
    window.removeEventListener("keydown", this.onKey);

    clearTimeout(this.timers.start);
    clearTimeout(this.timers.animate);
  }

  step() {
    const result = animate(this.state);

    this.setState({
      ...result,
    });

    clearTimeout(this.timers.animate);
    this.timers.animate = setTimeout(() => this.step(), 20);
  }

  changeDirection(direction) {
    this.setState(changeDirection(this.state, { direction }));
  }

  handleTheEnd() {
    this.props.setIsRuning(false);
    this.setState({ isShowDialog: true });
  }

  render() {
    if (this.state.hasError) {
      // renderizar qualquer UI como fallback
      return <h1>Something went wrong.</h1>;
    }

    const props = { gridSize: 12, ...this.props };

    const monsters = this.state.monsters.map(({ id, ...monster }) => (
      <Monster key={id} {...props} {...monster} />
    ));

    return (
      <div className="wrapper-container">
        <Stage {...props} />
        <TopBar score={this.state.score} lost={this.state.lost} />
        <AllFood {...props} food={this.state.food} />
        {monsters}
        <Player
          {...props}
          {...this.state.player}
          lost={this.state.lost}
          isRunning={this.props.isRunning}
          onEnd={this.handleTheEnd}
        />
        <Dialog
          open={this.state.isShowDialog}
          onClose={() => {
            this.setState({ isShowDialog: false });
            this.componentWillUnmount();
            this.setState(getInitialState());
            this.componentDidMount();
          }}
          // open={true}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              <p>You have been infected! </p>
              <p> Score: {this.state.score}</p>
            </DialogContentText>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
}

PacmanCovid.propTypes = {
  isRunning: PropTypes.bool.isRequired,
  setIsRuning: PropTypes.func.isRequired,
  gridSize: PropTypes.number.isRequired,
  onEnd: PropTypes.func,
};
