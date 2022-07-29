import React from "react";
import { withRouter } from 'react-router-dom';
import {
  Alert,
  Table,
  Tag,
  Space,
  Row,
  Col,
  Spin,
  Progress,
  Popover,
  Button,
  Form,
  Input,
} from "antd";
import { Helmet } from 'react-helmet';
import { useEventListener } from "eth-hooks/events/useEventListener";
import { Link } from 'react-router-dom';
import { request, gql } from "graphql-request";
import Address from "./Address";
import TwitterLogin from "react-twitter-login";
const ethereum_address = require('ethereum-address');
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
const superagent = require('superagent');

import { LeftOutlined } from "@ant-design/icons";
import "../whitepaper.css";
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

const API_URL = process.env.REACT_APP_API_URL;

class Giveaway extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      windowHeight: window.innerHeight - 235,
      dataLoaded: false,
      dayTime: this.props.dayTime,
      url: false,
      loggedIn: false,
      twitterName: null,
      validationFailed: false,
      addressValidationFailed: false,
      discordValidationFailed: false,
      submissionComplete: false,
      clicked: false,
      url: false,
      mode: false,
      loading: true,
    };
    this.whitepaperRef = React.createRef();
  }

  componentDidUpdate(prevProps) {
    if (this.props.address && !prevProps.address) {
      this.setState({
        loading: false
      });
    }
  }

  async componentDidMount() {
    window.addEventListener("dayTime", (e) => {
      this.setState({dayTime: e.detail.dayTime})
    });

    const status = await superagent.get(`${API_URL}/giveaway/status`);
    console.log(status.body);
    if (status && status.body) {
      this.setState({ drawType: status.body.drawType, amount: status.body.amount, valid: status.body.valid, loggedIn: status.body.loggedIn, twitterName: status.body.twitterName })
      if (!status.body.loggedIn) {
        const link = await superagent.get(`${API_URL}/giveaway/link`);
        if (link && link.text) {
          console.log(link.text);
          this.setState({ url: link.text });
        }
      }
    }
    window.focus()
    window.addEventListener("blur", () => {
      setTimeout(() => {
        if (document.activeElement.tagName === "IFRAME") {
          this.setState({ clicked: true })
          console.log('Token:', this.state.token);
          window.Gleam.push([this.state.token, '1']);
        }
      });
    }, { once: true });

    if (this.props.location.search === '?action=dexscreener&token=cfood') {
      this.setState({loading: false, token: 'cfood', url: 'https://dexscreener.com/polygon/0xb42d4b3080c83571ad1b2864a8c430972db41269'});
    }
    else if (this.props.location.search === '?action=dexscreener&token=ffood') {
      this.setState({loading: false, token: 'ffood', url: 'https://dexscreener.com/polygon/0x8351e0d1373e56da6e45daa9eb44c0e634f28c68'});
    }
    else if (this.props.location.search === '?action=dexscreener&token=gfood') {
      this.setState({loading: false, token: 'gfood', url: 'https://dexscreener.com/polygon/0xde60363e5f7f876c7ae383625e83ee64f43443a6'});
    } else {
      this.setState({loading: false, url: 'https://gleam.io/YtE9H/embed?amp', mode: 'gleam'});
      if (window.innerWidth < 900) {
        window.location.href = 'https://gleam.io/YtE9H/ratalert-1000-nft-minted-giveaway';
      }
    }

    console.log(this.props.location);

  }

  async componentWillMount() {
    window.addEventListener("resize", this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize = e => {
    this.setState({ windowHeight: window.innerHeight - 235 });
  };

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

  getGradientClass() {
    if (this.state.dayTime === 'night') {
      return 'nightGradient gradient';
    }
    if (this.state.dayTime === 'day') {
      return 'dayGradient gradient';
    }
    if (this.state.dayTime === 'morning') {
      return 'morningGradient gradient';
    }
    if (this.state.dayTime === 'evening') {
      return 'eveningGradient gradient';
    }
  }

  updateHeight() {
    let height = this.state.height;
    const node = document.getElementsByClassName('iframe')[0];
    if (node) {
      const rect = node.getBoundingClientRect();
      if (rect && rect.height) {
        height = rect.height + 200;
      }
      this.setState({ height });
    }
  }

  redirect() {
    window.location.href = this.state.url;
  }

  renderLoggedOut() {
    return (
      <div>
        <h2>Giveaway Address submission</h2>
        <p>Congratulations on winning a giveaway! Please sign in with your twitter account to submit your address.</p>
        { this.state.url ?
          <Button onClick={this.redirect.bind(this)}>Sign in with Twitter</Button> : null }
      </div>
    )
  }

  async onFinish(data) {
    if (data.address && data.discord) {
      if (data.address.indexOf('0x') !== 0) {
        this.setState({ addressValidationFailed: true, validationFailed: false, discordValidationFailed: false });
        return;
      }
      if (!ethereum_address.isAddress(data.address)) {
        this.setState({ addressValidationFailed: true, validationFailed: false, discordValidationFailed: false });
        return;
      }

      const discord = await superagent.get(`${API_URL}/giveaway/discord?user=${data.discord}`);
      if (discord && discord.body) {
        if (!discord.body.valid) {
          this.setState({ addressValidationFailed: false, validationFailed: false, discordValidationFailed: true });
          return;
        }
      }


      const wl = await superagent.get(`${API_URL}/giveaway/update-role?role=whitelist`);
      const address = await superagent.get(`${API_URL}/giveaway/update-address?address=${data.address}`);
      if (address.body.success && wl.body.success) {
        this.setState({ submissionComplete: true, addressValidationFailed: false, validationFailed: false, discordValidationFailed:false });
      }
      this.setState({ addressValidationFailed: false, validationFailed: false, discordValidationFailed:false });
    } else {
      this.setState({ validationFailed: true, discordValidationFailed: false, addressValidationFailed: false });
    }
  }

  renderLoggedIn() {
    if (this.state.submissionComplete) {
        return (
          <div>
            <h2>Giveaway Address submission</h2>
            { this.state.drawType === 'WL' ? <p>You've been added to the whitelist. A discord role has been assigned as well.</p> : null}
            { this.state.drawType === 'mint' ? <p>You have been added to the free mint list. Your address still needs to be transferred to the smart contracts, this can take up to <strong>72 hours</strong>. Please be patient.</p> : null}
            { this.state.drawType === 'cash' ? <p>Your <strong>${this.state.amount} USDC</strong> on the Polygon MATIC network will be transferred your address within 48 hours.</p> : null}
            <p>To find out more about RatAlert, feel free to take a look at our Infographics below</p>
            <img src="../assets/infographic.png" width="100%"  />
            <p>You can also check out the <a href="/whitepaper">whitepaper</a> as well.</p>
          </div>
        )
    }
    if (!this.state.valid) {
      return (
        <div>
          <h2>Giveaway Address submission</h2>
          <p>Welcome @{this.state.twitterName}. You have not won a giveaway yet. Please keep trying!</p>
        </div>
      );
    }

    return (
      <div>
        <h2>Giveaway Address submission</h2>
        <p>Welcome @{this.state.twitterName}</p>
        { this.state.drawType === 'WL' ? <p>Congratulations on winning a <strong>whitelist</strong> spot! Please submit your data now to claim your prize.</p> : null }
        { this.state.drawType === 'cash' ? <p>Congratulations on winning <strong>${this.state.amount} USDC</strong> on the Polygon MATIC Network! Please submit your data now to claim your prize.</p> : null }
        { this.state.drawType === 'mint' ? <p>Congratulations on winning a <strong>free mint</strong> for RatAlertNFT! Please submit your data now to claim your prize.</p> : null }

        <Form
            name="login"
            initialValues={{
                remember: true,
            }}
            onFinish={this.onFinish.bind(this)}
        >

        <p>Please join our <a target="_new" href="https://discord.gg/RatAlert">Discord server</a>, you will be assigned a special role reflecting your status. Please enter your Discord ID in the format <strong>username#1234</strong>.</p>

        <Form.Item
            label="Discord ID"
            name="discord"
            rules={[
                {
                    message: 'Please enter your discord name!',
                },
            ]}
        >
            <Input />
        </Form.Item>

        <p>Please enter your Polygon MATIC address, you can use any Ethereum address (metamask recommended). It starts with 0x.</p>
        <Form.Item
            label="MATIC address"
            name="address"
            rules={[
                {
                    message: 'Please enter your address!',
                },
            ]}
        >
            <Input />
        </Form.Item>

        { this.state.validationFailed ? <p style={{color: 'red'}}>Please fill in both fields!</p> : null }
        { this.state.addressValidationFailed ? <p style={{color: 'red'}}>Please enter a valid MATIC address.</p> : null }
        { this.state.discordValidationFailed ? <p style={{color: 'red'}}>Please enter a valid Discord ID. Maybe you forgot to join our server? Enter it in the format Username#1234.</p> : null }


        <Form.Item>
            <Button type="primary" htmlType="submit">
                Submit Giveaway-Info
            </Button>
        </Form.Item>


        </Form>

      </div>
    )
  }

  renderGiveaway() {
    const skyAttr = this.getWidth('sky', true, 1440, 1000);
    const node = this.whitepaperRef.current;
    let height = this.state.height;
    setTimeout(() => {
      this.updateHeight();
    }, 100);

    return (
      <div className="main roadmap" ref={this.whitepaperRef} style={{borderRadius: 30, border: '1px solid #CCCCCC', background: '#F5F5F5', marginLeft: 20, marginRight: 20, marginBottom: 20}}>
      <div className={this.getGradientClass()} style={{top: skyAttr.height, height: height - skyAttr.height}}>
      </div>

      { this.state.loggedIn ? this.renderLoggedIn() : this.renderLoggedOut() }
      </div>
    );
  }

  renderGleam() {
    const skyAttr = this.getWidth('sky', true, 1440, 1000);
    const node = this.whitepaperRef.current;
    let height = this.state.height;
    setTimeout(() => {
      this.updateHeight();
    }, 100);

    let iframeHeight = 0;
    let iframeWidth = 0;
    let top=0;
    let left = 0;
    let headerLeft;
    if (this.state.mode === 'gleam') {
      iframeHeight = 1100;
      if (window.innerWidth < 900) {
        top = 180;
        iframeWidth = window.innerWidth * 0.70;
        headerLeft = window.innerWidth * 0.20;
      } else {
        top = 170;
        if (window.innerWidth > 1200) {
          iframeWidth = 450;
        }
        else if (window.innerWidth > 1100) {
          iframeWidth = 400;
        } else {
          iframeWidth = 350;
        }

        headerLeft = window.innerWidth * 0.20;
      }
      if (window.innerWidth < 900) {
        left = window.innerWidth * 0.20;
      } else {
        left = window.innerWidth * 0.25 + iframeWidth;
      }
    } else {
      iframeHeight = window.innerHeight * 0.7;
      iframeWidth = window.innerWidth * 0.50
      top = 270;
      left = window.innerWidth * 0.25;
    }


    return (
      <>
      <Helmet>
        <title>{this.props.location && this.props.location.pathname === '/herrcooles' ? '0xHerrCooles ' : null}RatAlert 1000 NFT Giveaway</title>
      </Helmet>
      <div className="giveaway" ref={this.whitepaperRef} style={{paddingLeft: window.innerWidth / 2 - 200 }}>
      <div className={this.getGradientClass()} style={{top: skyAttr.height, height: height - skyAttr.height}}>
      </div>
      { this.state.mode !== 'gleam' ?
      <Alert
        message="Gleam Task"
        style={{position: 'absolute', left: window.innerWidth * 0.25, top: 150, width: window.innerWidth * 0.5}}
        description={
          !this.state.clicked ?
          <div>
            Click on the <strong>🚀 Icon</strong> in the <strong>window below</strong> to complete your task!
          </div> :
          <div>
            Task completed. Please return to Gleam.
          </div>

        }
        type="info"
        closable={false}
        /> : window.innerWidth > 900 ?
        <Alert
          message={<div><h3>Welcome to RatAlert Giveaway!</h3></div>}
          style={{position: 'absolute', left: headerLeft, top: 170, width: iframeWidth}}
          description={
            <div>
              RatAlert has just minted 1000 NFTs. We're celebrating it with an NFT giveaway.<br/><br/>
              <strong>Prizes</strong>:
              <ul>
                <li>1 Gen0 Club555 NFT</li>
                <li>$20 in MATIC</li>
                <li>$10 in MATIC</li>
              </ul>
              In addition, you can earn <strong>free Gen1 mints</strong> by taking part in the <strong>Mint 2, get one free</strong> action!<br/>
              <img width={iframeWidth * 0.9} src="/img/mint2_getonefree.png"/>
            </div>

          }
          type="info"
          closable={false}
          /> : null
       }

      <iframe style={{position: 'absolute', top, left, margin: '0 auto', border: '5px solid #E5E5E5', width: iframeWidth, height: iframeHeight}} id="iframe" className="iframe" scrolling="auto" layout=""
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation"
        src={this.state.url} resizable
        >
      </iframe>
      </div>
      </>
    );
  }

  render() {
    if (this.state.loading) {
      return (

        <Row style={{ height: window.innerHeight-140, textAlign: 'center' }}>
          <Col span={24}>
          <Spin size="large"/>
          </Col>
        </Row>
      );
    } else {
      return this.renderGleam();
    }
  }
}
export default withRouter(Giveaway);
