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

class Dao extends React.Component {
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

  renderDAO() {
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
        <h2>DAO</h2>
        <p>The RatAlert Decentralized autonomous organization is allowing everyone that has a stake in GFOOD (gourmet food) to vote on proposals and decide the future of the game.</p>
        <p>In order to participate in the DAO proposals, you need to have GFOOD at the time of proposal in your wallet. The DAO is providing liquidity to swap your GFOOD and CFOOD at Quickswap:</p>
        <ul>
          <li><a target="_new" href="https://quickswap.exchange/#/swap?inputCurrency=0x2721d859EE8d03599F628522d30f14d516502944&outputCurrency=0x57d43Cfe565A2e6C181662aE73A9F1EC6A830351">FFOOD / GFOOD</a></li>
          <li><a target="_new" href="https://quickswap.exchange/#/swap?inputCurrency=0x33CC3b1852939Ef8CFd77BB5c3707cF2D3E72490&outputCurrency=0x57d43Cfe565A2e6C181662aE73A9F1EC6A830351">CFOOD / GFOOD</a></li>
        </ul>
        <p>The <a target="_new" href="https://www.tally.xyz/governance/eip155:137:0xb85F643F9bb94a30c1B95e9dC3bADff771B749A6">DAO proposals</a> are available at <a target="_new" href="https://www.tally.xyz/governance/eip155:137:0xb85F643F9bb94a30c1B95e9dC3bADff771B749A6">Tally</a>. Use tally to view and vote for proposals. Before voting be sure to use the "Delegate yourself" function at Tally to activate your voting power.</p>

        <p>Discussions happen at the <strong>#dao-proposals</strong> discord channel at <a target="_new" href="https://discord.gg/RatAlert">Discord server</a></p>
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
      return this.renderDAO();
    }
  }
}

export default Dao;
