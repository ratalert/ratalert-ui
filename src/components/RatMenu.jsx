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
    };
    this.Account = null;
    this.nftProfit = 0;
  }

  toggle() {
    this.setState({
      collapsed: !this.state.collapsed,
    });
  };

  componentDidMount() {
    window.addEventListener("resize", this.handleResize);
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
      const base64 = URI.split(",");
      const decoded = atob(base64[1]);
      const json = JSON.parse(decoded);
      return { image: json.image, name: json.name };
    }
    return { image: "", name: "" };
  }

  decToHex(dec) {
    return (+dec).toString(16);
  }

  async componentWillMount() {
    setTimeout(async () => {
      console.log('Start mint hook');
      const filter = {
        address: this.props.readContracts.Character.address,
        topics: [
          // the name of the event, parnetheses containing the data type of each event, no spaces
          ethers.utils.id("Transfer(address,address,uint256)"),
        ],
      };
      let format = ["address", "address", "uint256"];

      this.props.provider.on(filter, async data => {
        data.topics.shift();

        let i = 0;
        const decoded = [];
        data.topics.map(v => {
          const tmp = ethers.utils.defaultAbiCoder.decode([format[i]], v);
          i += 1;
          decoded.push(tmp);
        });

        console.log(decoded);
        if (
          decoded[1] &&
          decoded[0] &&
          decoded[1].toString() === this.props.address &&
          decoded[0].toString() === "0x0000000000000000000000000000000000000000"
        ) {
          setTimeout(async () => {
            const { name, image } = await this.getNFTObject(decoded[2]);
            console.log(`NFT ${name} minted`);
            if (image) {
              renderNotification(
                "info",
                "NFT minted",
                <div>
                  <img style={{ paddingRight: "10px" }} width={50} src={image} />
                  <b>{name}</b> has been minted
                </div>,
              );
            }
          }, 10000);
        }
      });
    }, 7500);
  }

  handleResize = e => {
    this.setState({ windowHeight: window.innerHeight - 235 });
  };

  async addToken() {
    const tokenAddress = this.props.readContracts.FastFood.address;
    const tokenSymbol = 'FFOOD';
    const tokenDecimals = 18;
    const tokenImage = 'http://placekitten.com/200/300';

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

  renderIcons() {
    if (!this.state.collapsed) {
      return (
        <div></div>
      );
    }
    return (
      <div className="icons">
      <a href="https://opensea.io/" target="_new">
        <img width={30} src="/img/opensea.png"
          style={{marginTop: '5px', marginRight: '10px', cursor: 'pointer'}}
        />
      </a>
      <a href="https://app.uniswap.org/" target="_new">
        <img width={30} src="/img/uniswap.png"
          style={{marginTop: '5px', marginRight: '10px', cursor: 'pointer'}}
        />
      </a>
      <a href="https://discord.gg/DP36aCq8P4" target="_new">
        <img width={30} src="/img/discord.png"
          style={{marginTop: '5px', marginRight: '10px', cursor: 'pointer'}}
        />
      </a>
      <a href="https://twitter.com/RatAlertNFT" target="_new">
        <img width={30} src="/img/twitter.png"
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
      return (
        <Sider theme="light" trigger={null} collapsible collapsed={this.state.collapsed}>
         <div className="logo" />
          <Menu mode="inline" defaultSelectedKeys={[this.props.active.toString()]}>
            <Menu.Item style={{marginRight: '0px'}} key={1}><Link onClick={this.toggle.bind(this)} to="/">Game</Link></Menu.Item>
            <Menu.Item  key={2}><Link onClick={this.toggle.bind(this)} to="/leaderboard">Leaderboard</Link></Menu.Item>
            <Menu.Item  key={3}><Link onClick={this.toggle.bind(this)} to="/whitepaper">Whitepaper</Link></Menu.Item>
          </Menu>
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
          <MenuUnfoldOutlined className="trigger" onClick={this.toggle.bind(this)}/>
          : <MenuFoldOutlined className="trigger" onClick={this.toggle.bind(this)}/>
        }
        </div>
      );
    }
    return (

      <div>
        <Menu mode="horizontal" defaultSelectedKeys={[this.props.active.toString()]}>
          <Menu.Item key={1}><Link to="/">Game</Link></Menu.Item>
          <Menu.Item key={2}><Link to="/leaderboard">Leaderboard</Link></Menu.Item>
          <Menu.Item key={3}><Link to="/whitepaper">Whitepaper</Link></Menu.Item>
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
          !this.state.web3Loaded ? this.getAccountData() : this.getAccountData()
          : null}
      </div>
    )
  }
  renderTitle() {
    return (
      <div>
        <span className="logoTextHeader">
          RATalert
        </span>
        <div className="logoLineHeader"/>
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

  render() {
    const skyAttr = this.getWidth('sky', true, 1440, 1000);
    return (

          <div>
          <div className="sky" style={skyAttr}>
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
