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
  Menu,
  Button,
  Dropdown,
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
import { LeftOutlined, DownOutlined } from "@ant-design/icons";
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
      selectedKitchen: 'McStake',
      height: 0,
      dayTime: this.props.dayTime,
    };
    this.nftProfit = 0;
    this.stakingLocations = ['McStake', 'TheStakeHouse', 'LeStake', 'Gym'];
  }

  getSelectedKitchen() {
    switch (this.state.selectedKitchen) {
      case 'McStake':
      return 'McStake ($FFOOD)';
      case 'TheStakeHouse':
      return 'TheStakeHouse ($CFOOD)';
      case 'LeStake':
      return 'LeStake ($FGOOD)';
    }
  }

  async selectKitchen(kitchen) {
    this.setState({ selectedKitchen: kitchen.key} );
    this.fetchGraph(`earned${kitchen.key}`);
  }

  componentDidMount() {
    window.addEventListener("dayTime", (e) => {
      this.setState({dayTime: e.detail.dayTime})
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.address && !prevProps.address) {
      this.setState({
        loading: false
      });
    }
  }

  async fetchGraph(type) {
    console.log(`Fetching ${type}`);
    let address = "";

    const query = `{
      characters
      (orderBy: ${type}, orderDirection: desc, first: 100)
      {
        id, staked, owner, URI, mcstakeStakingOwner, mcstakeStakedTimestamp, type,
        freak, skill, intelligence, bodymass, earnedMcStake, earnedLeStake, earnedTheStakeHouse,
      }
    }`;
    const result = await graphQLClient.request(query);
    let chefRats = [];
    await result.characters.map(r => {
      if (r.URI) {
        if (r.URI.indexOf("data:application/json;base64,") === 0) {
          const base64 = r.URI.split(",");
          const decoded = atob(base64[1]);
          const json = JSON.parse(decoded);
          r.id = parseInt(r.id, 16);
          r.attributes = json.attributes;
          if (r[type] > 0) {
            chefRats.push({
              owner: r.mcstakeStakingOwner !== '0x00000000' ? r.mcstakeStakingOwner : r.owner,
              name: json.name,
              type: r.attributes[0]['value'],
              attributes: r.attributes,
              freak: r.freak,
              skill: r.skill,
              intelligence: r.intelligence,
              bodymass: r.bodymass,
              img: json.image,
              profit: parseInt(r[type]),
            });
          }

        }
      }
    });
    console.log(chefRats, chefRats.length);
    const state = { loading: false, dataLoaded: true, results: chefRats };
    state['results'] = chefRats;
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

    await this.fetchGraph(`earned${this.state.selectedKitchen}`);
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
          <Col span={12}>{attributes[0].value === "Chef" ? "Freak level" : "Bodymass level"}</Col>
          <Col span={12}>
            <Progress
              strokeColor={attributes[0].value === "Chef" ? "blue" : "brown"}
              percent={ attributes[0].value === "Chef" ? hash['Freak percentage'] : hash['Body mass percentage'] }
              status="active" />
          </Col>
        </Row>
        <Row>
          <Col span={12}>{attributes[0].value === "Chef" ? "Insanity status" : "Body mass status"}</Col>
          <Col span={12}>{attributes[0].value === "Chef" ? hash['Freak'] : hash['Body mass']}</Col>
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
            percent={ type === 'Chef' ? hash['Freak percentage'] : hash['Body mass percentage'] } />
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

  renderItems(claims) {
    let small = false;
    if (window.innerWidth < 1000) {
      small = true;
    }
    small = true;

    return (
      <div className={'kitchen'}>
        <Row >
          <Col span={24}>
          <Row className={`kitchenRow_kitchen`}>
          { claims.map( (c) =>
            <div className="scene leaderboardCard">
              <div className="card">
                <div className="leaderBoardNum">{c.id}</div>
                <div className="leaderBoardAddress">
                  <Address fontSize={18} size={small ? 'large' : 'short'} address={c.owner} ensProvider={this.props.provider} />
                </div>
                <div className="card__face card__face--front">
                  { this.renderNFTColumn(c, 1, 'app', 'McStake') }
                </div>
              </div>
            </div>
          )}
          </Row>
          </Col>
        </Row>
      </div>
    )
  }

  renderAttribute(type, location) {
    let skill;
    let insanity;
    let intelligence;
    let bodymass;
    if (location === 'McStake') {
      skill = 2;
      insanity = 4;
      intelligence = 2;
      bodymass = 8;
    }
    else if (location === 'TheStakeHouse') {
      skill = 4;
      insanity = 6;
      intelligence = 4;
      bodymass = 6;
    }
    else if (location === 'LeStake') {
      skill = 6;
      insanity = 8;
      intelligence = 6;
      bodymass = 4;
    }

    switch (type) {
      case 'skill':
        return <div style={{width: '200px'}}>In the {location} kitchen, the chef's <img src="/img/skill.png"/> skill level increases {skill}% per day. </div>;
      case 'freak':
        return <div style={{width: '200px'}}>In the {location} kitchen, the chef's <img src="/img/insanity.png"/> freak level increases {insanity}% per day. When freak level reaches the state "insane" your chef might burn out.</div>;
      case 'intelligence':
          return <div style={{width: '200px'}}>In the {location} kitchen, the rats's <img src="/img/intelligence.png"/> intelligence level increases {intelligence}% per day. </div>;
      case 'bodymass':
          return <div style={{width: '200px'}}>In the {location} kitchen, the rats's <img src="/img/fatness.png"/> body mass level increases {bodymass}% per day. When the body mass reaches the state "obese" your rat might be kidnapped by a cat. </div>;

      break;
    }
  }

  renderNFTColumn(c, staked, type = 'app', location = false) {
    let hint;

    if (!c || !c.name) {
      return <div>&nbsp;</div>
    }
    let classNameImg = 'nft';
    let classNameStats = 'nftStats';
    if (type === 'modal') {
      classNameImg = 'nftModal'
      classNameStats = 'nftStatsModal'
    }
    return (
      <div className="nftCardFlipInner">
      <span >
        { type === 'app' ? <div className="nftId"><span style={{color: '#000000'}}>#</span>
        <span style={{color: '#d1c0b6'}}>{c.name}</span>
        </div> : null }
        <div
          style={{height: 170}}
          className={
            this.state.selectedNfts &&
            this.state.selectedNfts[c.name] &&
            this.state.selectedNfts[c.name]["status"] === true
              ? `nftSelected ${classNameImg}`
              : `nftNotSelected ${classNameImg}`
          }
        >
        <img  className={c.type === 'Chef' ? "nftImage nftChef" : "nftImage nftRat"} src={c.image}/>
        { type === 'app' && location !== 'Gym' && location !== false && this.state.toggleHint ? <div>
        <div className="nftHintBox">{hint}</div>
        </div> : null }
        </div>
        { this.renderNFTStats(c, staked, type, classNameStats, location) }
      </span>
      </div>
    )
  }

  renderNFTStats(c, staked, type = 'app', classNameStats, location = false) {
    let token;
    if (location === 'McStake') {
      token = 'Fast Food ($FFOOD)';
    }
    else if (location === 'TheStakeHouse') {
      token = 'Casual Food ($CFOOD)';
    }
    else if (location === 'LeStake') {
      token = 'Gourmet Food ($GFOOD)';
    }
    return (
      <div
      style={{height: 75}}
      className={`nftNotSelectedStats ${classNameStats}`}>
      <Popover mouseEnterDelay={1} content={c.type === 'Chef' ? this.renderAttribute.bind(this, 'skill', location) : this.renderAttribute.bind(this, 'intelligence', location)}>
      <Row>
        <Col style={{marginRight: '0px'}} xs={5} span={4}><img alt={c.type === 'Chef' ? 'Skill' : 'Intelligence'} src={c.type === 'Chef' ? "/img/skill.png" : "/img/intelligence.png"}/></Col>
        <Col xs={16} span={18}>
        <Progress
          format={() => <span>100<div className={this.getPercentageClass(c, 100, 1)}></div></span>}
          format={percent => <span>{percent}<div className={this.getPercentageClass(c, percent, 1)}></div></span>}
          className={c.type === 'Chef' ? "nftProgress chef-skill" : "nftProgress rat-intelligence"}
          strokeColor={c.type === "Chef" ? "#13e969" : "#1eaeea"}
          percent={ c.type === 'Chef' ? c.skillLevel : c.intelligenceLevel }
          size="small"
        />
        </Col>
      </Row>
      </Popover>
      <Popover mouseEnterDelay={1} content={c.type === 'Chef' ? this.renderAttribute.bind(this, 'freak', location) : this.renderAttribute.bind(this, 'bodymass', location)}>
      <Row>
      <Col style={{marginRight: '0px'}} xs={5} span={4}>
        <img src={c.type === 'Chef' ? "/img/insanity.png" : "/img/fatness.png"}/></Col>
        <Col xs={16} span={18}>
        <Progress
        format={() => <span>100<div className={this.getPercentageClass(c, 100, 2)}></div></span>}
        format={percent => <span>{percent}<div className={this.getPercentageClass(c, percent, 2)}></div></span>}
        className={c.type === 'Chef' ? "nftProgressSecondRow chef-insanity" : "nftProgressSecondRow rat-fatness"}
        strokeColor={c.type === "Chef" ? "#fc24ff" : "#ffae00"}
        percent={ c.type === 'Chef' ? c.freakLevel : c.bodymassLevel }
        size="small"
         />
        </Col>
      </Row>
      </Popover>
      {type !== 'modal' && this.stakingLocations.includes(c.stakingLocation) && c.mcstakeTimestamp > 0 ? (
        <div>

        <Row>
          <Col style={{marginRight: '5px', marginLeft: 5}} xs={3} span={2}>
            { c.stakingLocation !== 'Gym' ? <Popover content={`Your NFT earns ${token} tokens when staked into a kitchen.`}>
            <img src="/img/ffood.png"/>
            </Popover> : null }
          </Col>
          <Col span={7} className="funds" style={{color: '#fee017'}}>
            { c.stakingLocation !== 'Gym' ?
            <Popover content={`Amount of ${token} your NFTs have accumulated. Claim or unstake the NFT to retrieve the profit.`}>
              { c.profit }
            </Popover> : null }
          </Col>
        </Row>
        </div>
      ) :
      <div>

      </div>
    }

      </div>
    );
  }

  assignData(a) {
    return {
      id: a.id,
      owner: a.owner,
      name: parseInt(a.name.replace(/\D/g, '')),
      image: a.img,
      skillLevel: a.skill,
      freakLevel: a.freak,
      intelligenceLevel: a.intelligence,
      bodymassLevel: a.bodymass,
      type: a.type,
      stakingLocation: 'McStake',
      mcstakeTimestamp: 1,
      profit: a.profit,
    };
  }

  getPercentageClass(c, val, type) {
    let zero = '';
    let trait = '';
    if (val === 0) {
       zero = 'Zero';
    }

    if (type === 1) {
      if (c.type === 'Chef') {
        trait = 'Skill';
      } else {
        trait = 'Intelligence';
      }
    } else {
      if (c.type === 'Chef') {
        trait = 'Insanity';
      } else {
        trait = 'Bodymass';
      }
    }

    return `percentage${zero} percentage${trait}`;
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
        width: '7%',
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

    let height = this.state.height;
    if (height < 1000) {
      height = 1000;
    }
    setTimeout(() => {
      const node = document.getElementsByClassName('leaderboardTable')[0];
      if (node) {
        const rect = node.getBoundingClientRect();
        if (rect && rect.height) {
          height = rect.height;
        }
        this.setState({ height });
      }
    }, 2000);

    const leaderboard = [];
    chefRats.map((a) => {
      const c = this.assignData(a);
      leaderboard.push(c);
    });

    const sky = document.getElementsByClassName('sky')[0];
    const rect = sky.getBoundingClientRect();
    if (height < 1000) {
      height = 1000;
    }
    let width = window.innerWidth * 0.9
    if (width >= 1100) {
      width = 1100;
    }

    const kitchenSelect = (
      <Menu onClick={this.selectKitchen.bind(this)}>
        <Menu.Item key="McStake">McStake ($FFOOD) </Menu.Item>
        <Menu.Item key="TheStakeHouse">TheStakeHouse ($CFOOD) </Menu.Item>
        <Menu.Item key="LeStake">LeStake ($GFOOD) </Menu.Item>
      </Menu>
    );


    return (
      <div>
      <div className={this.getGradientClass()} style={{top: rect.height, height: height - skyAttr.height + 300}}>
      </div>
      <Row style={{ height: "100%", 'text-align': 'center' }}>
        <Col span={24}>
        <div className="leaderboardHeader">
          LEADERBOARD
        </div>
        </Col>
      </Row>
      <Row style={{ height: "100%", 'text-align': 'center' }}>
        <Col span={24}>
        <div className="leaderboardSelect">
        <Dropdown className="web3ButtonBlack" type={"default"} overlay={kitchenSelect}>
          <Button>
            {this.getSelectedKitchen()} <DownOutlined/>
          </Button>
        </Dropdown>
        </div>
        </Col>
      </Row>
      <Row style={{ height: "100%", 'text-align': 'center' }}>
        <Col span={24} ref={this.tableRef}>
          <div className="leaderboardTable" style={{width}}>
              { leaderboard.length > 0 ? this.renderItems(leaderboard) : <div style={{marginTop: 70}} className="whiteContent">No Chefs or Rats have earned any funds for {this.state.selectedKitchen} yet.</div> }
          </div>
        </Col>
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
