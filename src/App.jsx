import { Alert, Button, Col, Menu, Row, List } from "antd";
import "antd/dist/antd.css";
import React, { useCallback, useEffect, useState, Suspense } from "react";
import { BrowserRouter, Link, Route, Switch } from "react-router-dom";
import "./App.css";
import { Address, Balance, Contract, GasGauge, Header, Ramp, Main, Leaderboard, RatMenu, Whitepaper} from "./components";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Transactor, renderNotification } from "./helpers";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useEventListener } from "eth-hooks/events/useEventListener";

import { useContractConfig } from "./hooks";

// import Portis from "@portis/web3";
// import Fortmatic from "fortmatic";
// import Authereum from "authereum";

const { ethers } = require("ethers");

let targetNetwork;
if (process.env.REACT_APP_ETH_ENV === 'local') {
  targetNetwork = NETWORKS.localhost;
} else if (process.env.REACT_APP_ETH_ENV === 'mainnet') {
  targetNetwork = NETWORKS.mainnet;
} else if (process.env.REACT_APP_ETH_ENV === 'rinkeby') {
  targetNetwork = NETWORKS.rinkeby;
} else {
  targetNetwork = NETWORKS.localhost;
}

targetNetwork = NETWORKS.rinkeby;

console.log('TARGETNETWORK', targetNetwork);
const DEBUG = true;
const NETWORKCHECK = true;

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
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
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_ID

// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = targetNetwork.rpcUrl;
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new ethers.providers.StaticJsonRpcProvider(localProviderUrlFromEnv);

// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;

// Coinbase walletLink init

// WalletLink provider
// const walletLinkProvider = walletLink.makeWeb3Provider(`https://mainnet.infura.io/v3/${INFURA_ID}`, 1);

// Portis ID: 6255fb2b-58c8-433b-a2c9-62098c05ddc9
/*
  Web3 modal helps us "connect" external wallets:
*/
/*
const web3Modal = new Web3Modal({
  network: "mainnet", // Optional. If using WalletConnect on xDai, change network to "xdai" and add RPC info below for xDai chain.
  cacheProvider: true, // optional
  theme: "light", // optional. Change to "dark" for a dark theme.
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        bridge: "https://polygon.bridge.walletconnect.org",
        infuraId: INFURA_ID,
        rpc: {
          1: `https://mainnet.infura.io/v3/${INFURA_ID}`, // mainnet // For more WalletConnect providers: https://docs.walletconnect.org/quick-start/dapps/web3-provider#required
          42: `https://kovan.infura.io/v3/${INFURA_ID}`,
          100: "https://dai.poa.network", // xDai
        },
      },
    },
    /*
    portis: {
      display: {
        logo: "https://user-images.githubusercontent.com/9419140/128913641-d025bc0c-e059-42de-a57b-422f196867ce.png",
        name: "Portis",
        description: "Connect to Portis App",
      },
      package: Portis,
      options: {
        id: "568e0153-79c2-459b-8ed4-202639056bb5",
      },
    },
    */
/*
    fortmatic: {
      package: Fortmatic, // required
      options: {
        key: "pk_live_28DBBBB282AFDED0", // required
      },
    },

    "custom-walletlink": {
      display: {
        logo: "https://play-lh.googleusercontent.com/PjoJoG27miSglVBXoXrxBSLveV6e3EeBPpNY55aiUUBM9Q1RCETKCOqdOkX2ZydqVf0",
        name: "Coinbase",
        description: "Connect to Coinbase Wallet (not Coinbase App)",
      },
      package: walletLinkProvider,
      connector: async (provider, _options) => {
        await provider.enable();
        return provider;
      },
    },
    */
/*
    authereum: {
      package: Authereum, // required
    },
    */
/*
  },
});
*/
let stats = {
  minted: 0,
  totalSupply: 0,
  rats: 0,
  chefs: 0,
  ratsStaked: 0,
  chefsStaked: 0,
  tokensClaimed: 0,
  paidTokens: 0,
  dailyFFoodRate: 0,
  minimumToExit: 0,
  ratTax: 0,
  maxSupply: 0,
  mintPrice: 0,
};
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
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider);
  const userSigner = userProviderAndSigner.signer;

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


  useEffect(() => {
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
  const yourLocalBalance = useBalance(localProvider, address);
  const yourMainnetBalance = useBalance(mainnetProvider, address);
  const contractConfig = useContractConfig();
  const readContracts = useContractLoader(localProvider, contractConfig);
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  // loadDataFromChain();
  // console.log('Loaded:', stats);

  fFoodBalance = useContractReader(readContracts, "FastFood", "balanceOf", [address]);
  const minted = useContractReader(readContracts, "ChefRat", "minted");
  let totalSupply = useContractReader(readContracts, "ChefRat", "MAX_TOKENS");
  let paidTokens = useContractReader(readContracts, "ChefRat", "PAID_TOKENS");

  let mintPrice = useContractReader(readContracts, "ChefRat", "MINT_PRICE");
  if (!mintPrice) {
    mintPrice = 0;
  }
  const rats = useContractReader(readContracts, "ChefRat", "numRats");
  const chefs = useContractReader(readContracts, "ChefRat", "numChefs");

  let dailyFFoodRate = useContractReader(readContracts, "KitchenPack", "DAILY_FFOOD_RATE");
  if (!dailyFFoodRate) {
    dailyFFoodRate = 0;
  }

  let minimumToExit = useContractReader(readContracts, "KitchenPack", "MINIMUM_TO_EXIT");
  if (!minimumToExit) {
    minimumToExit = 0;
  }

  let ratTax = useContractReader(readContracts, "KitchenPack", "FFOOD_CLAIM_TAX_PERCENTAGE");
  if (!ratTax) {
    ratTax = 0;
  }

  let maxSupply = useContractReader(readContracts, "KitchenPack", "FFOOD_MAX_SUPPLY");
  if (!maxSupply) {
    maxSupply = 0;
  }

  let ratsStaked = useContractReader(readContracts, "KitchenPack", "totalRatsStaked");
  if (!ratsStaked) {
    ratsStaked = 0;
  }
  let chefsStaked = useContractReader(readContracts, "KitchenPack", "totalChefsStaked");
  if (!chefsStaked) {
    chefsStaked = 0;
  }
  let tokensClaimed = useContractReader(readContracts, "KitchenPack", "totalFastFoodEarned");
  if (!tokensClaimed) {
    tokensClaimed = 0;
  }
  stats = {
    minted,
    totalSupply: parseInt(totalSupply) || 0,
    rats,
    chefs,
    ratsStaked: parseInt(ratsStaked),
    chefsStaked: parseInt(chefsStaked),
    tokensClaimed: parseFloat(ethers.utils.formatEther(tokensClaimed)).toFixed(8),
    paidTokens: parseInt(paidTokens),
    dailyFFoodRate: parseInt(ethers.utils.formatEther(dailyFFoodRate)),
    minimumToExit: parseInt(minimumToExit),
    ratTax: parseInt(ratTax),
    maxSupply: parseInt(parseInt(ethers.utils.formatEther(maxSupply))),
    mintPrice: parseFloat(ethers.utils.formatEther(mintPrice || 0)) || 0,
  };

  let networkDisplay = "";
  if (NETWORKCHECK && localChainId && selectedChainId && localChainId !== selectedChainId) {
    const networkSelected = NETWORK(selectedChainId);
    const networkLocal = NETWORK(localChainId);
    if (selectedChainId === 1337 && localChainId === 31337) {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network ID"
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
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network"
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
                        rpcUrls: [targetNetwork.rpcUrl],
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
  } else {
    networkDisplay = (
      <div style={{ zIndex: -1, position: "absolute", right: 154, top: 28, padding: 16, color: targetNetwork.color }}>
        {targetNetwork.name}
      </div>
    );
  }

/*
  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      logoutOfWeb3Modal();
    });
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);
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
    localProvider._network.chainId === 31337 &&
    yourLocalBalance &&
    ethers.utils.formatEther(yourLocalBalance)
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
  const renderNFT = id => {
    return <div>NFT #{id.toString()}</div>;
  };

  const renderTokenBalances = () => {
    return (
      <div>$FFOOD {fFoodBalance ? parseFloat(ethers.utils.formatEther(fFoodBalance).toString()).toFixed(8) : 0}</div>
    );
  };

  const stakeContent = (
    <div>
      <div style={{ padding: 8, marginTop: 32 }}></div>
      <Row>
        <Col span={4}>
          <Button
            type={"primary"}
            onClick={() => {
              try {
                tx(
                  writeContracts.ChefRat.setApprovalForAll(readContracts.KitchenPack.address, true, {
                    gasPrice: 1000000000,
                    from: address,
                    gasLimit: 85000,
                  }),
                );
              } catch (e) {
                console.log(e);
              }
            }}
          >
            Authorize
          </Button>
        </Col>
        <Col span={3}></Col>
        <Col span={3}></Col>
      </Row>
    </div>
  );
  const balanceContent = renderTokenBalances();

  const getCollapsed = (collapsed) => {
    return collapsed;
  }

  return (
    <div className="App">
      {networkDisplay}
      <BrowserRouter>
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
            active={1}
            content={<Main
              balanceContent={balanceContent}
              tx={tx}
              readContracts={readContracts}
              writeContracts={writeContracts}
              address={address}
              provider={localProvider}
              stats={stats}
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
              active={2}
              content={<Leaderboard
                balanceContent={balanceContent}
                tx={tx}
                readContracts={readContracts}
                writeContracts={writeContracts}
                address={address}
                provider={localProvider}
                stats={stats}
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
              active={3}
              content={<Whitepaper
                balanceContent={balanceContent}
                tx={tx}
                readContracts={readContracts}
                writeContracts={writeContracts}
                address={address}
                provider={localProvider}
                stats={stats}
                />}
              />
          </Route>
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default App;
