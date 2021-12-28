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
import { request, gql } from "graphql-request";
import Loadable from "react-loadable"

const Account = React.lazy(() => import('./Account'));

import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
const APIURL = `${process.env.REACT_APP_GRAPH_URI}/subgraphs/name/ChefRat`;

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
        chefRat(id:"${hex}") {
          id, URI
        }
      }`;
    const result = await request(APIURL, query);
    if (result.chefRat) {
      const URI = result.chefRat.URI;
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
      const filter = {
        address: this.props.readContracts.ChefRat.address,
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

        if (
          decoded[1] &&
          decoded[0] &&
          decoded[1].toString() === this.props.address &&
          decoded[0].toString() === "0x0000000000000000000000000000000000000000"
        ) {
          setTimeout(async () => {
            const { name, image } = await this.getNFTObject(decoded[2]);
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
        <img width={32} src="https://cdn-icons-png.flaticon.com/512/2922/2922037.png" style={{marginTop: '5px', marginRight: '10px', border: '1px solid #000000', 'border-radius': '10px', cursor: 'pointer'}} onClick={this.addToken.bind(this)}/>
        <a target="_new"
          href={`https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=${this.props.readContracts.FastFood && this.props.readContracts.FastFood.address ? this.props.readContracts.FastFood.address : null}`}
            >
          <img width={32} src="https://cryptologos.cc/logos/uniswap-uni-logo.png?v=014" style={{marginTop: '5px', marginRight: '10px', border: '1px solid #000000', 'border-radius': '10px', cursor: 'pointer'}}/>
        </a>
        <a href="https://opensea.io/" target="_new">
          <img width={32} src="https://user-images.githubusercontent.com/35243/140804979-0ef11e0d-d527-43c1-93cb-0f48d1aec542.png"
            style={{marginTop: '5px', marginRight: '10px', border: '1px solid #000000', 'border-radius': '10px', cursor: 'pointer'}}
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
            <Menu.Item style={{marginRight: '0px'}} icon={<DashboardOutlined />} key={1}><Link onClick={this.toggle.bind(this)} to="/">Game</Link></Menu.Item>
            <Menu.Item icon={<OrderedListOutlined />} key={2}><Link onClick={this.toggle.bind(this)} to="/leaderboard">Leaderboard</Link></Menu.Item>
            <Menu.Item icon={<FileTextOutlined />} key={3}><Link onClick={this.toggle.bind(this)} to="/whitepaper">Whitepaper</Link></Menu.Item>
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
          <Menu.Item icon={<DashboardOutlined />} key={1}><Link to="/">Game</Link></Menu.Item>
          <Menu.Item icon={<OrderedListOutlined />} key={2}><Link to="/leaderboard">Leaderboard</Link></Menu.Item>
          <Menu.Item icon={<FileTextOutlined />} key={3}><Link to="/whitepaper">Whitepaper</Link></Menu.Item>
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

  render() {
    return (
          <Layout>
            { this.renderMobileMenu() }
            <Layout>
            <PageHeader ghost={false} title="Rat Alert" subTitle={this.renderMenu()} extra={this.renderExtra()}></PageHeader>
            <Content>{ this.props.content }</Content>
            <Footer>Footer</Footer>
            </Layout>
          </Layout>
    );
  }
}

export default RatMenu;
