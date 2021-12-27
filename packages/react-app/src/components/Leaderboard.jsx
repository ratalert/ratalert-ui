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

class Leaderboard extends React.Component {
  constructor(props) {
    super(props);
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
      chefRats
      (orderBy: ${type}, orderDirection: desc, first: 100)
      {
        id, staked, owner, URI, stakingOwner, stakedTimestamp, type,
        insanity, skill, intelligence, fatness, earned
      }
    }`;

    const result = await request(APIURL, query);
    let chefRats = this.state.results;
    await result.chefRats.map(r => {
      if (r.URI) {
        if (r.URI.indexOf("data:application/json;base64,") === 0) {
          const base64 = r.URI.split(",");
          const decoded = atob(base64[1]);
          const json = JSON.parse(decoded);
          r.id =parseInt(r.id, 16),
          r.attributes = json.attributes;

          let found = 0;
          if (this.state.results && this.state.results.chefRats) {
            this.state.results.chefRats.map((s) => {
              if (s.id === r.id) {
                found = 1;
              }
            });
          }
          if (found === 0 && r.earned > 0) {
            chefRats.push({
              owner: r.stakingOwner !== '0x00000000' ? r.stakingOwner : r.owner,
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

    await this.fetchGraph('skill');
    await this.fetchGraph('insanity');
    await this.fetchGraph('intelligence');
    await this.fetchGraph('fatness');
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
          <Col span={12}>{attributes[0].value === "Chef" ? "Insanity level" : "Fatness level"}</Col>
          <Col span={12}>
            <Progress
              strokeColor={attributes[0].value === "Chef" ? "blue" : "brown"}
              percent={ attributes[0].value === "Chef" ? hash['Insanity percentage'] : hash['Fatness percentage'] }
              status="active" />
          </Col>
        </Row>
        <Row>
          <Col span={12}>{attributes[0].value === "Chef" ? "Insanity status" : "Fatness status"}</Col>
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
                key.trait_type !== 'Fatness' && key.trait_type !== 'Fatness percentage'
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
    return (
      <div>
        <Row>
          <Col span={small ? 2: 1}>{ type === 'Chef' ? 'I' : 'i' }</Col>
          <Col span={small ? 22: 23}>
            <Progress size="small" strokeColor={ type === 'Chef' ? 'green' : 'orange' } percent={ type === 'Chef' ? data.insanity : data.intelligence } />
          </Col>
        </Row>
        <Row>
          <Col span={small ? 2: 1}>{ type === 'Chef' ? 'S' : 'F' }</Col>
          <Col  span={small ? 22: 23}>
            <Progress size="small" strokeColor={ type === 'Chef' ? 'blue' : 'brown' } percent={ type === 'Chef' ? data.skill : data.fatness } />
          </Col>
        </Row>

      </div>
    );
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
        render: text => <span>{text}</span>,
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
        render: text => <span>{text}</span>,
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

    return (
      <Row style={{ height: "100%", 'text-align': 'center' }}>
        <Col span={1}/>
        <Col span={22}>
          <Table pagination={false} style={{width: '100%'}} columns={columns} dataSource={chefRats} />
        </Col>
        <Col span={1}/>
      </Row>
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
