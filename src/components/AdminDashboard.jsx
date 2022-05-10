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
  InputNumber,
} from "antd";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { Link } from 'react-router-dom';
import Address from "./Address";
import config from '../config.js';
import { GraphQLClient, gql } from 'graphql-request'
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
import { contracts } from '../contracts/contracts.js';


const APIURL = `${process.env.REACT_APP_GRAPH_URI}`;
const graphQLClient = new GraphQLClient(APIURL, {
    mode: 'cors',
});

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

class AdminDashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      windowHeight: window.innerHeight - 235,
      dataLoaded: false,
      dayTime: this.props.dayTime,
      freeMints: [],
      whitelists: [],
      vrfClaims: [],
      vrfMints: [],
      id: 0,
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

    this.fetchGraph();
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

  getNetworkName() {
    const chainId = this.props.chainId;
    const networkName = this.props.networkName;
    return { networkName, chainId };
  }

  async fetchGraph() {

    const freeMintsQL = `{ freeMints(first: 1000, where: {
        }) {
          id, maxCount, currentCount, firstUsed, lastUsed
        }
      }`;
    const whitelistsQL = `{ whitelists(first: 1000, where: {

        }) {
          id, maxCount, currentCount, firstUsed, lastUsed
        }
      }`;

    const vrfMintsQL = `{ vrfmints(first: 1000, where: {

          }) {
             id, owner, requestCreated, requestFulfilled
          }
        }`;
    const vrfClaimsQL = `{ vrfclaims(first: 1000, where: {
              }) {
                 id, owner, requestCreated, requestFulfilled
              }
            }`;

    let freeMints;
    try {
      freeMints = await graphQLClient.request(freeMintsQL);
    } catch (e) {
      console.log('ERROR', e);
      this.setState({ graphError: true });
      return;
    }

    let whitelists;
    try {
      whitelists = await graphQLClient.request(whitelistsQL);
    } catch (e) {
      console.log('ERROR', e);
      this.setState({ graphError: true });
      return;
    }

    let vrfMints;
    try {
      vrfMints = await graphQLClient.request(vrfMintsQL);
    } catch (e) {
      console.log('ERROR', e);
      this.setState({ graphError: true });
      return;
    }

    let vrfClaims;
    try {
      vrfClaims = await graphQLClient.request(vrfClaimsQL);
    } catch (e) {
      console.log('ERROR', e);
      this.setState({ graphError: true });
      return;
    }

    this.setState({
      whitelists: whitelists.whitelists,
      freeMints: freeMints.freeMints,
      vrfClaims: vrfClaims.vrfclaims,
      vrfMints: vrfMints.vrfmints,
    });


  }

  renderDuration(c) {
    if (c.requestFulfilled) {
      return c.requestFulfilled - c.requestCreated;
    } else {
      return 0;
    }

  }
  renderDate(text) {
    if (text) {
      const d = new Date(text * 1000);
      return d.toISOString().substr(0, 16).replace('T', ' ');
    }
  }

  renderAttributes() {
    return (
      <div style={{background: '#CCCCCC'}}>
        <img width={100} height={100} src={this.state.img}/>
        <br/>
        { JSON.stringify(this.state.json)}
      </div>
    );
  }

  async onChange(val) {
    const { networkName, chainId } = this.getNetworkName();
    this.setState({ id: val })

    const CharacterContract = new ethers.Contract(config[networkName].Character,
      contracts[chainId][networkName].contracts.Character.abi, this.props.provider);


      const URI = await CharacterContract.tokenURI(parseInt(val));
      if (URI.indexOf("data:application/json;base64,") === 0) {
        const base64 = URI.split(",");
        const decoded = atob(base64[1]);
        const json = JSON.parse(decoded);
        const img = json.image;
        delete json.image;
        this.setState({ json, img });
      }
  }

  renderDashboard() {
    const { networkName, chainId } = this.getNetworkName();
    console.log(networkName, chainId, config);
    const skyAttr = this.getWidth('sky', true, 1440, 1000);
    const node = this.whitepaperRef.current;
    let height = 0;
    if (node) {
      const rect = node.getBoundingClientRect();
      height = rect.top + rect.height;
    }
    const admin = config[networkName].admin;
    if (!admin.includes(this.props.address)) {
      console.log('Not included in list');
      return <div></div>;
    }

    const columns = [
      {
        title: 'Address',
        dataIndex: 'id',
        key: 'id',
      },
      {
        title: 'Max Count',
        dataIndex: 'maxCount',
        key: 'maxCount',
      },
      {
        title: 'Current Count',
        dataIndex: 'currentCount',
        key: 'currentCount',
      },
      {
        title: 'Created',
        dataIndex: 'firstUsed',
        key: 'firstUsed',
        render: (text, c, i) => this.renderDate(text),

      },
      {
        title: 'Last Used',
        dataIndex: 'lastUsed',
        key: 'lastUsed',
        sorter: (a, b) => a.lastUsed - b.lastUsed,
        render: (text, c, i) => this.renderDate(text),
      }

    ];


    const vrf = [
      {
        title: 'Request',
        dataIndex: 'id',
        key: 'id',
      },
      {
        title: 'Owner',
        dataIndex: 'owner',
        key: 'owner',
      },
      {
        title: 'Request Created',
        dataIndex: 'requestCreated',
        key: 'requestCreated',
        defaultSortOrder: 'ascend',
        sorter: (a, b) => a.requestCreated - b.requestCreated,
        render: (text, c, i) => this.renderDate(text),
      },
      {
        title: 'Request fulfilled',
        dataIndex: 'requestFulfilled',
        key: 'requestFulfilled',
        render: (text, c, i) => this.renderDate(text),
      },
      {
        title: 'Duration',
        dataIndex: 'id',
        key: 'duration',
        render: (text, c, i) => this.renderDuration(c),
      },

    ];
    console.log(this.state.vrfMints.length);
    return (
      <div ref={this.whitepaperRef} style={{width: window.innerWidth * 0.9, borderRadius: 30, marginLeft: 20, marginRight: 20, marginBottom: 20}}>
      <div className={this.getGradientClass()} style={{top: skyAttr.height, height: height - skyAttr.height}}>
      </div>

      <Row style={{ height: "100%", 'text-align': 'center' }}>
        <Col span={24}>
        <div className="main" ref={this.tableRef}>
          <span className={`claimText`}>Enter the NFT ID to display raw data: &nbsp;
          <InputNumber min={1} max={50000} controls={false} onChange={this.onChange.bind(this)} />
          </span>
        </div>

        { this.state.id > 0 ?
          this.renderAttributes() : null

        }
        </Col>
      </Row>

      <h1>Whitelist</h1>
      <Table pagination={false} style={{width: window.innerWidth * 0.85}} columns={columns} dataSource={this.state.whitelists} />
      <h1>Free Mints</h1>
      <Table pagination={false} style={{width: window.innerWidth * 0.85}} columns={columns} dataSource={this.state.freeMints} />
      <h1>VRF Mints</h1>
      <Table pagination={false} style={{width: window.innerWidth * 0.85}} columns={vrf} dataSource={this.state.vrfMints} />
      <h1>VRF Claims</h1>
      <Table pagination={false} style={{width: window.innerWidth * 0.85}} columns={vrf} dataSource={this.state.vrfClaims} />

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
      return this.renderDashboard();
    }
  }
}

export default AdminDashboard;
