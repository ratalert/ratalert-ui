import React, { useCallback, useEffect, useState, Suspense } from "react";
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
} from "antd";
const { Header, Footer, Sider, Content } = Layout;
import { useEventListener } from "eth-hooks/events/useEventListener";
import { Link } from 'react-router-dom';
import { contracts } from '../contracts/contracts.js';
import config from '../config.js';
import { GraphQLClient, gql } from 'graphql-request';

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
} from '@ant-design/icons';

class RatMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      windowHeight: window.innerHeight - 235,
      collapsed: true,
      web3Loaded: false,
      dayTime: this.props.dayTime,
      buttonsDisabled: true,
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

  componentDidMount() {
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("dayTime", (e) => {
      this.setState({dayTime: e.detail.dayTime})
    });

    window.addEventListener("loadingComplete", (e) => {
      this.setState({ buttonsDisabled: false })
    });

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
/*
  async componentWillMount() {

    setTimeout(() => {
      this.listenForMints();
    }, 10000);
    return;
  }
*/
  handleResize = e => {
    this.setState({ windowHeight: window.innerHeight - 235 });
  };



  renderIcons() {
    if (!this.state.collapsed) {
      return (
        <div></div>
      );
    }
    return (
      <div className={`${this.getNavStyle()} icons`}>
      <a>
        <img  width={30} src="/img/opensea.svg"
          style={{marginTop: '5px', marginRight: '10px', cursor: 'pointer'}}
        />
      </a>
      <a href="https://app.uniswap.org/" target="_new">
        <img width={30} src="/img/uniswap.svg"
          style={{marginTop: '5px', marginRight: '10px', cursor: 'pointer'}}
        />
      </a>
      <a href="https://discord.gg/DP36aCq8P4" target="_new">
        <img width={30} src="/img/discord.svg"
          style={{marginTop: '5px', marginRight: '10px', cursor: 'pointer'}}
        />
      </a>
      <a href="https://twitter.com/RatAlertNFT" target="_new">
        <img width={30} src="/img/twitter.svg"
          style={{marginTop: '5px', marginRight: '10px', cursor: 'pointer'}}
        />
      </a>
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
      console.log(style);
      return (
        <Sider theme={style === 'ratMobileLight' ? 'dark' : 'light'} trigger={null} collapsible collapsed={this.state.collapsed}>
         <div className={style}>

          <Menu mode="inline" defaultSelectedKeys={[this.props.active.toString()]}>
            <Menu.Item style={{marginRight: '0px'}} key={1}><Link onClick={this.toggle.bind(this)} to="/">Game</Link></Menu.Item>
            <Menu.Item key={2}><Link onClick={this.toggle.bind(this)} to="/leaderboard">Leaderboard</Link></Menu.Item>
            <Menu.Item key={3}><Link onClick={this.toggle.bind(this)} to="/whitepaper">Whitepaper</Link></Menu.Item>
          </Menu>
          </div>
        </Sider>
      )
    }
  }

  renderMenu() {
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
    return (

      <div className={this.getNavStyle()}>
        <Menu mode="horizontal" defaultSelectedKeys={[this.props.active.toString()]}>
          <Menu.Item key={1}><Link to="/">Game</Link></Menu.Item>
          <Menu.Item key={2}><Link disabled={this.state.buttonsDisabled} to="/leaderboard">Leaderboard</Link></Menu.Item>
          <Menu.Item key={3}><Link disabled={this.state.buttonsDisabled} to="/whitepaper">Whitepaper</Link></Menu.Item>
          { admin && admin.includes(this.props.address) ? <Menu.Item key={4}><Link disabled={this.state.buttonsDisabled} to="/admin">Admin Dashboard</Link></Menu.Item> : null }
        </Menu>
      </div>
    );
  }

  getAccountData() {
    let Account;
    const Loading = props => {
      if (props.error) {
        return <div>Error!</div>;
      } else {
        return <div>Loading...</div>;
      }
    };
    if (!this.state.web3Loaded) {
      this.Account = Loadable({
        loader: () => import("./Account" /* webpackChunkName: "web3" */),
        loading: Loading
      });

      this.setState({web3Loaded: true});
    }

    if (this.Account) {
      Account = this.Account;
    }

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
        { this.renderIcons() }
        { this.state.collapsed ?
          this.getAccountData()
          : null}
      </div>
    )
  }
  renderTitle() {
    return (
      <div>
        <span className={`${this.getNavStyle()} logoTextHeader`}>
          RATalert
        </span>
        <div className={`${this.getNavStyle('bg')} logoLineHeader`}/>
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
    if (this.state.dayTime === 'night') {
      return 'skyNight';
    }
    if (this.state.dayTime === 'day') {
      return 'skyDay';
    }
    if (this.state.dayTime === 'morning') {
      return 'skyMorning';
    }
    if (this.state.dayTime === 'evening') {
      return 'skyEvening';
    }

  }

  getMobileNavStyle(bg = false) {
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


  render() {
    const skyAttr = this.getWidth('sky', true, 1440, 1000);
    return (

          <div>
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

export default RatMenu;
