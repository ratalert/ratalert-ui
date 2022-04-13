import { Button } from "antd";
import React, { useCallback, useEffect, useState } from "react";
import Address from "./Address";
import Balance from "./Balance";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import {
Row, Col
} from "antd";
import { INFURA_ID, NETWORK, NETWORKS } from "../constants";

const { ethers } = require("ethers");

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
  }
});

export default function Account({
  address,
  userSigner,
  localProvider,
  mainnetProvider,
  price,
  minimized,
  blockExplorer,
/*
  web3Modal,
  loadWeb3Modal,
  logoutOfWeb3Modal,
  */
  setAddress,
  setInjectedProvider,
  injectedProvider,
  dayTime,
  themeClass,
  hideLoggedIn = false,
  appMode = 'lite'
}) {



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
    },
*/

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

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);


  const modalButtons = [];
  if (web3Modal) {
    if (web3Modal.cachedProvider && !hideLoggedIn) {
      modalButtons.push(
        <a onClick={logoutOfWeb3Modal} className={`${themeClass} menuWeb3Button`} href="#">Logout</a>,
      );
    } else {
      if (!address && appMode === 'full') {
        modalButtons.push(
          <Button style={{height: 30, width: 140}}
          className="web3Button"
          type={"default"}
          onClick={loadWeb3Modal}
          >
          Connect wallet
          </Button>,
        );
      }
      const urlParams = new URLSearchParams(window.location.search);
      const addr = urlParams.get('addr');
      if (addr) {
        setAddress(addr);
      }
    }
  }


  const display = minimized ? (
    ""
  ) : (
    <span>
      {address && !hideLoggedIn ? (
        <div style={{paddingTop: 10}}>
        <Address fontSize={18} address={address} ensProvider={mainnetProvider} blockExplorer={blockExplorer} />
        </div>
      ) : (
        ''
      )}
    </span>
  );

  return (
    <div>
      <Row align="vertical" className={address ? 'loggedInButtons' : 'loggedOutButtons'}>
        <Col>{display}</Col>
        <Col style={{paddingTop: 10}}>{modalButtons}</Col>
      </Row>


    </div>
  );
}
