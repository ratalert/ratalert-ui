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
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.address && !prevProps.address) {
      this.setState({
        loading: false
      });
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

  renderWhitepaper() {
    return (
      <div>
      <Row>
        <Col span={1}/>
        <Col span={22}>
          <strong>Contracts</strong>
        </Col>
        <Col span={1}/>
      </Row>
      <Row>
        <Col span={1}/>
        <Col span={11}>
          ChefRat
        </Col>
        <Col span={11}>
        { this.props.readContracts.ChefRat ? this.props.readContracts.ChefRat.address : null}
        </Col>
        <Col span={1}/>
      </Row>
      <Row>
        <Col span={1}/>
        <Col span={11}>
          KitchenPack
        </Col>
        <Col span={11}>
         { this.props.readContracts.KitchenPack ? this.props.readContracts.KitchenPack.address : null}
        </Col>
        <Col span={1}/>
      </Row>
      <Row>
        <Col span={1}/>
        <Col span={11}>
          FastFood
        </Col>
        <Col span={11}>
          { this.props.readContracts.FastFood ? this.props.readContracts.FastFood.address : null }
        </Col>
        <Col span={1}/>
      </Row>
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
