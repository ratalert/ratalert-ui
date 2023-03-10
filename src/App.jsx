import { Alert, Button, Col, Menu, Row, List } from "antd";
import "antd/dist/antd.css";
import React, { useCallback, useEffect, useState, Suspense } from "react";
import { BrowserRouter, Link, Route, Switch } from "react-router-dom";
import "./App.css";
import { Dao, Contracts, Tos, Infographics, Liquidity, Giveaway, Roadmap, Faq, Landing, Address, Balance, Contract, GasGauge, Header, Ramp, Main, Leaderboard, RatMenu, Whitepaper, Gameplay, AdminDashboard, Claims} from "./components";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Transactor, renderNotification } from "./helpers";
import {
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useBalance,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useEventListener } from "eth-hooks/events/useEventListener";

import { useContractConfig } from "./hooks";

// import Portis from "@portis/web3";
// import Fortmatic from "fortmatic";
// import Authereum from "authereum";

const { ethers } = require("ethers");

let targetNetwork;
let chainId = 0;
let lastBlockTime = 0;
let networkName;
if (process.env.REACT_APP_ETH_ENV === 'local') {
  targetNetwork = NETWORKS.localhost;
  networkName = 'localhost';
  chainId = 1337;
} else if (process.env.REACT_APP_ETH_ENV === 'mainnet') {
  targetNetwork = NETWORKS.mainnet;
  networkName = 'mainnet';
  chainId = 1;
} else if (process.env.REACT_APP_ETH_ENV === 'rinkeby') {
  targetNetwork = NETWORKS.rinkeby;
  networkName = 'rinkeby';
  chainId = 4;
} else if (process.env.REACT_APP_ETH_ENV === 'beta') {
 targetNetwork = NETWORKS.beta;
 networkName = 'beta';
 chainId = 80001;
} else if (process.env.REACT_APP_ETH_ENV === 'mumbai') {
 targetNetwork = NETWORKS.mumbai;
 networkName = 'mumbai';
 chainId = 80001;
}
else if (process.env.REACT_APP_ETH_ENV === 'matic') {
  targetNetwork = NETWORKS.matic;
  networkName = 'matic';
  chainId = 137;
}
else {
  networkName='localhost'
  targetNetwork = NETWORKS.localhost;
  chainId = 1337;
}
let appMode = process.env.REACT_APP_MODE || 'full';
/*
process.env.REACT_APP_ETH_ENV = 'matic';
targetNetwork = NETWORKS.matic;
networkName = 'matic';
chainId = 137;
*/
//targetNetwork = NETWORKS.rinkeby;
// chainId = 1337;



const DEBUG = true;
const NETWORKCHECK = true;

let dayTime;

if (!dayTime) {
  const now = new Date();
  const hour = now.getHours();
  if (hour >= 7 && hour <= 9) {
    dayTime = 'morning';
  } else if (hour >= 10 && hour <= 17) {
    dayTime = 'day';
  } else if (hour >= 18 && hour <= 20) {
    dayTime = 'evening';
  } else {
    dayTime = 'night';
  }
}

// ???? providers
if (DEBUG) console.log("???? Connecting to Mainnet Ethereum");
// const mainnetProvider = getDefaultProvider("mainnet", { infura: INFURA_ID, etherscan: ETHERSCAN_KEY, quorum: 1 });
//console.log(mainnetProvider);
// const mainnetProvider = new InfuraProvider("mainnet",INFURA_ID);
//
// attempt to connect to our own scaffold eth rpc and if that fails fall back to infura...
// Using StaticJsonRpcProvider as the chainId won't change see https://github.com/ethers-io/ethers.js/issues/901
const scaffoldEthProvider = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider("https://rpc.scaffoldeth.io:48544")
  : null;
const poktMainnetProvider = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider(
      "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
    )
  : null;
const mainnetInfura = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID)
  : null;
// ( ?????? Getting "failed to meet quorum" errors? Check your INFURA_ID

// ???? Your local provider is usually pointed at your local blockchain

let localProviderUrl;
if (targetNetwork && targetNetwork.rpcUrl) {
  localProviderUrl = targetNetwork.rpcUrl;
}
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("???? Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new ethers.providers.StaticJsonRpcProvider(localProviderUrlFromEnv);

// ???? block explorer URL
let blockExplorer;
if (targetNetwork && targetNetwork.blockExplorer) {
  blockExplorer = targetNetwork.blockExplorer;
}

let lastCall = 0;
let startTime = Math.round(new Date().getTime() / 1000);

let fFoodBalance = 0;
function App(props) {
  const mainnetProvider =
    poktMainnetProvider && poktMainnetProvider._isProvider
      ? poktMainnetProvider
      : scaffoldEthProvider && scaffoldEthProvider._network
      ? scaffoldEthProvider
      : mainnetInfura;

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();

  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from ???? Metamask or if you don't have it then instantly generate a ???? burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider);
  const userSigner = userProviderAndSigner.signer;

  let localBalance = useBalance(localProvider, address);
  localBalance = ethers.utils.formatEther(localBalance);

  function loadDataFromChain() {
    if (lastCall === 0) {
      lastCall = Math.round(new Date().getTime() / 1000);
    }

    const timeSinceStart = Math.round(new Date().getTime() / 1000) - startTime;
    console.log('Time since start', timeSinceStart);
    if (timeSinceStart >= 30) {
      if (lastCall !== 0) {
        const diff = Math.round(new Date().getTime() / 1000) - lastCall;
        console.log('Diff since last call:', diff);
        if (diff <= 5) {
            console.log('Blocking new call');
            return;
        }
      }
    }

    lastCall = Math.round(new Date().getTime() / 1000);


    return stats;
  }


  useEffect(async() => {
    if (lastBlockTime === 0) {
      lastBlockTime = (await localProvider.getBlock(localProvider._lastBlockNumber)).timestamp;
    }

    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
         if (!userSigner.address) {
          setAddress(newAddress);
        }
      }
    }
    getAddress();
  }, [userSigner]);


  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  const tx = Transactor(userSigner, gasPrice);
  const faucetTx = Transactor(localProvider, gasPrice);
  const contractConfig = useContractConfig();
  const readContracts = useContractLoader(localProvider, contractConfig);
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);
  /*
  console.log('ENV', process.env.REACT_APP_ETH_ENV);
  console.log('LOCAL PROVIDER', localProvider);
  console.log('READ CONTRACTS', readContracts, contractConfig);
  console.log('WRITE CONTRACTS', writeContracts, contractConfig);
  */

  // loadDataFromChain();
  // console.log('Loaded:', stats);

  let networkDisplay = "";
  if (NETWORKCHECK && localChainId && selectedChainId && localChainId !== selectedChainId) {
    const networkSelected = NETWORK(selectedChainId);
    const networkLocal = NETWORK(localChainId);
    if (selectedChainId === 1337 && localChainId === 31337) {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="?????? Wrong Network ID"
            description={
              <div>
                You have <b>chain id 1337</b> for localhost and you need to change it to <b>31337</b> to work with
                HardHat.
                <div>(MetaMask -&gt; Settings -&gt; Networks -&gt; Chain ID -&gt; 31337)</div>
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    } else {
      const maticTargetNetwork = 'https://rpc-mumbai.maticvigil.com/';
      let rpcUrl = targetNetwork ? targetNetwork.rpcUrl : '';
      if (targetNetwork && targetNetwork.name === 'mumbai') {
        rpcUrl = maticTargetNetwork;
      }
      networkDisplay = (
        <div style={{ zIndex: 5, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="?????? Wrong Network"
            description={
              <div>
                You have <b>{networkSelected && networkSelected.name}</b> selected and you need to be on{" "}
                <Button
                  onClick={async () => {
                    const ethereum = window.ethereum;
                    const data = [
                      {
                        chainId: "0x" + targetNetwork.chainId.toString(16),
                        chainName: targetNetwork.name,
                        nativeCurrency: targetNetwork.nativeCurrency,
                        rpcUrls: [rpcUrl],
                        blockExplorerUrls: [targetNetwork.blockExplorer],
                      },
                    ];

                    let switchTx;
                    // https://docs.metamask.io/guide/rpc-api.html#other-rpc-methods
                    try {
                      switchTx = await ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: data[0].chainId }],
                      });
                    } catch (switchError) {
                      // not checking specific error code, because maybe we're not using MetaMask
                      try {
                        switchTx = await ethereum.request({
                          method: "wallet_addEthereumChain",
                          params: data,
                        });
                      } catch (addError) {
                        // handle "add" error
                      }
                    }

                    if (switchTx) {
                      // console.log(switchTx);
                    }
                  }}
                >
                  <b>{networkLocal && networkLocal.name}</b>
                </Button>
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    }
  }
/*
  useOnBlock(localProvider, async() => {
    lastBlockTime = (await localProvider.getBlock(localProvider._lastBlockNumber)).timestamp;
    const blockTimeEvent = new CustomEvent('blockTime', {
      bubbles: true,
      detail: { lastBlockTime }
    });
    window.dispatchEvent(blockTimeEvent);
  });
  */

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  let faucetHint = "";
  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

  const [faucetClicked, setFaucetClicked] = useState(false);
  if (
    localProvider &&
    localProvider._network &&
    localProvider._network.chainId === 31337
  ) {
    faucetHint = (
      <div style={{ padding: 16 }}>
        <Button
          type="primary"
          onClick={() => {
            faucetTx({
              to: address,
              value: ethers.utils.parseEther("0.01"),
            });
            setFaucetClicked(true);
          }}
        >
          Get funds from faucet
        </Button>
      </div>
    );
  }


  const dayTimeSwitch = () => {
    if (dayTime === 'morning') {
      dayTime = 'day';
    } else if (dayTime === 'day') {
      dayTime = 'evening';
    } else if (dayTime === 'evening') {
      dayTime = 'night';
    } else if (dayTime === 'night') {
      dayTime = 'morning';
    }
    const dayTimeEvent = new CustomEvent('dayTime', {
      bubbles: true,
      detail: { dayTime }
    });
    window.dispatchEvent(dayTimeEvent);
  }

  return (
    <div className="App">

      <BrowserRouter>
        { networkDisplay }
        <Switch>
          <Route exact path="/">
            <RatMenu
            tx={tx}
            readContracts={readContracts}
            writeContracts={writeContracts}
            address={address}
            provider={localProvider}
            userSigner={userSigner}
            mainnetProvider={mainnetProvider}
            blockExplorer={blockExplorer}
            setAddress={setAddress}
            setInjectedProvider={setInjectedProvider}
            injectedProvider={injectedProvider}
            active={0}
            dayTime={dayTime}
            dayTimeSwitch={dayTimeSwitch}
            debug={DEBUG}
            chainId={chainId}
            networkName={networkName}
            appMode={appMode}
            content={<Landing
              tx={tx}
              appMode={appMode}
              contractConfig={contractConfig}
              readContracts={readContracts}
              writeContracts={writeContracts}
              userSigner={userSigner}
              address={address}
              provider={localProvider}
              targetNetwork={targetNetwork}
              setInjectedProvider={setInjectedProvider}
              chainId={chainId}
              lastBlockTime={lastBlockTime}
              dayTime={dayTime}
              debug={DEBUG}
              localBalance={localBalance}
              networkName={networkName}
            />}
            />
          </Route>
          <Route exact path="/game">
            <RatMenu
            tx={tx}
            readContracts={readContracts}
            writeContracts={writeContracts}
            address={address}
            provider={localProvider}
            userSigner={userSigner}
            mainnetProvider={mainnetProvider}
            blockExplorer={blockExplorer}
            setAddress={setAddress}
            appMode={appMode}
            setInjectedProvider={setInjectedProvider}
            injectedProvider={injectedProvider}
            active={1}
            dayTime={dayTime}
            dayTimeSwitch={dayTimeSwitch}
            debug={DEBUG}
            chainId={chainId}
            networkName={networkName}
            appMode={appMode}
            content={<Main
              tx={tx}
              contractConfig={contractConfig}
              readContracts={readContracts}
              writeContracts={writeContracts}
              userSigner={userSigner}
              address={address}
              provider={localProvider}
              targetNetwork={targetNetwork}
              chainId={chainId}
              lastBlockTime={lastBlockTime}
              dayTime={dayTime}
              debug={DEBUG}
              localBalance={localBalance}
              networkName={networkName}
              appMode={appMode}
            />}
            />
          </Route>
          <Route path="/leaderboard">
            <RatMenu
              tx={tx}
              readContracts={readContracts}
              writeContracts={writeContracts}
              address={address}
              provider={localProvider}
              active={1}
              injectedProvider={injectedProvider}
              setInjectedProvider={setInjectedProvider}
              dayTime={dayTime}
              appMode={appMode}
              chainId={chainId}
              networkName={networkName}
              dayTimeSwitch={dayTimeSwitch}
              content={<Leaderboard
                tx={tx}
                readContracts={readContracts}
                writeContracts={writeContracts}
                address={address}
                provider={localProvider}
                dayTime={dayTime}
                networkName={networkName}
                />}
              />
          </Route>
          <Route path="/claims">
            <RatMenu
              tx={tx}
              readContracts={readContracts}
              writeContracts={writeContracts}
              address={address}
              provider={localProvider}
              active={1}
              appMode={appMode}
              injectedProvider={injectedProvider}
              setInjectedProvider={setInjectedProvider}
              dayTime={dayTime}
              chainId={chainId}
              networkName={networkName}
              dayTimeSwitch={dayTimeSwitch}
              content={<Claims
                tx={tx}
                readContracts={readContracts}
                writeContracts={writeContracts}
                address={address}
                provider={localProvider}
                dayTime={dayTime}
                networkName={networkName}
                />}
              />
          </Route>
          <Route path="/whitepaper">
            <RatMenu
              tx={tx}
              readContracts={readContracts}
              writeContracts={writeContracts}
              address={address}
              provider={localProvider}
              active={2}
              injectedProvider={injectedProvider}
              setInjectedProvider={setInjectedProvider}
              dayTime={dayTime}
              chainId={chainId}
              appMode={appMode}
              dayTimeSwitch={dayTimeSwitch}
              networkName={networkName}
              content={<Whitepaper
                tx={tx}
                readContracts={readContracts}
                writeContracts={writeContracts}
                address={address}
                provider={localProvider}
                dayTime={dayTime}
                appMode={appMode}
                setInjectedProvider={setInjectedProvider}
                networkName={networkName}
                />}
              />
          </Route>
          <Route path="/gameplay">
            <RatMenu
              tx={tx}
              readContracts={readContracts}
              writeContracts={writeContracts}
              address={address}
              provider={localProvider}
              active={2}
              injectedProvider={injectedProvider}
              setInjectedProvider={setInjectedProvider}
              dayTime={dayTime}
              chainId={chainId}
              appMode={appMode}
              dayTimeSwitch={dayTimeSwitch}
              networkName={networkName}
              content={<Gameplay
                tx={tx}
                readContracts={readContracts}
                writeContracts={writeContracts}
                address={address}
                provider={localProvider}
                dayTime={dayTime}
                appMode={appMode}
                setInjectedProvider={setInjectedProvider}
                networkName={networkName}
                />}
              />
          </Route>
          <Route path="/roadmap">
            <RatMenu
              tx={tx}
              readContracts={readContracts}
              writeContracts={writeContracts}
              address={address}
              provider={localProvider}
              active={2}
              injectedProvider={injectedProvider}
              setInjectedProvider={setInjectedProvider}
              dayTime={dayTime}
              chainId={chainId}
              appMode={appMode}
              dayTimeSwitch={dayTimeSwitch}
              networkName={networkName}
              content={<Roadmap
                tx={tx}
                readContracts={readContracts}
                writeContracts={writeContracts}
                address={address}
                provider={localProvider}
                dayTime={dayTime}
                appMode={appMode}
                setInjectedProvider={setInjectedProvider}
                networkName={networkName}
                />}
              />
          </Route>
          <Route path="/faq">
            <RatMenu
              tx={tx}
              readContracts={readContracts}
              writeContracts={writeContracts}
              address={address}
              provider={localProvider}
              active={2}
              injectedProvider={injectedProvider}
              setInjectedProvider={setInjectedProvider}
              dayTime={dayTime}
              chainId={chainId}
              appMode={appMode}
              dayTimeSwitch={dayTimeSwitch}
              networkName={networkName}
              content={<Faq
                tx={tx}
                readContracts={readContracts}
                writeContracts={writeContracts}
                address={address}
                provider={localProvider}
                dayTime={dayTime}
                appMode={appMode}
                setInjectedProvider={setInjectedProvider}
                networkName={networkName}
                />}
              />
          </Route>
          <Route path="/tos">
            <RatMenu
              tx={tx}
              readContracts={readContracts}
              writeContracts={writeContracts}
              address={address}
              provider={localProvider}
              active={2}
              injectedProvider={injectedProvider}
              setInjectedProvider={setInjectedProvider}
              dayTime={dayTime}
              chainId={chainId}
              appMode={appMode}
              dayTimeSwitch={dayTimeSwitch}
              networkName={networkName}
              content={<Tos
                tx={tx}
                readContracts={readContracts}
                writeContracts={writeContracts}
                address={address}
                provider={localProvider}
                dayTime={dayTime}
                appMode={appMode}
                setInjectedProvider={setInjectedProvider}
                networkName={networkName}
                />}
              />
          </Route>
          <Route path="/dao">
            <RatMenu
              tx={tx}
              readContracts={readContracts}
              writeContracts={writeContracts}
              address={address}
              provider={localProvider}
              active={4}
              injectedProvider={injectedProvider}
              setInjectedProvider={setInjectedProvider}
              dayTime={dayTime}
              chainId={chainId}
              appMode={appMode}
              dayTimeSwitch={dayTimeSwitch}
              networkName={networkName}
              content={<Dao
                tx={tx}
                readContracts={readContracts}
                writeContracts={writeContracts}
                address={address}
                provider={localProvider}
                dayTime={dayTime}
                appMode={appMode}
                setInjectedProvider={setInjectedProvider}
                networkName={networkName}
                />}
              />
          </Route>
          <Route path="/giveaway">
            <RatMenu
              tx={tx}
              readContracts={readContracts}
              writeContracts={writeContracts}
              address={address}
              provider={localProvider}
              active={9}
              injectedProvider={injectedProvider}
              setInjectedProvider={setInjectedProvider}
              dayTime={dayTime}
              chainId={chainId}
              appMode={appMode}
              dayTimeSwitch={dayTimeSwitch}
              networkName={networkName}
              content={<Giveaway
                tx={tx}
                readContracts={readContracts}
                writeContracts={writeContracts}
                address={address}
                provider={localProvider}
                dayTime={dayTime}
                appMode={appMode}
                setInjectedProvider={setInjectedProvider}
                networkName={networkName}
                />}
              />
          </Route>
          <Route path="/herrcooles">
            <RatMenu
              tx={tx}
              readContracts={readContracts}
              writeContracts={writeContracts}
              address={address}
              provider={localProvider}
              active={9}
              injectedProvider={injectedProvider}
              setInjectedProvider={setInjectedProvider}
              dayTime={dayTime}
              chainId={chainId}
              appMode={appMode}
              dayTimeSwitch={dayTimeSwitch}
              networkName={networkName}
              content={<Giveaway
                tx={tx}
                readContracts={readContracts}
                writeContracts={writeContracts}
                address={address}
                provider={localProvider}
                dayTime={dayTime}
                appMode={appMode}
                setInjectedProvider={setInjectedProvider}
                networkName={networkName}
                />}
              />
          </Route>
          <Route path="/liquidity">
            <RatMenu
              tx={tx}
              readContracts={readContracts}
              writeContracts={writeContracts}
              address={address}
              provider={localProvider}
              active={3}
              injectedProvider={injectedProvider}
              setInjectedProvider={setInjectedProvider}
              dayTime={dayTime}
              chainId={chainId}
              appMode={appMode}
              dayTimeSwitch={dayTimeSwitch}
              networkName={networkName}
              content={<Liquidity
                tx={tx}
                readContracts={readContracts}
                writeContracts={writeContracts}
                address={address}
                provider={localProvider}
                dayTime={dayTime}
                appMode={appMode}
                setInjectedProvider={setInjectedProvider}
                networkName={networkName}
                />}
              />
          </Route>
          <Route path="/infographics">
            <RatMenu
              tx={tx}
              readContracts={readContracts}
              writeContracts={writeContracts}
              address={address}
              provider={localProvider}
              active={9}
              injectedProvider={injectedProvider}
              setInjectedProvider={setInjectedProvider}
              dayTime={dayTime}
              chainId={chainId}
              appMode={appMode}
              dayTimeSwitch={dayTimeSwitch}
              networkName={networkName}
              content={<Infographics
                tx={tx}
                readContracts={readContracts}
                writeContracts={writeContracts}
                address={address}
                provider={localProvider}
                dayTime={dayTime}
                appMode={appMode}
                setInjectedProvider={setInjectedProvider}
                networkName={networkName}
                />}
              />
          </Route>
          <Route path="/infographic">
            <RatMenu
              tx={tx}
              readContracts={readContracts}
              writeContracts={writeContracts}
              address={address}
              provider={localProvider}
              active={9}
              injectedProvider={injectedProvider}
              setInjectedProvider={setInjectedProvider}
              dayTime={dayTime}
              chainId={chainId}
              appMode={appMode}
              dayTimeSwitch={dayTimeSwitch}
              networkName={networkName}
              content={<Infographics
                tx={tx}
                readContracts={readContracts}
                writeContracts={writeContracts}
                address={address}
                provider={localProvider}
                dayTime={dayTime}
                appMode={appMode}
                setInjectedProvider={setInjectedProvider}
                networkName={networkName}
                />}
              />
          </Route>
          <Route path="/contracts">
            <RatMenu
              tx={tx}
              readContracts={readContracts}
              writeContracts={writeContracts}
              address={address}
              provider={localProvider}
              active={9}
              injectedProvider={injectedProvider}
              setInjectedProvider={setInjectedProvider}
              dayTime={dayTime}
              chainId={chainId}
              appMode={appMode}
              dayTimeSwitch={dayTimeSwitch}
              networkName={networkName}
              content={<Contracts
                tx={tx}
                readContracts={readContracts}
                writeContracts={writeContracts}
                address={address}
                provider={localProvider}
                dayTime={dayTime}
                appMode={appMode}
                setInjectedProvider={setInjectedProvider}
                networkName={networkName}
                />}
              />
          </Route>
          <Route path="/admin">
            <RatMenu
              tx={tx}
              readContracts={readContracts}
              writeContracts={writeContracts}
              address={address}
              appMode={appMode}
              provider={localProvider}
              active={9}
              injectedProvider={injectedProvider}
              setInjectedProvider={setInjectedProvider}
              dayTime={dayTime}
              chainId={chainId}
              dayTimeSwitch={dayTimeSwitch}
              networkName={networkName}
              content={<AdminDashboard
                tx={tx}
                chainId={chainId}
                readContracts={readContracts}
                writeContracts={writeContracts}
                appMode={appMode}
                address={address}
                provider={localProvider}
                dayTime={dayTime}
                setInjectedProvider={setInjectedProvider}
                networkName={networkName}
                />}
              />
          </Route>
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default App;
