import React, { useCallback, useEffect, useState, Suspense } from "react";
import {withRouter} from 'react-router-dom';
import {
  PageHeader,
  Button,
  Descriptions,
  Popover,
  Layout,
  Card,
  Row,
  Col,
  InputNumber,
  Skeleton,
  Progress,
  Spin,
  Menu,
  Slider,
  Dropdown,
  Alert,
} from "antd";
const { Header, Footer, Sider, Content } = Layout;
import { useEventListener } from "eth-hooks/events/useEventListener";
import { Link } from 'react-router-dom';
import { contracts } from '../contracts/contracts.js';
import config from '../config.js';
import { GraphQLClient, gql } from 'graphql-request';
const superagent = require('superagent');

const APIURL = `${process.env.REACT_APP_GRAPH_URI}`;

const graphQLClient = new GraphQLClient(APIURL, {
    mode: 'cors',
});

import Loadable from "react-loadable";

const Account = React.lazy(() => import('./Account'));

import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";

import { LeftOutlined } from "@ant-design/icons";
const { ethers } = require("ethers");
import { renderNotification } from "../helpers";
import {
  DashboardOutlined,
  OrderedListOutlined,
  FileTextOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  CaretLeftOutlined,
  CaretRightOutlined,
  DownOutlined,
} from '@ant-design/icons';

const uniswapGraph = 'https://polygon.furadao.org/subgraphs/name/quickswap';
const uniswapClient = new GraphQLClient(uniswapGraph, {
    mode: 'cors',
});


class RatMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      windowHeight: window.innerHeight - 235,
      collapsed: true,
      web3Loaded: false,
      dayTime: this.props.dayTime,
      buttonsDisabled: true,
      hintsEnabled: false,
      liquidityAPR: 0,
      maticPrice: 0,
      ffoodPrice: 0,
      cfoodPrice: 0,
      gfoodPrice: 0,
    };

    this.Account = null;
    this.nftProfit = 0;
    this.mintedNfts = {};
  }

  toggle() {
    this.setState({
      collapsed: !this.state.collapsed,
    });
  };

  async componentDidMount() {
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("dayTime", (e) => {
      this.setState({dayTime: e.detail.dayTime})
    });

    window.addEventListener("loadingComplete", (e) => {
      this.setState({ buttonsDisabled: false })
    });

    const hints = await this.getHintStatus();
    this.setState({ hintsEnabled: hints });

    const id = document.getElementById('navGame');
    const navOther = document.getElementById('navOther');

    if (this.props.location.pathname === '/game') {
      // Fix active route not being set in DropDown
      if (id) {
        if (id.className.indexOf('ant-menu-item-selected') === -1) {
          id.className = id.className += ' ant-menu-item-selected';
        }
      }
    }

    const routes = ['/whitepaper', '/roadmap', '/faq', '/tos'];
    if (routes.includes(this.props.location.pathname)) {
      // Fix active route not being set in DropDown
      if (navOther) {
        if (navOther.className.indexOf('ant-menu-item-selected') === -1) {
          navOther.className = id.className += ' ant-menu-item-selected';
        }
      }
    }



    this.fetchAPR();
  }

  checkNav() {

    const navOther = document.getElementById('navOther');
    if (this.props.location.pathname === '/game') {
      if (navOther && navOther.className.indexOf('ant-menu-item-selected') !== -1) {
        let text = navOther.className;
        text = text.replace('ant-menu-item-selected', '');
        navOther.className = text;
      }
    }

    const navGame = document.getElementById('navGame');
    const routes = ['/whitepaper', '/roadmap', '/faq', '/tos'];
    if (routes.includes(this.props.location.pathname)) {
      if (navGame && navGame.className.indexOf('ant-menu-item-selected') !== -1) {
        let text = navOther.className;
        text = text.replace('ant-menu-item-selected', '');
        navGame.className = text;
      }
      /*
      if (navGame && navGame.className.indexOf('ant-menu-item-selected') === -1) {
        navGame.className = navGame.className += ' ant-menu-item-selected';
      }
      */
    }

  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  async getNFTObject(id) {
    const hex = `0x${this.decToHex(id)}`;
    const query = `{
        characters(id:"${hex}") {
          id, URI
        }
      }`;
    const result = await graphQLClient.request(query);
    if (result.characters) {
      const URI = result.characters.URI;
      if (URI) {
        const base64 = URI.split(",");
        const decoded = atob(base64[1]);
        const json = JSON.parse(decoded);
        return { image: json.image, name: json.name };
      } else {
        return { image: "", name: "" };
      }
    }
    return { image: "", name: "" };
  }

  decToHex(dec) {
    return (+dec).toString(16);
  }


  getNetworkName() {
    const chainId = this.props.chainId;
    const networkName = this.props.networkName;
    /*
    let networkName;
    if (chainId === 1337) {
      networkName = 'localhost';
    } else if (chainId === 4) {
      networkName = 'rinkeby';
    } else if (chainId === 80001) {
      networkName = "mumbai";
    }
    else {
      networkName = 'mainnet';
    }
    */
    return { networkName, chainId };
  }

  async listenForMints() {
    const { networkName, chainId } = this.getNetworkName();
    console.log(`LISTENFORMINTS network ${networkName} chain ID ${chainId}`);
    const Contract = new ethers.Contract(config[networkName].Character,
      contracts[chainId][networkName].contracts.Character.abi, this.props.provider);

    Contract.on("Transfer", async(origin, target, tokenId) => {
      if (origin === '0x0000000000000000000000000000000000000000' && target === this.props.address) {
        const URI = await Contract.tokenURI(parseInt(tokenId));
        if (URI.indexOf("data:application/json;base64,") === 0) {
          const base64 = URI.split(",");
          const decoded = atob(base64[1]);
          const json = JSON.parse(decoded);
          const img = json.image;
          if (this.mintedNfts[json.name]) {
            return;
          }
          this.mintedNfts[json.name] = 1;
          renderNotification(
            "info",
            '',
            <div>
              <img style={{ paddingRight: "10px" }} width={50} src={img} />
              <b>{json.name}</b> has been minted!
            </div>,
          );
        }
      }
    });
  }
  handleResize = e => {
    this.setState({ windowHeight: window.innerHeight - 235 });
  };

  async addToken(token, ticker) {
    if (!this.props.readContracts[token]) {
      return;
    }
    const tokenAddress = this.props.readContracts[token].address;
    const tokenSymbol = ticker;
    const tokenDecimals = 18;
    const tokenImage = `https://ratalert.com/img/${ticker.toLowerCase()}.png`;

    try {
      // wasAdded is a boolean. Like any RPC method, an error may be thrown.
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20', // Initially only supports ERC20, but eventually more!
          options: {
            address: tokenAddress, // The address that the token is at.
            symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
            decimals: tokenDecimals, // The number of decimals in the token
            image: tokenImage, // A string url of the token logo
          },
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  renderIcons(show = false) {
    let uniswap;
    let opensea;

    if (window.innerWidth > 0) {
      <div className={`${this.getNavStyle()} icons`}>
      </div>
    }

    if (this.props.readContracts && this.props.readContracts.FastFood && this.props.readContracts.FastFood.address) {
      uniswap = (
          <Menu className="uniswap-links" theme="light">
            <Menu.Item key="u1">
              <a className="topMenu" target="_new" href={`https://quickswap.exchange/#/swap?outputCurrency=${this.props.readContracts && this.props.readContracts.FastFood ? this.props.readContracts.FastFood.address : null}`}>Quickswap: MATIC - FFOOD</a>
            </Menu.Item>
            <Menu.Item key="u2">
              <a className="topMenu" target="_new" href={`https://quickswap.exchange/#/swap?outputCurrency=${this.props.readContracts && this.props.readContracts.CasualFood ? this.props.readContracts.CasualFood.address : null}`}>Quickswap: MATIC - CFOOD</a>
            </Menu.Item>
            <Menu.Item key="u3">
              <a className="topMenu" target="_new" href={`https://quickswap.exchange/#/swap?outputCurrency=${this.props.readContracts && this.props.readContracts.GourmetFood ? this.props.readContracts.GourmetFood.address : null}`}>Quickswap: MATIC - GFOOD</a>
            </Menu.Item>
            <Menu.Item key="u4">
              <a className="topMenu" target="_new" href={`https://dexscreener.com/polygon/0x8351e0d1373e56da6e45daa9eb44c0e634f28c68`}>DexScreener: FFOOD</a>
            </Menu.Item>
            <Menu.Item key="u5">
              <a className="topMenu" target="_new" href={`https://dexscreener.com/polygon/0xb42d4b3080c83571ad1b2864a8c430972db41269`}>DexScreener: CFOOD</a>
            </Menu.Item>
            <Menu.Item key="u6">
              <a className="topMenu" target="_new" href={`https://dexscreener.com/polygon/0xde60363e5f7f876c7ae383625e83ee64f43443a6`}>DexScreener: GFOOD</a>
            </Menu.Item>

            <Menu.Item key="u7">
            <a href="https://lp.ratalert.com"><span style={{color: '#C1C1C1'}}>Earn {parseFloat(this.state.aprGFOOD).toFixed(0)}% APY in $GFOOD by providing liquidity!</span></a>
            </Menu.Item>
          </Menu>
      );
      opensea = (
          <Menu className="uniswap-links" theme="light">
            <Menu.Item key="os1">
              <a className="topMenu" target="_new" href={`https://opensea.io/collection/ratalert-characters`}>OpenSea: Characters</a>
            </Menu.Item>
            <Menu.Item key="os">
            <a className="topMenu" target="_new" href={`https://opensea.io/collection/ratalert-kitchens`}>OpenSea: Kitchens</a>
            </Menu.Item>
          </Menu>
      );
    } else {
      uniswap = <div></div>;
      opensea = <div></div>;
    }
    return (
      <div className={`${this.getNavStyle()} icons`}>

      <span onClick={this.addToken.bind(this, 'FastFood', 'FFOOD')} className="foodToken">
        <img style={{cursor: 'pointer', marginTop: '5px', marginRight: '10px', cursor: 'pointer'}} src="/img/ffood.png" width={32}/>
        { this.state.ffoodPrice > 0 ? <span className={`${this.getTextStyle()}`} style={{fontSize: 11, position: 'absolute', marginTop: 38, marginLeft: -46}}>${this.state.ffoodPrice.toFixed(4)}</span> : null }
      </span>
      <span onClick={this.addToken.bind(this, 'CasualFood', 'CFOOD')} className="foodToken">
        <img style={{cursor: 'pointer', marginTop: '5px', marginRight: '10px', cursor: 'pointer'}} src="/img/cfood.png" width={32}/>
        { this.state.cfoodPrice > 0 ? <span className={`${this.getTextStyle()}`} style={{fontSize: 11, position: 'absolute', marginTop: 38, marginLeft: -46}}>${this.state.cfoodPrice.toFixed(4)}</span> : null }
      </span>
      <span onClick={this.addToken.bind(this, 'GourmetFood', 'GFOOD')} className="foodToken">
        <img style={{cursor: 'pointer', marginTop: '5px', marginRight: '10px', cursor: 'pointer'}} src="/img/gfood.png" width={32}/>
        { this.state.gfoodPrice > 0 ? <span className={`${this.getTextStyle()}`} style={{fontSize: 11, position: 'absolute', marginTop: 38, marginLeft: -46}}>${this.state.gfoodPrice.toFixed(4)}</span> : null }
      </span>

      { window.innerWidth < 800 ? <div style={{marginTop: 20}}/> : null}
      { this.props.active === 1 && window.innerWidth > 1110? <span style={{marginRight: 70}}>
      <span className="hintRectangle" onClick={this.toggleHints.bind(this)}>
        { this.state.hintsEnabled ? <span className="hintOn">On</span> : <span className="hintOff">Off</span> }
      </span>
      <span className="hintText">Hints</span>
      </span> : <span style={{marginRight: window.innerWidth > 1110 ? 30 : 0}}/>}

      { window.innerWidth < 800 || window.innerWidth > 960 ? <Dropdown overlay={opensea}>
        <img  width={30} src="/img/opensea.svg"
          style={{marginTop: '5px', marginRight: '8px', cursor: 'pointer'}}
        />
      </Dropdown> : null }
      { window.innerWidth < 800 || window.innerWidth > 960 ?  <Dropdown overlay={uniswap}>
          <img width={31} src="/img/quickswap.png" style={{marginTop: '5px', marginRight: '10px', cursor: 'pointer'}}
        />
      </Dropdown> : null }

      { show || window.innerWidth > 1039 ?
      <a href="https://discord.gg/RatAlert" target="_new">
        <img width={30} src="/img/discord.svg"
          style={{marginTop: '5px', marginRight: '10px', cursor: 'pointer'}}
        />
      </a> : null }

      { show || window.innerWidth > 1039 ?
      <a href="https://twitter.com/RatAlertNFT" target="_new">
        <img width={30} src="/img/twitter.svg"
          style={{marginTop: '5px', marginRight: '10px', cursor: 'pointer'}}
        />
      </a> : null }
      </div>
    );
  };

  renderMobileMenu() {
    if (window.innerWidth <= 930) {
      if (this.state.collapsed) {
        return (
          <div></div>
        )
      }
      const style = this.getMobileNavStyle();
      return (
        <Sider theme={style === 'ratMobileLight' ? 'dark' : 'light'} trigger={null} collapsible collapsed={this.state.collapsed}>
         <div className={style}>

          <Menu mode="inline" defaultSelectedKeys={[this.props.active.toString()]}>
            <Menu.Item key={1}><Link onClick={this.toggle.bind(this)} to="/">Start</Link></Menu.Item>
            { this.props.appMode === 'full' ? <Menu.Item style={{marginRight: '0px'}} key={2}><Link onClick={this.toggle.bind(this)} to="/game">Game</Link></Menu.Item> : null }
            { this.props.appMode === 'full' ? <Menu.Item key={3}><Link onClick={this.toggle.bind(this)} to="/leaderboard">Leaderboard</Link></Menu.Item> : null }
            { this.props.appMode === 'full' ? <Menu.Item key={4}><Link onClick={this.toggle.bind(this)} to="/claims">Claims</Link></Menu.Item> : null }
            <Menu.Item key={5}><Link onClick={this.toggle.bind(this)} to="/whitepaper">Whitepaper</Link></Menu.Item>
            <Menu.Item key={6}><Link onClick={this.toggle.bind(this)}  to="/roadmap">Roadmap</Link></Menu.Item>
            <Menu.Item key={7}><Link onClick={this.toggle.bind(this)}  to="/faq">FAQ</Link></Menu.Item>
            <Menu.Item key={8}><Link onClick={this.toggle.bind(this)}  to="/tos">ToS</Link></Menu.Item>
            <Menu.Item key={9}><Link onClick={this.toggle.bind(this)} to="/dao">DAO</Link></Menu.Item>


            <Menu.Item key="u1">
              <a target="_new" href={`https://quickswap.exchange/#/swap?outputCurrency=${this.props.readContracts && this.props.readContracts.FastFood ? this.props.readContracts.FastFood.address : null}`}>Quickswap: FFOOD</a>
            </Menu.Item>
            <Menu.Item key="u2">
              <a target="_new" href={`https://quickswap.exchange/#/swap?outputCurrency=${this.props.readContracts && this.props.readContracts.CasualFood ? this.props.readContracts.CasualFood.address : null}`}>Quickswap: CFOOD</a>
            </Menu.Item>
            <Menu.Item key="u3">
              <a target="_new" href={`https://quickswap.exchange/#/swap?outputCurrency=${this.props.readContracts && this.props.readContracts.GourmetFood ? this.props.readContracts.GourmetFood.address : null}`}>Quickswap: GFOOD</a>
            </Menu.Item>
            <Menu.Item key="u4">
              <a target="_new" href={`https://dexscreener.com/polygon/0x8351e0d1373e56da6e45daa9eb44c0e634f28c68`}>DexScreener: FFOOD</a>
            </Menu.Item>
            <Menu.Item key="u5">
              <a target="_new" href={`https://dexscreener.com/polygon/0xb42d4b3080c83571ad1b2864a8c430972db41269`}>DexScreener: CFOOD</a>
            </Menu.Item>
            <Menu.Item key="u6">
              <a target="_new" href={`https://dexscreener.com/polygon/0xde60363e5f7f876c7ae383625e83ee64f43443a6`}>DexScreener: GFOOD</a>
            </Menu.Item>

          </Menu>
          { this.renderIcons(true) }
          </div>
        </Sider>
      )
    }
  }

  getLink() {
    if (this.props.location.pathname === '/whitepaper') {
      return '/whitepaper';
    }
    if (this.props.location.pathname === '/tos') {
      return '/tos';
    }
    else if (this.props.location.pathname === '/roadmap') {
      return '/roadmap';
    }
    else if (this.props.location.pathname === '/faq') {
      return '/faq';
    } else {
      return '/whitepaper';
    }
  }

  getLinkName() {
    if (this.props.location.pathname === '/whitepaper') {
      return 'Whitepaper & more';
    }
    if (this.props.location.pathname === '/tos') {
      return 'ToS & more';
    }
    else if (this.props.location.pathname === '/roadmap') {
      return 'Roadmap & more';
    }
    else if (this.props.location.pathname === '/faq') {
      return 'FAQ & more';
    } else {
      return 'Whitepaper & more';
    }
  }


  renderMenu() {
    setTimeout(() => {
      this.checkNav();
    }, 100);

    if (window.innerWidth <= 930) {
      return (
        <div>
        {
          this.state.collapsed ?
          <MenuUnfoldOutlined className={`trigger ${this.getNavStyle()}`} onClick={this.toggle.bind(this)}/>
          : <MenuFoldOutlined className={`trigger ${this.getNavStyle()}`} onClick={this.toggle.bind(this)}/>
        }
        </div>
      );
    }
    const { networkName, chainId } = this.getNetworkName();
    let admin = {};
    if (networkName) {
      admin = config[networkName].admin;
    } else {
      console.log(`No network name, ${networkName}, chainId ${chainId}`);
    }
    if (window.innerWidth > 0 || this.props.appMode === 'lite') {
      const menu = (
          <Menu mode="horizontal">
            <Menu.Item>
              <Link to="/game">Play the game!</Link>
            </Menu.Item>
            <Menu.Item>
              <Link to="/leaderboard">Leaderboard</Link>
            </Menu.Item>
            <Menu.Item>
              <Link to="/claims">Claims</Link>
            </Menu.Item>
          </Menu>
      );

      const menuOther = (
          <Menu mode="horizontal">
            <Menu.Item>
              <Link to="/whitepaper">Whitepaper</Link>
            </Menu.Item>
            <Menu.Item>
              <Link to="/roadmap">Roadmap</Link>
            </Menu.Item>
            <Menu.Item>
              <Link to="/faq">FAQ</Link>
            </Menu.Item>
            <Menu.Item>
              <Link to="/tos">Terms of Service</Link>
            </Menu.Item>
          </Menu>
      );
      return (

        <div className={this.getNavStyle()}>
          <Menu mode="horizontal" defaultSelectedKeys={[this.props.active.toString()]}>
            <Dropdown overlay={menu} style={{border: '1px solid red', color: 'red'}}>
              <Menu.Item id="navGame" key={1}><Link to="/game">Game&nbsp;<DownOutlined /></Link></Menu.Item>
            </Dropdown>
            <Dropdown overlay={menuOther}>
              <Menu.Item id="navOther" key={2}><Link to={this.getLink()}>{this.getLinkName()}&nbsp;<DownOutlined /></Link></Menu.Item>
            </Dropdown>
            <Menu.Item key={3}><a href="https://lp.ratalert.com">Liquidity</a></Menu.Item>
            <Menu.Item key={4}><Link to="/dao">DAO</Link></Menu.Item>
          </Menu>
        </div>
      );
    } else {
      const menu = (
          <Menu mode="horizontal">
            <Menu.Item>
              <Link to="/whitepaper">Whitepaper</Link>
            </Menu.Item>
            <Menu.Item>
              <Link to="/roadmap">Roadmap</Link>
            </Menu.Item>
            <Menu.Item>
              <Link to="/faq">FAQ</Link>
            </Menu.Item>
            <Menu.Item>
              <Link to="/tos">ToS</Link>
            </Menu.Item>
            <Menu.Item>
              <Link to="/dao">DAO</Link>
            </Menu.Item>
          </Menu>
      );

      return (
        <div className={this.getNavStyle()}>
          <Menu mode="horizontal" defaultSelectedKeys={[this.props.active.toString()]}>
            <Menu.Item key={1}><Link to="/">Start</Link></Menu.Item>
            { this.props.appMode === 'full' ? <Menu.Item key={2}><Link to="/game">Game</Link></Menu.Item> : null}
            { this.props.appMode === 'full' ? <Menu.Item key={3}><Link to="/leaderboard">Leaderboard</Link></Menu.Item> : null }
            { this.props.appMode === 'full' ? <Menu.Item key={4}><Link to="/claims">Claims</Link></Menu.Item> : null }
            <Dropdown overlay={menu}>
              <Menu.Item key={5}><Link to={this.getLink()}>{this.getLinkName()}&nbsp;<DownOutlined /></Link></Menu.Item>
            </Dropdown>
          </Menu>
        </div>
      );
    }

  }

  async getHintStatus() {
    const hint = localStorage.getItem('hints')
    if (hint) {
      if (hint === 'true') {
        return true;
      } else {
        return false;
      }
    } else {
      localStorage.setItem('hints', 'true');
      return true;
    }
  }

  toggleHints() {
    const hint = !this.state.hintsEnabled;
    if (hint) {
      localStorage.setItem('hints', 'true');
    } else {
      localStorage.setItem('hints', 'false');
    }
    this.setState({ hintsEnabled: hint });

    const toggleHint = new CustomEvent('toggleHint', {
      bubbles: true,
      detail: { hint }
    });
    window.dispatchEvent(toggleHint);
  }

  getAccountData() {
    return (
      <div className="account"><Row><Col>
        </Col>
        <Col>
        <Suspense fallback={<div>Loading...</div>}>
        <Account
          address={this.props.address}
          localProvider={this.props.provider}
          userSigner={this.props.userSigner}
          mainnetProvider={this.props.mainnetProvider}
          price={0}
          blockExplorer={this.props.blockExplorer}
          setAddress={this.props.setAddress}
          setInjectedProvider={this.props.setInjectedProvider}
          injectedProvider={this.props.injectedProvider}
          dayTime={this.state.dayTime}
          themeClass={this.getNavStyle()}
          appMode={this.props.appMode}
        />
        </Suspense>

        </Col>
        </Row>
        </div>
    );
  };

  renderExtra() {
    return (
      <div>
        { window.innerWidth > 800 ? this.renderIcons() : null }
        { this.state.collapsed ?
          this.getAccountData()
          : null}
      </div>
    )
  }

  goToLandingPage() {
    this.props.history.push('/');
  }

  renderTitle() {
    return (
      <div>
        <span onClick={this.goToLandingPage.bind(this)} style={{cursor: 'pointer'}} className={`${this.getNavStyle()} logoTextHeader`}>
          RATalert
        </span>
        <div style={{cursor: 'pointer'}} className={`${this.getNavStyle('bg')} logoLineHeader`}/>
      </div>
    )

  }

  getWidth(type = 'kitchen', stretch = false, originalWidth = false, originalHeight = false) {
    let width = 0;

    if (stretch) {
      let factor;
      let height;
      if (type === 'sky') {
        factor = window.innerWidth / originalWidth;
        width = window.innerWidth;
        height = factor * originalHeight;
      } else {
        factor = width / originalWidth;
        height = factor * originalHeight;
      }
      return { width, height, type };
    }
    return { width: width, type };
  }


  getSkyClass() {
    if (this.props.location.pathname === '/') {
        return 'sky skyNight';
    }
    if (this.state.dayTime === 'night') {
      return 'sky skyNight';
    }
    if (this.state.dayTime === 'day') {
      return 'sky skyDay';
    }
    if (this.state.dayTime === 'morning') {
      return 'sky skyMorning';
    }
    if (this.state.dayTime === 'evening') {
      return 'sky skyEvening';
    }

  }

  getMobileNavStyle(bg = false) {
    if (this.props.location.pathname === '/') {
        return 'ratMobileDark';
    }
    if (this.state.dayTime === 'night') {
      return 'ratMobileLight';
    }
    if (this.state.dayTime === 'day') {
      return 'ratMobileLight';
    }
    if (this.state.dayTime === 'morning') {
      return 'ratMobileDark';
    }
    if (this.state.dayTime === 'evening') {
      return 'ratMobileDark';
    }
  }

  getNavStyle(bg = false) {
    if (this.props.location.pathname === '/') {
        return 'ratLight';
    }

    if (!bg && this.props.active === 1) {
      if (this.state.dayTime === 'night') {
        return 'ratLight';
      }
      if (this.state.dayTime === 'dark') {
        return 'ratDark';
      }
    }
    if (bg && this.props.active === 1) {
      return 'ratLightBg';
    }

    if (!bg) {
      if (this.state.dayTime === 'night') {
        return 'ratLight';
      }
      if (this.state.dayTime === 'day') {
        return 'ratLight';
      }
      if (this.state.dayTime === 'morning') {
        return 'ratDark';
      }
      if (this.state.dayTime === 'evening') {
        return 'ratDark';
      }
    } else {
      if (this.state.dayTime === 'night') {
        return 'ratLightBg';
      }
      if (this.state.dayTime === 'day') {
        return 'ratLightBg';
      }
      if (this.state.dayTime === 'morning') {
        return 'ratDarkBg';
      }
      if (this.state.dayTime === 'evening') {
        return 'ratDarkBg';
      }
    }


  }

  getTextStyle(bg = false) {
    if (window.innerWidth < 900) {
      if (!bg) {
        if (this.state.dayTime === 'night') {
          return 'ratDark';
        }
        if (this.state.dayTime === 'day') {
          return 'ratDark';
        }
        if (this.state.dayTime === 'morning') {
          return 'ratLight';
        }
        if (this.state.dayTime === 'evening') {
          return 'ratLight';
        }
      } else {
        if (this.state.dayTime === 'night') {
          return 'ratLightBg';
        }
        if (this.state.dayTime === 'day') {
          return 'ratLightBg';
        }
        if (this.state.dayTime === 'morning') {
          return 'ratDarkBg';
        }
        if (this.state.dayTime === 'evening') {
          return 'ratDarkBg';
        }
      }
    }
  }

  async fetchQuickswap(contract) {
    const graph = await superagent.get(`https://api.ratalert.com/graph?token0=0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270&token1=${contract}`);
    return graph.body.data;
  }


  aprToApy(interest, frequency = BLOCKS_IN_A_YEAR) {
    return ((1 + (interest / 100) / frequency) ** frequency - 1) * 100;
  }


  async fetchAPR(pair1, pair2, contract1, contract2) {
    /*
    console.log('Fetching APR');
    const maticPair = await this.fetchQuickswap('0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174');
    const maticPrice = parseFloat(maticPair.pairs[0].token1Price);
    console.log('MATIC PRICE', maticPrice);
    const results = await this.fetchQuickswap('0x2721d859EE8d03599F628522d30f14d516502944');
    console.log(results);
    if (results && results.pairs) {
      const pair = results.pairs[0]
      const aumMATIC = pair.reserve0 * maticPrice;
      const priceUSD = pair.token0Price * maticPrice;
      const aumFFOOD = pair.reserve1 * priceUSD;
      const aumUSD = pair.reserveUSD;
      const rewards = 25000;
      const dailyRewards = (rewards/7) * priceUSD;
      const weeklyRewards = rewards * priceUSD;
      const apr = (((dailyRewards)*365) / aumUSD)*100;
      this.setState({ liquidityAPR: apr, maticPrice, ffoodPrice: priceUSD });
    }
    */
    let token = await superagent.get(`https://api.ratalert.com/token?token=FFOOD`);
    if (token && token.body) {
      this.setState({ aprFFOOD: token.body.apr, ffoodPrice: token.body.price });
    }
    token = await superagent.get(`https://api.ratalert.com/token?token=CFOOD`);
    if (token && token.body) {
      this.setState({ aprCFOOD: token.body.apr, cfoodPrice: token.body.price });
    }
    token = await superagent.get(`https://api.ratalert.com/token?token=GFOOD`);
    if (token && token.body) {
      this.setState({ aprGFOOD: token.body.apr, gfoodPrice: token.body.price });
    }

  }

  getLiquidityMessage() {
      return (
        <span>
          Want to contribute to RatAlert? Become a <a href="https://lp.ratalert.com">liquidity provider</a> and earn up to:
          &nbsp;  <strong>{parseFloat(this.state.aprFFOOD).toFixed(0)}%</strong> APR on FFOOD/MATIC,
          &nbsp;<strong>{parseFloat(this.state.aprCFOOD).toFixed(0)}%</strong> APR on CFOOD/MATIC,
          &nbsp;<strong>{parseFloat(this.state.aprGFOOD).toFixed(0)}%</strong> APR on GFOOD/MATIC
        </span>
      )
  }

  render() {
    const skyAttr = this.getWidth('sky', true, 1440, 1000);
    return (

          <div>

          { this.state.aprFFOOD > 0 && this.state.aprCFOOD && this.state.aprGFOOD > 0? <Alert message={this.getLiquidityMessage()} type="info" showIcon closable /> : null }
          <div onClick={this.props.dayTimeSwitch} style={{width: skyAttr.width * 0.15, marginTop: skyAttr.height * 0.10, marginLeft: skyAttr.width * 0.82, cursor: 'pointer'}} className="daySwitcher">
          </div>

          <div className={this.getSkyClass()} style={skyAttr}>
          </div>
          <Layout>
            { this.renderMobileMenu() }
            <Layout>
            <PageHeader ghost={false} title={this.renderTitle()} subTitle={this.renderMenu()} extra={this.renderExtra()}></PageHeader>
            <Content>{ this.props.content }</Content>
            </Layout>
          </Layout>
          </div>
    );
  }
}

export default withRouter(RatMenu);
