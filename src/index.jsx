import React from "react";
import ReactDOM from "react-dom";

import Loadable from "react-loadable";
//const App = process.env.REACT_APP_MODE === 'full' && import('./App.jsx')


let Lite = React.lazy(() => import('./Lite'));
let App = React.lazy(() => import('./App'));

const Loading = props => {
      if (props.error) {
        return <div>Error!</div>;
      } else {
        return <div></div>;
      }
};

if (process.env.REACT_APP_MODE === 'lite') {
  const lazyLite = Loadable({
          loader: () => import("./Lite" /* webpackChunkName: "web3" */),
          loading: Loading
  });
  if (lazyLite) {
    Lite = lazyLite;
  }
} else {
  const lazyApp = Loadable({
          loader: () => import("./App" /* webpackChunkName: "web3" */),
          loading: Loading
  });
  if (lazyApp) {
    App = lazyApp;
  }
}

import "./index.css";
const themes = {
  dark: `${process.env.PUBLIC_URL}/dark-theme.css`,
  light: `${process.env.PUBLIC_URL}/light-theme.css`,
};

const prevTheme = window.localStorage.getItem("theme");

if (process.env.REACT_APP_MODE === 'lite') {
  ReactDOM.render(
    <Lite/>,
    document.getElementById("root"),
  );
} else {
  ReactDOM.render(
    <App/>,
    document.getElementById("root"),
  );
}
