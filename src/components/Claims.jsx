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
  Checkbox,
} from "antd";
import { useEventListener } from "eth-hooks/events/useEventListener";

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
import { Link } from 'react-router-dom';
import { GraphQLClient, gql } from 'graphql-request'

import Address from "./Address";

const APIURL = `${process.env.REACT_APP_GRAPH_URI}`;
const graphQLClient = new GraphQLClient(APIURL, {
    mode: 'cors',
});

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

import {
  InputNumber,
} from "antd";

class Claims extends React.Component {
  constructor(props) {
    super(props);
    this.tableRef = React.createRef();
    this.state = {
      windowHeight: window.innerHeight - 235,
      dataLoaded: false,
      results: [],
      filter: null,
      dayTime: this.props.dayTime,
      height: 0,
    };
    this.nftProfit = 0;
  }

  componentDidUpdate(prevProps) {
    if (this.props.address && !prevProps.address) {
      this.setState({
        loading: false
      });
    }
  }

  async fetchGraph() {
    let address = "";

    const query = `{
       claims(first: 999, orderBy: timestamp, orderDirection: desc, where: {
         owner: "${this.props.address || "0x2f7CdD90AB83405654eE10FC916a582a3cDe7E6F"}"
        }) {
        id,owner, tokenId, tolerance,
        efficiency, eventName, earned, timestamp, foodTokensPerRat,
        kitchen, type, unstaked, URI,
      }
    }`;

    const result = await graphQLClient.request(query);
    let chefRats = this.state.results;
    let claims = [];
    await result.claims.map(r => {
      if (r.URI) {
        if (r.URI.indexOf("data:application/json;base64,") === 0) {
          const base64 = r.URI.split(",");
          const decoded = atob(base64[1]);
          const json = JSON.parse(decoded);
          r.id = r.id;
          r.attributes = json.attributes;
          let found = 0;
          if (this.state.results && this.state.results.characters) {
            this.state.results.characters.map((s) => {
              if (s.id === r.id) {
                found = 1;
              }
            });
          }
          if (found === 0 && r.earned >= 0) {
            claims.push({
              owner: r.owner,
              type: r.type,
              name: json.name,
              id: parseInt(json.name.replace(/\D/g, '')),
              rowKey: r.id,
              attributes: r.attributes,
              tokenId: r.tokenId,
              tolerance: r.tolerance,
              efficiency: r.efficiency,
              eventName: r.eventName,
              earned: r.earned,
              timestamp: r.timestamp,
              kitchen: r.kitchen,
              unstaked: r.unstaked,
              img: json.image,
            });
          }
        }
      }
    });


    const state = { loading: false, dataLoaded: true, results: chefRats };
    state['results'] = claims;
    this.setState(state);
  }

  decToHex(dec) {
    return (+dec).toString(16);
  }

  async componentWillMount() {
    window.addEventListener("resize", this.handleResize);
    setTimeout(async() => {
      if (!this.props.address) {
        this.setState({ noAddressLoaded: true, loading: false });
      } else {
        this.setState({ loading: false, noAddressLoaded: false });
      }
      await this.fetchGraph();
    }, 1000);

    // await this.fetchGraph('skill');

    // await this.fetchGraph('intelligence');
    // await this.fetchGraph('fatness');
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize = e => {
    this.setState({ windowHeight: window.innerHeight - 235 });
  };

  renderId(i) {
    return (i+1).toString();
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

  renderEvent(data) {
    let eventName;
    let staked;
    let width;
    let height;
    if (parseInt(data.unstaked) === 0) {
      staked = 'Claim:';
    } else {
      staked = 'Unstake:';
    }
    if (data.eventName.length === 0) {
      eventName = <span>{staked}<br/>Level up</span>;
    } else {
      let image;
      let alt;
      switch (data.eventName) {
        case 'foodInspector':
        alt = 'Food Inspector';
        image = 'food_inspector.gif';
        width = 200;
        height = 200;
        break;
        case 'ratTrap':
        alt = 'Rat Trap';
        image = 'rat_trap.gif';
        width = 338;
        height = 200;
        break;
        case 'cat':
        alt = 'Cat';
        image = 'cat.gif';
        width = 313;
        height = 200;
        break;
        case 'burnout':
        alt = 'Burnout';
        image = 'burnout.gif';
        width = 269;
        height = 200;
        break;

      }
      let factor;
      if (window.innerWidth < 900) {
        factor = 0.3;
      } else {
        factor = 0.5;
      }
      eventName = <span>{staked}<br/><Popover mouseEnterDelay={0.25} content={alt}><img style={{ width: width*factor, height: height*factor }} src={`/img/${image}`}/></Popover></span>;
    }
    return eventName;
  }

  renderResult(data) {
    let filename = '';
    if (data.kitchen === 'McStake') {
        filename = 'ffood.png';
    }
    if (data.kitchen === 'TheStakeHouse') {
        filename = 'cfood.png';
    }
    if (data.kitchen === 'LeStake') {
        filename = 'gfood.png';
    }

    if (data.type === 'Chef') {
      return (
        <div>
        <Row>
          <Col span={24}>
            Skill:
          </Col>
          <Col span={24}>
            <img src="/img/skill.png"/>&nbsp;
            {data.efficiency}%
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            Freak:
          </Col>
          <Col span={24}>
            <img src="/img/insanity.png"/>&nbsp;
            {data.tolerance}%
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            Earned:
          </Col>
          <Col span={24}>
            { data.earned > 0 && filename ? <div><img width={12} src={`/img/${filename}`}/>&nbsp;{data.earned}</div> : 0 }
          </Col>
        </Row>
        </div>
      )
    }

    if (data.type === 'Rat') {
      return (
        <div>
        <Row>
          <Col span={24}>
            Intelligence:
          </Col>
          <Col span={24}>
            <img src="/img/intelligence.png"/>&nbsp;
            {data.efficiency}%
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            Bodymass:
          </Col>
          <Col span={24}>
            <img src="/img/fatness.png"/>&nbsp;
            {data.tolerance}%
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            Earned:
          </Col>
          <Col span={24}>
            <img width={20} src="/img/ffood.png"/>&nbsp;
            {data.earned}
          </Col>
        </Row>
        </div>
      )
    }

  }

  componentDidMount() {
    window.addEventListener("dayTime", (e) => {
      this.setState({dayTime: e.detail.dayTime})
    });
  }

  onChange(val) {
    this.setState({ filter: val })
  }

  getTextClass() {
    if (this.state.dayTime === 'night') {
      return 'white';
    }
    if (this.state.dayTime === 'day') {
      return 'white';
    }
    if (this.state.dayTime === 'morning') {
      return 'black';
    }
    if (this.state.dayTime === 'evening') {
      return 'black';
    }
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

  renderKitchen(text) {
    if (text === 'Gym') {
      return text;
    }
    if (text === 'McStake') {
      return <div style={{width: 50, height: 50}} className="mcStake"/>
    }
    if (text === 'TheStakeHouse') {
      return <div style={{width: 50, height: 50}} className="theStakeHouse"/>
    }
    if (text === 'LeStake') {
      return <div style={{width: 50, height: 50}} className="leStake"/>
    }
    return null;
  }

  toggleOnlyEvents() {
    this.setState({ onlyEvents: !this.state.onlyEvents });
  }

  renderLeaderBoard() {
    let small = false;
    if (window.innerWidth < 1000) {
      small = true;
    }

    const columns = [
      {
        title: 'NFT',
        dataIndex: 'img',
        key: 'id',
        width: '5%',
        render: (text, c) => <img style={{width: window.innerWidth > 900 ? 100 : 50}} src={text} />
      },
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        width: '10%',
        render: (text, c) => <span>{text}</span>
      },

      {
        title: 'Event',
        dataIndex: 'event',
        key: 'event',
        width: '50px',
        render: (text, data) => (
            this.renderEvent(data)
        )
      },
      {
        title: 'Result',
        dataIndex: 'result',
        key: 'result',
        width: '30%',
        render: (text, data) => (
            this.renderResult(data)
        )
      },
      {
        title: 'Kitchen',
        dataIndex: 'kitchen',
        key: 'kitchen',
        width: '1%',
        render: (text, c) => this.renderKitchen(text)
      },
      {
        title: 'Date',
        dataIndex: 'timestamp',
        key: 'timestamp',
        width: '20%',
        render: (text, c) => <span>{new Date(parseInt(text)*1000).toISOString().substr(0,16).replace('T', ' ')}</span>
      },

    ];

    if (!this.state.dataLoaded) {
      return (
        <Row style={{ height: "100%", 'text-align': 'center' }}>
          <Col span={24}>
            <Spin/>
          </Col>
        </Row>
      );
    }
    let allClaims = this.state.results;
    let claims = [];
    let i = 1;

    allClaims.map((a) => {
      if (this.state.filter > 0) {
        //console.log(a.id, this.state.filter);
        if (a.id === this.state.filter && !this.state.onlyEvents) {
          claims.push(a);
        } else if (a.id === this.state.filter && this.state.onlyEvents)
          if (a.eventName && a.eventName.length > 0) {
            claims.push(a);
        }
      } else {
        if (!this.state.onlyEvents) {
          claims.push(a);
        } else {
          if (a.eventName && a.eventName.length > 0) {
            claims.push(a);
          }
        }
      }
    });

    //claims = claims.sort((a, b) => parseInt(a.id) > parseInt(b.id));
    const skyAttr = this.getWidth('sky', true, 1440, 1000);
    const node = this.tableRef.current;
    let height = this.state.height;
    if (height < 1000) {
      height = 1000;
    }
    setTimeout(() => {
      const node = document.getElementsByClassName('claimsTable')[0];
      if (node) {
        const rect = node.getBoundingClientRect();
        if (rect.height) {
          height = rect.height;
        }
        this.setState({ height });
      }
    }, 500);


    const sky = document.getElementsByClassName('sky')[0];
    const rect = sky.getBoundingClientRect();
    if (height < 1000) {
      height = 1000;
    }
    let width = window.innerWidth * 0.9
    if (width >= 800) {
      width = 800;
    }
    return (
      <div>
      <div className={this.getGradientClass()} style={{top: rect.height, height: height - skyAttr.height + 500}}>
      </div>
      <Row style={{ height: "100%", 'text-align': 'center' }}>
        <Col span={24}>
        <div className={`leaderboardHeader ${this.getTextClass()}`}>
          CLAIMS HISTORY
        </div>
        </Col>
      </Row>
      <Row style={{ height: "100%", 'text-align': 'center' }}>
        <Col span={24}>
        <div className="main" ref={this.tableRef}>
          { claims.length >= 0 ? <div>
          <span className={`claimText ${this.getTextClass()}`}>Enter the NFT ID you want to filter the events for: &nbsp;
          <InputNumber min={1} max={50000} controls={false} onChange={this.onChange.bind(this)} />
          </span>
          <p className={`claimText ${this.getTextClass()}`}>
            <Checkbox className={`claimText ${this.getTextClass()}`} onChange={this.toggleOnlyEvents.bind(this)}>Only include history with events</Checkbox>
          </p>
          </div> : null }

          { claims.length > 0 ? <Table className="claimsTable" rowKey={this.getRowKey} pagination={false} style={{width}} columns={columns} dataSource={claims} /> :
            <p className={`claimText ${this.getTextClass()}`}>You have no claims yet. Please claim your characters first. You can claim a character by selecting one or more NFTs and clicking the Claim button</p>
         }
        </div>
        </Col>
      </Row>
      </div>
    );
  }

  getRowKey(k) {
    return k.rowKey;
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
      return this.renderLeaderBoard();
    }
  }
}

export default Claims;
