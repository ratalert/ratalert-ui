import React from "react";
import ReactDOM from "react-dom";
import Lite from "./Lite";
import "./index.css";
const themes = {
  dark: `${process.env.PUBLIC_URL}/dark-theme.css`,
  light: `${process.env.PUBLIC_URL}/light-theme.css`,
};

const prevTheme = window.localStorage.getItem("theme");

ReactDOM.render(
  <Lite/>,
  document.getElementById("root"),
);
