import React from "react";
import {
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
    const node = document.getElementsByClassName('roadmap')[0];
    if (node) {
      const rect = node.getBoundingClientRect();
      if (rect && rect.height) {
        height = rect.height + 100;
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
      return this.renderGiveaway();
    }
  }
}

export default Giveaway;
