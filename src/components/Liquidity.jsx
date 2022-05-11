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
} from "antd";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { Link } from 'react-router-dom';
import { request, gql } from "graphql-request";
import Address from "./Address";
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

class Whitepaper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      windowHeight: window.innerHeight - 235,
      dataLoaded: false,
      dayTime: this.props.dayTime,
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
    const node = document.getElementsByClassName('whitepaper')[0];
    if (node) {
      const rect = node.getBoundingClientRect();
      if (rect && rect.height) {
        height = rect.height + 100;
      }
      this.setState({ height });
    }
  }

  renderLiquidity() {
    const skyAttr = this.getWidth('sky', true, 1440, 1000);
    let height = this.state.height;
    setTimeout(() => {
      this.updateHeight();
    }, 100);
    let ffoodContract;
    let casualFoodContract;
    let gourmetFoodContract;
    if (this.props.readContracts && this.props.readContracts.FastFood && this.props.readContracts.FastFood.address) {
      ffoodContract = this.props.readContracts.FastFood.address;
      casualFoodContract = this.props.readContracts.CasualFood.address;
      gourmetFoodContract = this.props.readContracts.GourmetFood.address;
    }

    return (
      <div className="main whitepaper" ref={this.whitepaperRef} style={{borderRadius: 30, border: '1px solid #CCCCCC', background: '#F5F5F5', marginLeft: 20, marginRight: 20, marginBottom: 20}}>
      <div className={this.getGradientClass()} style={{top: skyAttr.height, height: height - skyAttr.height}}>
      </div>
        <h2>Provide Liquidity to RatAlert and earn food tokens</h2>
        <p>The RatAlert DAO is rewarding active Liquidity providers with food tokens on a weekly basis. 10% of the supply of all 3 tokens is reserved for liquidity providers. Providing liquidity allows people to buy and sell food tokens. Your rewards share is proportional to the amount of liquidity you provide.</p>
        <h3>Staking functionality for rewards will be available by the end of the week!</h3>

        <table>
            <tr>
                <th><strong>Food Token</strong></th>
                <th><strong>Available Supply</strong></th>
                <th><strong>MATIC rewards/week</strong></th>
                <th><strong>ETH rewards/week</strong></th>
            </tr>
            <tr>
                <td>$FFOOD</td>
                <td>₣10,000,000</td>
                <td><strong>₣60,0000</strong></td>
                <td><strong>₣60,0000</strong></td>
            </tr>
            <tr>
                <td>$CFOOD</td>
                <td>₵1,000,000</td>
                <td><strong>₵6,000</strong></td>
                <td><strong>₵6,000</strong></td>
            </tr>
            <tr>
                <td>$CFOOD</td>
                <td>₲100,000</td>
                <td><strong>₲600</strong></td>
                <td><strong>₲600</strong></td>
            </tr>
        </table>
        {
          /*
        <p>
        You can provide your Uniswap liquidity <a target="_new" href="https://app.uniswap.org/#/pool?chain=polygon">here</a>. Be sure to have the contracts added!
        </p>
        */
        }
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
      return this.renderLiquidity();
    }
  }
}

export default Whitepaper;
