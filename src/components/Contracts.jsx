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

  getWhitePaper() {
    return (
      <div id="container">
          <div id="bottom">
              <div id="content">
                  <main>
                      <h1 id="contracts">Contract Addresses</h1>
                      { this.props.readContracts && this.props.readContracts.Character ? <table>
                          <tr>
                              <td><a href="#chefs">Chefs</a> / <a href="#rats">Rats</a> (Characters)</td>
                              <td>
                              { this.props.readContracts.Character ? this.props.readContracts.Character.address : null}
                              </td>
                          </tr>
                          <tr>
                              <td><a href="#mcstake">McStake</a></td>
                              <td>
                                { this.props.readContracts.McStake ? this.props.readContracts.McStake.address : null}
                              </td>
                          </tr>
                          <tr>
                              <td><a href="#thestakehouse">TheStakeHouse</a></td>
                              <td>
                                { this.props.readContracts.TheStakeHouse ? this.props.readContracts.TheStakeHouse.address : null}
                              </td>
                          </tr>
                          <tr>
                              <td><a href="#lestake">LeStake</a></td>
                              <td>
                              { this.props.readContracts.LeStake ? this.props.readContracts.LeStake.address : null}
                              </td>
                          </tr>
                          <tr>
                              <td><a href="#gym">Gym</a></td>
                              <td>
                                { this.props.readContracts.Gym ? this.props.readContracts.Gym.address : null}
                              </td>
                          </tr>
                          <tr>
                              <td><a href="#ffood">$FFOOD</a></td>
                              <td>
                                { this.props.readContracts.FastFood ? this.props.readContracts.FastFood.address : null}
                              </td>
                          </tr>
                          <tr>
                              <td><a href="#cfood">$CFOOD</a></td>
                              <td>
                              { this.props.readContracts.CasualFood ? this.props.readContracts.CasualFood.address : null}
                              </td>
                          </tr>
                          <tr>
                              <td><a href="#gfood">$GFOOD</a></td>
                              <td>
                              { this.props.readContracts.GourmetFood ? this.props.readContracts.GourmetFood.address : null}

                              </td>
                          </tr>
                          <tr>
                              <td><a href="#gfood">KitchenShop</a></td>
                              <td>
                              { this.props.readContracts.KitchenShop ? this.props.readContracts.KitchenShop.address : null}

                              </td>
                          </tr>
                      </table> : <p>TBD</p>}
                  </main>
              </div>
          </div>
      </div>
    )
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

  renderWhitepaper() {
    const skyAttr = this.getWidth('sky', true, 1440, 1000);
    let height = this.state.height;
    setTimeout(() => {
      this.updateHeight();
    }, 100);

    return (
      <div className="main whitepaper" ref={this.whitepaperRef} style={{borderRadius: 30, border: '1px solid #CCCCCC', background: '#F5F5F5', marginLeft: 20, marginRight: 20, marginBottom: 20}}>
      <div className={this.getGradientClass()} style={{top: skyAttr.height, height: height - skyAttr.height}}>
      </div>
      { this.getWhitePaper() }
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
      return this.renderWhitepaper();
    }
  }
}

export default Whitepaper;
