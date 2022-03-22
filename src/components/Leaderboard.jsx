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

class Leaderboard extends React.Component {
  constructor(props) {
    super(props);
    this.tableRef = React.createRef();
    this.state = {
      windowHeight: window.innerHeight - 235,
      dataLoaded: false,
      results: [],
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

  async fetchGraph(type) {
    let address = "";

    const query = `{
      characters
      (orderBy: ${type}, orderDirection: desc, first: 100)
      {
        id, staked, owner, URI, mcstakeStakingOwner, mcstakeStakedTimestamp, type,
        freak, skill, intelligence, bodymass, earned
      }
    }`;

    const result = await graphQLClient.request(query);
    let chefRats = this.state.results;
    await result.characters.map(r => {
      if (r.URI) {
        if (r.URI.indexOf("data:application/json;base64,") === 0) {
          const base64 = r.URI.split(",");
          const decoded = atob(base64[1]);
          const json = JSON.parse(decoded);
          r.id = parseInt(r.id, 16);
          r.attributes = json.attributes;

          let found = 0;
          if (this.state.results && this.state.results.characters) {
            this.state.results.characters.map((s) => {
              if (s.id === r.id) {
                found = 1;
              }
            });
          }
          if (found === 0 && r.earned > 0) {
            if (r.insanity > 0) {
              //console.log(r);
            }
            chefRats.push({
              owner: r.stakingOwner !== '0x00000000' ? r.mcstakeStakingOwner : r.owner,
              name: json.name,
              type: r.attributes[0]['value'],
              attributes: r.attributes,
              insanity: r.insanity,
              skill: r.skill,
              intelligence: r.intelligence,
              fatness: r.fatness,
              img: json.image,
              profit: parseInt(r.earned),
            });
          }
        }
      }
    });


    const state = { loading: false, dataLoaded: true, results: chefRats };
    if (type === 'fatness') {
      state['results'] = chefRats;
      state['dataLoaded'] = true;

    } else {
      state['results'] = chefRats;
    }
    this.setState(state);
  }

  decToHex(dec) {
    return (+dec).toString(16);
  }

  async componentWillMount() {
    window.addEventListener("resize", this.handleResize);
    setTimeout(() => {
      if (!this.props.address) {
        this.setState({ noAddressLoaded: true, loading: false });
      } else {
        this.setState({ loading: false, noAddressLoaded: false });
      }
    }, 2800);

    // await this.fetchGraph('skill');
    await this.fetchGraph('insanity');
    // await this.fetchGraph('intelligence');
    // await this.fetchGraph('fatness');
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize = e => {
    this.setState({ windowHeight: window.innerHeight - 235 });
  };

  renderNFTInfo(attributes, img) {
    const hash = {};
    attributes.map((m) => {
      hash[m.trait_type] = m.value;
    });

    return (
      <div style={{ width: "300px" }}>
        <Row>
          <Col span={24}>
            <img width={100} src={img} />
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <b>Training levels</b>
          </Col>
        </Row>
        <Row>
          <Col span={12}>{attributes[0].value === "Chef" ? "Skill level" : "Intelligence"}</Col>
          <Col span={12}>
            <Progress
            strokeColor={attributes[0].value === "Chef" ? "green" : "orange"}
            percent={ attributes[0].value === "Chef" ? hash['Skill percentage'] : hash['Intelligence percentage'] }
            status="active" />
          </Col>
        </Row>
        <Row>
          <Col span={12}>{attributes[0].value === "Chef" ? "Skill status" : "Intelligence status"}</Col>
          <Col span={12}>{attributes[0].value === "Chef" ? hash['Skill'] : hash["Intelligence"]}</Col>
        </Row>
        <Row>
          <Col span={12}>{attributes[0].value === "Chef" ? "Insanity level" : "Bodymass level"}</Col>
          <Col span={12}>
            <Progress
              strokeColor={attributes[0].value === "Chef" ? "blue" : "brown"}
              percent={ attributes[0].value === "Chef" ? hash['Insanity percentage'] : hash['Fatness percentage'] }
              status="active" />
          </Col>
        </Row>
        <Row>
          <Col span={12}>{attributes[0].value === "Chef" ? "Insanity status" : "Body mass status"}</Col>
          <Col span={12}>{attributes[0].value === "Chef" ? hash['Insanity'] : hash['Fatness']}</Col>
        </Row>

        <Row>
          <Col span={24}>
            <b>Attributes</b>
          </Col>
        </Row>

        { attributes.map( (key) => (

              <div>
              {
                key.trait_type !== 'Insanity' && key.trait_type !== 'Insanity percentage' &&
                key.trait_type !== 'Skill' && key.trait_type !== 'Skill percentage' &&
                key.trait_type !== 'Intelligence' && key.trait_type !== 'Intelligence percentage' &&
                key.trait_type !== 'Fatness' && key.trait_type !== 'Fatness percentage' &&
                key.value.length > 0
                ?
              <Row>
                <Col span={12}>{key.trait_type}</Col>
                <Col span={12}>{key.value}</Col>
              </Row> : null }
              </div>
            )
        )}
      </div>
    );
  }

  renderProgress(type, small, data) {
    const hash = {};
    data.attributes.map((m) => {
      hash[m.trait_type] = m.value;
    });


    return (
      <div>
        <Row>
          <Col span={small ? 2: 1}>{ type === 'Chef' ? <img src="/img/skill.png"/> : <img src="/img/intelligence.png"/> }</Col>
          <Col span={small ? 22: 23}>
            <Progress
            size="small"
            strokeColor={ type === 'Chef' ? '#13e969' : '#1eaeea' }
            format={percent => <span style={{color: '#000000'}}>{percent}%</span>}
            percent={ type === 'Chef' ? hash['Skill percentage'] : hash['Intelligence quotient'] } />
          </Col>
        </Row>
        <Row>
          <Col span={small ? 2: 1}>{ type === 'Chef' ? <img src="/img/insanity.png"/> : <img src="/img/fatness.png"/> }</Col>
          <Col  span={small ? 22: 23}>
            <Progress
            size="small"
            format={percent => <span style={{color: '#000000'}}>{percent}%</span>}
            strokeColor={ type === 'Chef' ? '#fc24ff' : '#ffae00' }
            percent={ type === 'Chef' ? hash['Insanity percentage'] : hash['Fatness percentage'] } />
          </Col>
        </Row>

      </div>
    );
  }

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

  renderLeaderBoard() {
    let small = false;
    if (window.innerWidth < 1000) {
      small = true;
    }

    const columns = [
      {
        title: '#',
        dataIndex: 'id',
        key: 'id',
        width: '1%',
        render: (text, c, i) => this.renderId(i),
      },
      {
        title: 'NFT',
        dataIndex: 'img',
        key: 'nft',
        width: '5%',
        render: (text, c) => <Popover mouseEnterDelay={1} content={this.renderNFTInfo(c.attributes, text)} title={c.name}>
                        <img src={text} />
                      </Popover>,

      },
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        width: '4%',
        render: text => <span>{text}</span>,
      },
      {
        title: 'Owner',
        dataIndex: 'owner',
        key: 'owner',
        width: '15%',
        render: text => <span><Address fontSize={small ? 12 : 28} size={small ? 'large' : 'short'} address={text} ensProvider={this.props.provider} /></span>,
      },
      {
        title: 'Training Level',
        dataIndex: 'insanity',
        key: 'insanity',
        width: '30%',
        render: (text, data) => (
            this.renderProgress(data.type, small, data)
        )
      },
      {
        title: 'Profit',
        dataIndex: 'profit',
        key: 'profit',
        width: '5%',
        defaultSortOrder: 'descend',
        sorter: (a, b) => a.profit - b.profit,
        render: text => <span><img style={{marginRight: '5px'}} src="/img/ffood.png"/>{text}</span>,
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
    let chefRats = this.state.results;
    let i = 1;
    chefRats.map((c) => {
      chefRats[i-1]['id'] = i;
      i += 1;
    })

    chefRats = chefRats.sort((a, b) => parseInt(a.id) > parseInt(b.id));
    const skyAttr = this.getWidth('sky', true, 1440, 1000);
    const node = this.tableRef.current;
    let height = chefRats.length * 120;
    if (node) {
      const rect = node.getBoundingClientRect();
      if (rect.height) {
        height = rect.height;
      }
    }

    return (
      <div>
      <div className="nightGradient" style={{top: skyAttr.height, height: height - 600}}>
      </div>
      <Row style={{ height: "100%", 'text-align': 'center' }}>
        <Col span={1}/>
        <Col span={22} ref={this.tableRef}>
          <Table pagination={false} style={{width: window.innerWidth * 0.8}} columns={columns} dataSource={chefRats} />
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
      return this.renderLeaderBoard();
    }
  }
}

export default Leaderboard;
