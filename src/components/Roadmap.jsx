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

class Roadmap extends React.Component {
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

  getRoadmap() {
    return (
      <div id="container">
          <div id="bottom">
              <div id="content">
                  <h1 style={{marginTop: 10}}>Roadmap</h1>
                  <img src="../assets/roadmap.png" width="100%" alt="alt_text" title="image_tooltip" />

                  <h2 style={{marginTop: 10}}>Setup DAO</h2>
                  <p>
                    As mentioned in the Whitepaper, RatAlert is going to be a <strong>DAO</strong>. In <strong>Q2/2022</strong>, we plan to provide the necessary infrastructure and tools to establish the <strong>RatAlert DAO</strong>. All development decisions and game parameters will be decided by the DAO in the future.
                  </p>
                  <h2 style={{marginTop: 10}}>Playable Cat</h2>
                  <p>
                    While the cat was mentioned in the V1 whitepaper, it is still just a random event that can occur. We plan to have <strong>mintable cat NFTs</strong>, by the time chefs and rats are eligible to mint them in Q2/2022. Cats are able to kidnap up to 5 random obese rats and steal their loot every day.
                  </p>
                  <h2 style={{marginTop: 10}}>Kitchen rental market</h2>
                  <p>
                    A big milestone is the kitchen rental market for the <strong>“TheStakehouse“</strong> kitchen. The kitchen of the casual restaurant allows you to stake up to 10 chefs into your kitchen. The rental market allows you to rent out <strong>unused kitchen space</strong> to other people for a custom <strong>$CFOOD</strong> daily price. Earn extra <strong>$CFOOD</strong> with your unused kitchen spaces!
                  </p>
                  <h2 style={{marginTop: 10}}>Kitchen items</h2>
                  <p>
                    We plan to offer custom kitchen upgrades for <strong>“TheStakehouse”</strong> and <strong>“LeStake”</strong> kitchen like better kitchen stoves or additional kitchen equipment, enabling you to earn more <strong>$CFOOD</strong> or <strong>$GFOOD</strong> on a daily basis. Kitchen upgrades (see rental market above) increase the daily rent you can ask from your tenants.
                  </p>
                  <h2 style={{marginTop: 10}}>Additional kitchen events</h2>
                  <p>
                    We’re also planning to have extra kitchen events that will make the game more realistic and fun. Everybody is afraid of fires in their homes, so are your chefs. A really smart chef might buy a <strong>fire extinguisher</strong> to be prepared for a kitchen fire. God knows what would happen otherwise, right?
                  </p>
                  <h2 style={{marginTop: 10}}>Dice Games</h2>
                  <p>
                    We want to make unstaking and claiming more fun. You’ll be able to opt in to extra <strong>mini dice games</strong> when interacting with your NFTs. No risk, no fun! Who knows, maybe you’ll be able to <strong>double</strong> your rewards?
                  </p>
                  <h2 style={{marginTop: 10}}>Breeding recipes</h2>
                  <p>
                    What is a chef without his <strong>secret sauce</strong>? The recipe upgrade will allow the most skillful chefs to create their own recipes by burning the right combination of food tokens. Recipes will boost your chef’s earnings significantly if you decide to keep them for yourself…
                  </p>
                  <h2 style={{marginTop: 10}}>New Game Sequel</h2>
                  <p>
                    In our minds, RatAlert is just the beginning of a <strong>whole universe of games</strong>. We are already thinking about a sequel that will re-use the RatAlert characters and tokens in a new game with <strong>all-new game mechanics</strong> and features in 2023. The RatAlert DAO would essentially become a P2E DAO with multiple games at that point.
                  </p>
              </div>
          </div>
      </div>
    )
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

  renderRoadmap() {
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
      { this.getRoadmap() }
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
      return this.renderRoadmap();
    }
  }
}

export default Roadmap;
