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
import { Helmet } from 'react-helmet';
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
      week: 0,
    };

    this.nftProfit = 0;
    this.stakingLocations = ['McStake', 'TheStakeHouse', 'LeStake', 'Gym'];
  }

  getSelectedWeek() {
    const week0 = this.getWeekData(0);
    const week1 = this.getWeekData(1);
    const week2 = this.getWeekData(2);

    if (this.state.week === 0) {
      return <span>Current Week: {this.getWeek(0)}</span>
    }
    if (this.state.week === 1) {
      return <span>Last Week: {this.getWeek(1)}</span>
    }
    if (this.state.week === 2) {
      return <span>Week {this.getWeek(2)}</span>
    }
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
    this.setState({ loading: true, selectedKitchen: kitchen.key} );
    //this.fetchGraph(`earned${kitchen.key}`);
    await this.fetchClaims(kitchen.key, this.state.week);
  }

  async weekSelect(week) {
    this.setState({ week: parseInt(week.key), loading: true } );
    //this.fetchGraph(`earned${kitchen.key}`);
    await this.fetchClaims(this.state.selectedKitchen, parseInt(week.key));
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
    const state = { loading: false, dataLoaded: true, results: chefRats };
    state['results'] = chefRats;
    this.setState(state);
  }

  getWeekData(weeksBack) {
    var lastMonday = new Date();
    lastMonday.setDate(lastMonday.getDate() - weeksBack * 7);
    lastMonday.setDate(lastMonday.getDate() - (lastMonday.getDay() + 6) % 7);
    lastMonday.setUTCHours(0);
    lastMonday.setUTCMinutes(0);
    lastMonday.setUTCSeconds(0);
    const start = lastMonday.toISOString().substr(0,10);

    var nextMonday = new Date();
    nextMonday.setDate(lastMonday.getDate() + 6 );
    nextMonday.setUTCHours(23);
    nextMonday.setUTCMinutes(59);
    nextMonday.setUTCSeconds(59);
    const end = nextMonday.toISOString().substr(0,10)
    return { start, end };
  }

  getWeek(d = false) {
    if (d === 0) {
        d = new Date();
    }
    if (d === 1) {
        d = new Date();
        d.setDate(d.getDate() - 1 * 7);
    }
    if (d === 2) {
        d = new Date();
        d.setDate(d.getDate() - 2 * 7);
    }

    const date = new Date(d.getTime());

    // Find Thursday of this week starting on Monday
    date.setDate(date.getDate() + 4 - (date.getDay() || 7));
    const thursday = date.getTime();

    // Find January 1st
    date.setMonth(0); // January
    date.setDate(1);  // 1st
    const jan1st = date.getTime();

    // Round the amount of days to compensate for daylight saving time
    const days = Math.round((thursday - jan1st) / 86400000); // 1 day = 86400000 ms
    return Math.floor(days / 7) + 1;
  }

  async fetchClaims(type, weeksBack = 0) {
    console.log('Fetching', type);
    var lastMonday = new Date();
    lastMonday.setDate(lastMonday.getDate() - weeksBack * 7);
    lastMonday.setDate(lastMonday.getDate() - (lastMonday.getDay() + 6) % 7);
    lastMonday.setUTCHours(0);
    lastMonday.setUTCMinutes(0);
    lastMonday.setUTCSeconds(0);
    const startTimestamp = parseInt(lastMonday.getTime() / 1000);
    var nextMonday = new Date();
    nextMonday.setDate(lastMonday.getDate() + 6 );
    nextMonday.setUTCHours(0);
    nextMonday.setUTCMinutes(0);
    nextMonday.setUTCSeconds(0);
    const endTimestamp = parseInt(nextMonday.getTime() / 1000);

    const week = await this.getWeek(lastMonday);
    let address = "";

    const query = `{
      claims
      (first: 1000, orderBy: timestamp, orderDirection: desc, where: { kitchen: "${type}" })
      {
        id, earned, kitchen, type, timestamp, owner, URI, tokenId, efficiency, tolerance,
      }
    }`;
    const result = await graphQLClient.request(query);
    let chefRats = [];
    let nfts = {};
    if (result && result.claims) {
      result.claims.map(r => {
        if (r.timestamp >= startTimestamp && r.timestamp <= endTimestamp) {
          const base64 = r.URI.split(",");
          const decoded = atob(base64[1]);
          const json = JSON.parse(decoded);
          r.id = parseInt(r.id, 16);
          r.attributes = json.attributes;

          if (!nfts[r.tokenId]) {
            nfts[r.tokenId] = {};
            //nfts[r.tokenId].id = 0;
            nfts[r.tokenId].freak = 0;
            nfts[r.tokenId].type = r.type;
            nfts[r.tokenId].skill = 0;
            nfts[r.tokenId].intelligence = 0;
            nfts[r.tokenId].bodymass = 0;
            nfts[r.tokenId].profit = 0;
            nfts[r.tokenId]['img'] = json.image;
          }

          if (r.type === 'Chef') {
            r.skill = r.efficiency;
            r.freak = r.tolerance;
          }
          if (r.type === 'Rat') {
            r.intelligence = r.efficiency;
            r.bodymass = r.tolerance;
          }

          nfts[r.tokenId]['profit'] += parseInt(r.earned);
          nfts[r.tokenId]['name'] = json.name;
          nfts[r.tokenId]['owner'] = r.owner;
          if (r.freak > nfts[r.tokenId].freak) {
            nfts[r.tokenId]['freak'] = parseInt(r.freak);
            nfts[r.tokenId]['img'] = json.image;

          }
          if (r.skill > nfts[r.tokenId].skill) {
            nfts[r.tokenId]['skill'] = parseInt(r.skill);
            nfts[r.tokenId]['img'] = json.image;

          }
          if (r.intelligence > nfts[r.tokenId].intelligence) {
            nfts[r.tokenId]['intelligence'] = parseInt(r.intelligence);
            nfts[r.tokenId]['img'] = json.image;

          }
          if (r.bodymass > nfts[r.tokenId].bodymass) {
            nfts[r.tokenId]['bodymass'] = parseInt(r.bodymass);
            nfts[r.tokenId]['img'] = json.image;
          }
        }

      });
    }
    let characters = [];
    await Object.keys(nfts).map((n) => {
      characters.push(nfts[n]);
    });
    characters.sort((a,b) => b.profit - a.profit);
    const state = { loading: false, dataLoaded: true, results: characters };
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

    //await this.fetchGraph(`earned${this.state.selectedKitchen}`);
    await this.fetchClaims(this.state.selectedKitchen, this.state.week);
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
    let tokenImage;
    if (this.state.selectedKitchen === 'McStake') {
      token = 'Fast Food ($FFOOD)';
      tokenImage = 'ffood.png';
    }
    else if (this.state.selectedKitchen === 'TheStakeHouse') {
      token = 'Casual Food ($CFOOD)';
      tokenImage = 'cfood.png';
    }
    else if (this.state.selectedKitchen === 'LeStake') {
      token = 'Gourmet Food ($GFOOD)';
      tokenImage = 'gfood.png';
    }

    return (
      <div
      style={{height: 75}}
      className={`nftNotSelectedStats ${classNameStats}`}>
      <Popover mouseEnterDelay={1} content={c.type === 'Chef' ? this.renderAttribute.bind(this, 'skill', location) : this.renderAttribute.bind(this, 'intelligence', location)}>
      <Row>
        <Col style={{marginRight: '0px'}} xs={3} span={3}><img alt={c.type === 'Chef' ? 'Skill' : 'Intelligence'} src={c.type === 'Chef' ? "/img/skill.png" : "/img/intelligence.png"}/></Col>
        <Col span={16}>
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
      <Col style={{marginRight: '0px'}} xs={3} span={3}>
        <img src={c.type === 'Chef' ? "/img/insanity.png" : "/img/fatness.png"}/></Col>
        <Col span={16}>
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
          <Col style={{marginRight: '5px', marginLeft: 0}} xs={3} span={3}>
            { c.stakingLocation !== 'Gym' ? <Popover content={`Your NFT earns ${token} tokens when staked into a kitchen.`}>
            <img width={16} src={`/img/${tokenImage}`}/>
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

    return `percentageLeader${zero} percentage${trait}`;
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

  getCompetitionProfit(place) {
    switch (this.state.selectedKitchen) {
      case 'McStake':
      if (place === 1) {
        return '1000 FFOOD';
      }
      if (place === 2) {
        return '500 FFOOD';
      }
      if (place === 3) {
        return '250 FFOOD';
      }
      break;
      case 'TheStakeHouse':
      if (place === 1) {
        return '400 CFOOD';
      }
      if (place === 2) {
        return '200 CFOOD';
      }
      if (place === 3) {
        return '100 CFOOD';
      }
      break;
      case 'LeStake':
      if (place === 1) {
        return '40 CFOOD';
      }
      if (place === 2) {
        return '20 GFOOD';
      }
      if (place === 3) {
        return '10 GFOOD';
      }
      break;
    }
    return 0;
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
        <>
        <Helmet>
          <title>RatAlert Leaderboard</title>
        </Helmet>
        <Row style={{ height: "100%", 'text-align': 'center' }}>
          <Col span={24}>
            <Spin/>
          </Col>
        </Row>
        </>
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

    const week0 = this.getWeekData(0);
    const week1 = this.getWeekData(1);
    const week2 = this.getWeekData(2);

    const weekSelect = (
      <Menu onClick={this.weekSelect.bind(this)}>
        <Menu.Item key="0">Current Week {this.getWeek(0)}: {week0.start} - {week0.end}</Menu.Item>
        <Menu.Item key="1">Last week {this.getWeek(1)}: {week1.start} - {week1.end}</Menu.Item>
        <Menu.Item key="2">Week {this.getWeek(2)}: {week2.start} - {week2.end}</Menu.Item>
      </Menu>
    );


    return (
      <>
      <Helmet>
        <title>RatAlert Leaderboard</title>
      </Helmet>
      <div>
      <div className={this.getGradientClass()} style={{top: rect.height, height: height - skyAttr.height + 300}}>
      </div>
      <Row style={{ height: "100%", 'text-align': 'center' }}>
        <Col span={24}>
        <div className={`leaderboardHeader ${this.getTextClass()}`}>
          LEADERBOARD
        </div>
        </Col>
      </Row>
      <Row style={{ height: "100%", 'text-align': 'center' }}>
        <Col xs={4} lg={8}/>
        <Col xs={8} lg={4}>
        <div className="leaderboardSelect">
        <Dropdown className="web3ButtonBlack" type={"default"} overlay={kitchenSelect}>
          <Button>
            {this.getSelectedKitchen()} <DownOutlined/>
          </Button>
        </Dropdown>
        </div>
        </Col>
        <Col xs={8} lg={4}>
        <div className="leaderboardSelect">
        <Dropdown className="web3ButtonBlack" type={"default"} overlay={weekSelect}>
          <Button>
            {this.getSelectedWeek()} <DownOutlined/>
          </Button>
        </Dropdown>
        </div>
        </Col>
      </Row>
      <Row style={{ height: "100%", 'text-align': 'left' }}>
        <Col xs={1} lg={7}/>
        <Col xs={20} lg={10}>
          <div className={`leaderboardSubHeader ${this.getTextClass()}`}>
            {this.state.selectedKitchen} Leaderboard Competition Rules:
          </div>
          <p className={`leaderboardText ${this.getTextClass()}`}>
          <ul>
            <li>Each week, a new leaderboard competition starts, for each kitchen. Each week starts on Monday 00:00 UTC to Sunday 23:59:59 UTC.</li>
            <li>To participate, just regularly claim profit from your NFT. Accumulated Profit for each NFT in the leaderboard is automatically summed up.</li>
            <li>The NFTs that are on Place #1, #2, #3 on Sunday at 23:59:59 win these prizes:
              <ul>
                <li>Top #1: {this.getCompetitionProfit(1)}</li>
                <li>Top #2: {this.getCompetitionProfit(2)}</li>
                <li>Top #3: {this.getCompetitionProfit(3)}</li>
              </ul>
            </li>
          <li>You can participate in all kitchens you have NFTs in!</li>
          <li>Winners are announced on the following Monday in our Discord server.</li>
          <li>Winnings are air-dropped once a month, announcement in our Discord server will be made.</li>
          </ul>
          </p>
        </Col>
      </Row>
      <Row style={{ height: "100%", 'text-align': 'center' }}>
        <Col span={24} ref={this.tableRef}>
          <div className="main leaderboardTable" style={{width}}>
              { leaderboard.length > 0 ? this.renderItems(leaderboard) : <div style={{marginTop: 70}} className="whiteContent">No Chefs or Rats have earned any funds for {this.state.selectedKitchen} yet.</div> }
          </div>
        </Col>
      </Row>
      </div>
      </>
    );
  }

  render() {
    if (this.state.loading) {
      return (
        <>
        <Helmet>
          <title>RatAlert Leaderboard</title>
        </Helmet>
        <Row style={{ height: window.innerHeight-140, textAlign: 'center' }}>
          <Col span={24}>
          <Spin size="large"/>
          </Col>
        </Row>
        </>
      );
    } else {
      return this.renderLeaderBoard();
    }
  }
}

export default Leaderboard;
