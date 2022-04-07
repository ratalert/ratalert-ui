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
      onlyEvents: false,
    };
    this.nftProfit = 0;
    this.stakingLocations = ['McStake', 'TheStakeHouse', 'LeStake', 'Gym'];
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
       claims(orderBy: timestamp, orderDirection: desc, where: {
         owner: "${this.props.address || "0x2f7CdD90AB83405654eE10FC916a582a3cDe7E6F"}"
        }) {
        id,owner, tokenId, tolerance,
        efficiency, eventName, earned, timestamp, foodTokensPerRat,
        kitchen, type, unstaked, URI,
      }
    }`;
    console.log('QUERY', query);

    const result = await graphQLClient.request(query);
    console.log(this.props.address);
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
          if (found === 0 && r.earned > 0) {
            if (r.freak > 0) {
              //console.log(r);
            }
            claims.push({
              owner: r.owner,
              type:  r.type[0].toUpperCase() + r.type.substring(1),
              name: json.name,
              id: parseInt(json.name.replace(/\D/g, '')),
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
    console.log(claims);
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
    }, 1500);

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
      let width;
      let height;
      switch (data.eventName) {
        case 'foodInspector':
        width = 200;
        height = 200;
        alt = 'Food Inspector';
        image = 'food_inspector.gif';
        break;
        case 'ratTrap':
        width = 338;
        height = 200;
        alt = 'Rat Trap';
        image = 'rat_trap.gif';
        break;
        case 'cat':
        width = 313;
        height = 200;
        alt = 'Cat';
        image = 'cat.gif';
        break;
        case 'burnout':
        alt = 'Burnout';
        image = 'burnout.gif';
        width = 269;
        height = 200;
        break;
      }
      let factor = 0.5;
      if (window.innerWidth < 900) {
        factor = 0.25;
      }
      eventName = <span>{staked}<br/><Popover mouseEnterDelay={0.25} content={alt}><img alt={alt} style={{ width: width * factor, height: height * factor }} src={`/img/${image}`}/></Popover></span>;
    }
    return eventName;
  }

  renderResult(data) {
    if (data.type === 'Chef') {
      return (
        <div>
        <Row>
          <Col xs={24}  md={24} lg={4}>
            Skill:
          </Col>
          <Col xs={24}  md={24} lg={12}>
            <img src="/img/skill.png"/>&nbsp;
            {data.efficiency}%
          </Col>
        </Row>
        <Row>
          <Col xs={24} md={24} lg={4}>
            Freak:
          </Col>
          <Col xs={24}  md={24} lg={12}>
            <img src="/img/insanity.png"/>&nbsp;
            {data.tolerance}%
          </Col>
        </Row>
        <Row>
          <Col xs={24}  md={24} lg={4}>
            Earned:
          </Col>
          <Col xs={24}  md={24} lg={12}>
            <img src="/img/ffood.png"/>&nbsp;
            {data.earned}
          </Col>
        </Row>
        </div>
      )
    }

    if (data.type === 'Rat') {
      return (
        <div>
        <Row>
          <Col xs={24}  md={24} lg={4}>
            Intelligence:
          </Col>
          <Col xs={24}  md={24} lg={12}>
            <img src="/img/intelligence.png"/>&nbsp;
            {data.efficiency}%
          </Col>
        </Row>
        <Row>
          <Col xs={24}  md={24} lg={4}>
            Bodymass:
          </Col>
          <Col xs={24}  md={24} lg={12}>
            <img src="/img/fatness.png"/>&nbsp;
            {data.tolerance}%
          </Col>
        </Row>
        <Row>
          <Col xs={24}  md={24} lg={4}>
            Earned:
          </Col>
          <Col xs={24}  md={24} lg={12}>
            <img src="/img/ffood.png"/>&nbsp;
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

  renderEmptyNFTStats(c, staked, type = 'app', classNameStats) {
    return (
      <div
      style={{height: 99}}
      className={
        this.state.selectedNfts &&
        this.state.selectedNfts[c.name] &&
        this.state.selectedNfts[c.name]["status"] === true
          ? `nftSelectedStats ${classNameStats}`
          : `nftNotSelectedStats ${classNameStats}`
      }>
      </div>
    )
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
      style={{height: 99}}
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
        <Row>
        <Col style={{marginRight: '5px', marginLeft: 6}} xs={3} span={2}>
          <img src="/img/time.png"/>
        </Col>
          <Col xs={16} span={17}>
            <div className="levelUpTime">{ c.time }</div>
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

  getEventPosition(name) {
    if (window.innerWidth < 900) {
      if (name === 'ratTrap') {
        return 60;
      } else {
        return 85;
      }
    }
    if (name === 'ratTrap') {
      return 110;
    } else {
      return 130;
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

        { c.event ? <img style={{position: 'absolute', left: this.getEventPosition(c.eventName), top: 160, width: c.eventWidth, height: c.eventHeight}} src={c.event}/> : null}

        { type === 'app' && location !== 'Gym' && location !== false && this.state.toggleHint ? <div>
        <div className="nftHintBox">{hint}</div>
        </div> : null }
        </div>
        { this.renderNFTStats(c, staked, type, classNameStats, location) }
      </span>
      </div>
    )
  }

  renderItems(claims) {

    return (
      <div className={'kitchen'}>
        <Row >
          <Col span={24}>
          <Row className={`kitchenRow_kitchen`}>
          { claims.map( (c) =>
            <div className="scene">
              <div className="card">
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

  getImage(eventName) {
    let image;
    let width;
    let height;
    let alt;
    switch (eventName) {
      case 'foodInspector':
      width = 200;
      height = 200;
      alt = 'Food Inspector';
      image = 'food_inspector.gif';
      break;
      case 'ratTrap':
      width = 338;
      height = 200;
      alt = 'Rat Trap';
      image = 'rat_trap.gif';
      break;
      case 'cat':
      width = 313;
      height = 200;
      alt = 'Cat';
      image = 'cat.gif';
      break;
      case 'burnout':
      alt = 'Burnout';
      image = 'burnout.gif';
      width = 269;
      height = 200;
      break;
    }
    if (image && image.length > 0) {
      return { img: `img/${image}`, width: width * 0.15, height: height * 0.15 };
    } else {
      return { img: null, width: 0, height: 0};
    }
  }

  toggleOnlyEvents() {
    this.setState({ onlyEvents: !this.state.onlyEvents });
  }

  assignData(a) {
    const event = this.getImage(a.eventName);
    return {
      name: a.id,
      image: a.img,
      event: event.img,
      eventWidth: event.width,
      eventHeight: event.height,
      eventName: a.eventName,
      skillLevel: a.efficiency,
      freakLevel: a.tolerance,
      intelligenceLevel: a.efficiency,
      bodymassLevel: a.tolerance,
      type: a.type,
      stakingLocation: a.kitchen,
      mcstakeTimestamp: 1,
      profit: a.earned,
      time: new Date(parseInt(a.timestamp)*1000).toISOString().substr(0,16).replace('T', ' ').replace('2022-', ''),
    };
  }

  renderClaims() {
    let small = false;
    if (window.innerWidth < 1000) {
      small = true;
    }
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
          const c = this.assignData(a);
          claims.push(c);
        } else if (a.id === this.state.filter && this.state.onlyEvents)
          if (a.eventName && a.eventName.length > 0) {
            const c = this.assignData(a);
            claims.push(c);
        }
      } else {
        if (!this.state.onlyEvents) {
          const c = this.assignData(a);
          claims.push(c);
        } else {
          if (a.eventName && a.eventName.length > 0) {
            const c = this.assignData(a);
            claims.push(c);
          }
        }
      }
    });

    const skyAttr = this.getWidth('sky', true, 1440, 1000);
    const sky = document.getElementsByClassName('sky')[0];
    const rect = sky.getBoundingClientRect();

    let height = this.state.height;
    if (height < 1000) {
      height = 1000;
    }
    setTimeout(() => {
      const node = document.getElementsByClassName('claimsTable')[0];
      const rect = node.getBoundingClientRect();
      if (rect.height) {
        height = rect.height;
      }
      this.setState({ height });
    }, 500);

    return (
      <div>
      <div className={this.getGradientClass()} style={{top: rect.height, height: height - skyAttr.height}}>
      </div>
      <Row style={{ height: "100%", 'text-align': 'center' }}>
        <Col span={24}>
        <div ref={this.tableRef}>
          <h2 className={this.getTextClass()}>Search</h2>
          <span className={`claimText ${this.getTextClass()}`}>Enter the NFT ID you want to filter the events for: &nbsp;</span>
          <p className={`claimText ${this.getTextClass()}`}>
            <Checkbox className={`claimText ${this.getTextClass()}`} onChange={this.toggleOnlyEvents.bind(this)}>Only include history with events</Checkbox>
            </p>
          <InputNumber min={1} max={50000} controls={false} onChange={this.onChange.bind(this)} />
          <h2 className={this.getTextClass()}>Claims and unstakes</h2>

          <div className="claimsTable" style={{width: window.innerWidth * 0.9}}>
              { this.renderItems(claims) }
          </div>
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
      return this.renderClaims();
    }
  }
}

export default Claims;
