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
  Button,
} from "antd";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router-dom';
import { request, gql } from "graphql-request";
import Account from "./Account";
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
  FilePdfOutlined,
} from '@ant-design/icons';

class Landing extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      windowHeight: window.innerHeight - 235,
      dataLoaded: false,
      dayTime: 'night',
      header1Left: 0,
      header2Left: 0,
      seperatorLeft: 0,
      separatorTop: 0,
      height: 0,
      cityBottom: 0,
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
    /*
    window.addEventListener("dayTime", (e) => {
      this.setState({dayTime: e.detail.dayTime})
    });
*/
    window.addEventListener("resize", (e) => {
      this.updateState();
      this.updateHeight();
    });

    const loadingCompleteEvent = new CustomEvent('loadingComplete', {
      bubbles: true,
      detail: { }
    });
    window.dispatchEvent(loadingCompleteEvent);

  }

  async componentDidMount() {
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
      return 'nightGradient gradient';
  }

  getColorStyle(blue = false) {
    return;
    if (blue === null) {
      if (this.state.dayTime === 'day') {
        return 'ratLightBlueBg';
      }
    }
    if (!blue) {
      if (this.state.dayTime === 'night') {
        return 'ratLight';
      }
      if (this.state.dayTime === 'day') {
        return 'ratLight';
      }
      if (this.state.dayTime === 'morning') {
        return 'ratDark';
      }
      if (this.state.dayTime === 'evening') {
        return 'ratDark';
      }
    } else {
      if (this.state.dayTime === 'day') {
        return 'ratLightBlue';
      }
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.address && !prevProps.address) {
      //this.props.history.push('/game');
      //window.location.href = 'game';
    }
  }

  renderDAOContent() {
      return (
        <div>
        <Row align="middle" justify="center" style={{marginTop: 0}}>
          <div className="daoLanding"/>
        </Row>
        <Row align="middle" justify="center" style={{marginTop: 100, marginLeft: 50, marginRight: 50}}>
            <p style={{textAlign: window.innerWidth < 900 ? 'left' : 'center'}} className={`${this.getColorStyle(true)} landingText`}>
              RatAlert is a community project.<br/>
              Join RatAlert’s governance process with $FFOOD tokens.<br/>
              All contracts are owned by the <a target="_new" className="landingLink" href="https://gnosis-safe.io/app/matic:0xbEf526C8325C47817ceb435011bf1E6bc9ec691d/home">Gnosis 4of6 community multi signature wallet</a>.<br/>
              All contract upgrades and configuration changes subject to a <a target="_new" className="landingLink" href="https://polygonscan.com/address/0x32dd207f1f16dd4ceea94833ab9fb5dd96bc0924">48 hour timelock delay</a>.<br/>
              Steer game decisions and future development by voting for proposals in the DAO.<br/>
              All contracts have been open-sourced and are available on <a target="_new" className="landingLink" href="https://github.com/ratalert/ratalert-contracts">GitHub</a>
            </p>
        </Row>
        <Row align="middle" justify="center" style={{marginTop: 0, height: 50}}>
        <a href="https://nftdroops.com/" target="_new"><img width="120" src="/assets/NFTdroops.webp"/></a>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <a href="https://raritysniper.com/nft-drops-calendar" target="_new"><img width="120" src="/assets/rarity-sniper.png"/></a>

        </Row>
        </div>
      )
  }

  renderSecurityContent() {
    if (window.innerWidth < 1200) {
      return (
        <div>
        <Row align="middle" justify="center" style={{marginTop: 100}}>
            <div onClick={() => window.location.href='https://www.assuredefi.io/projects/ratalert/'} style={{cursor: 'pointer'}} className="assureDefiLanding"/>
            <div onClick={() => window.location.href='https://www.certik.com/projects/rat-alert'} style={{cursor: 'pointer'}} className="certikLanding"/>
        </Row>
        <Row align="middle" justify="center" style={{marginTop: 50}}>
          <Col span={2}/>
          <Col span={18}>
          <p style={{textAlign: 'left'}} className={`${this.getColorStyle(true)} landingText`}>
          RatAlert’s team is fully KYC’d with <a target="_new" className="landingLink" href="https://www.assuredefi.io/projects/ratalert/">AssureDefi</a>.<br/>
          Smart contracts open source & audited by <a target="_new" className="landingLink" href="https://www.certik.com/projects/rat-alert">CertiK</a>.<br/>
          <br/>
          <a download target="_new" href="/files/RatAlertCertik.pdf"><FilePdfOutlined style={{fontSize: 38, color: 'white'}}/></a> Download the <a download className="landingLink" href="/files/RatAlertCertik.pdf">report</a>.
          <br/><br/>
          All proceeds are secured by the <a target="_new" className="landingLink" href="https://gnosis-safe.io/app/matic:0xbEf526C8325C47817ceb435011bf1E6bc9ec691d/home">Gnosis 4of6 DAO multi signature wallet</a>.<br/>
          </p>

          </Col>
          <Col span={2}/>
        </Row>
        </div>
      )
    }

    return (
      <div>
      <Row align="middle" justify="center" style={{marginTop: 0}}>
        <Col span={1}></Col>
        <Col span={6}>
          <div onClick={() => window.location.href='https://www.assuredefi.io/projects/ratalert/'} style={{cursor: 'pointer'}} className="assureDefiLanding"/>
        </Col>
        <Col span={6}>
          <div onClick={() => window.location.href='https://www.certik.com/projects/rat-alert'} style={{cursor: 'pointer'}} className="certikLanding"/>
        </Col>
        <Col span={8}>
          <p style={{textAlign: 'left'}} className={`${this.getColorStyle(true)} landingText`}>
          RatAlert’s team is fully KYC’d with <a target="_new" className="landingLink" href="https://www.assuredefi.io/projects/ratalert/">AssureDefi</a>.<br/>
          Smart contracts open source & audited by <a target="_new" className="landingLink" href="https://www.certik.com/projects/rat-alert">CertiK</a>.<br/>
          <br/>
          <a download target="_new" href="/files/RatAlertCertik.pdf"><FilePdfOutlined style={{fontSize: 38, color: 'white'}}/></a> Download the <a download className="landingLink" href="/files/RatAlertCertik.pdf">report</a>.
          <br/><br/>
          All proceeds are secured by the <a target="_new" className="landingLink" href="https://gnosis-safe.io/app/matic:0xbEf526C8325C47817ceb435011bf1E6bc9ec691d/home">Gnosis 4of6 DAO multi signature wallet</a>.<br/>
          </p>
        </Col>
        <Col span={2}/>
      </Row>
      </div>
    )
  }

  renderTrainContent() {
    if (window.innerWidth < 1200) {
      return (
        <div>
        <Row align="middle" style={{marginTop: 100}}>
          <Col span={2}/>
          <Col span={8}>
            <div className="rewardsLanding"/>
          </Col>
          <Col span={12}>
            <span className={`${this.getColorStyle(true)} landingText`}>
            Introducing Train2Win: Level up your character to maximize your rewards.
            </span>
          </Col>
        </Row>
        <Row align="middle">
          <Col span={2}/>
          <Col span={12}>
            <span className={`${this.getColorStyle(true)} landingText`}>
            Avoid mishaps & catastrophes for your NFTs by keeping them healthy in the Gym.
            </span>
          </Col>
          <Col span={4}>
            <div className="gymLanding"/>
          </Col>
        </Row>
        <Row align="middle" justify="center" style={{marginTop: 20}}>
            <div style={{width: window.innerWidth}} className="ratSewerLanding"/>
        </Row>
        </div>
      )
    }

    return (
      <div>
      <Row align="middle" justify="center" style={{marginTop: 100}}>
        <Col span={2}></Col>
        <Col span={6}>
          <span className={`${this.getColorStyle(true)} landingText`}>
          Introducing Train2Win: Level up your character to maximize your rewards.
          </span>
        </Col>
        <Col span={4}>
          <div className="rewardsLanding"/>
        </Col>
        <Col span={4}>
          <div className="gymLanding"/>
        </Col>
        <Col span={6}>
          <span className={`${this.getColorStyle(true)} landingText`}>
          Avoid mishaps & catastrophes for your NFTs by keeping them healthy in the Gym.
          </span>
        </Col>
        <Col span={2}/>
      </Row>
      <Row align="middle" justify="center" style={{marginTop: 20}}>
          <div className="ratSewerLanding"/>
      </Row>
      </div>
    )
  }

  renderMainContent() {
    if (window.innerWidth < 1200) {
      return (
        <div>
        <Row align="middle" style={{marginTop: 100}}>
          <Col span={10}>
            <div className="chefLanding"/>
          </Col>
          <Col span={12}>
            <span className={`${this.getColorStyle(true)} landingText`}>
            Cook FOOD Tokens and become a three star chef while managing your stress level and keeping vicious rats out of your kitchen.
            </span>
          </Col>
        </Row>
        <Row align="middle">
          <Col span={2}/>
          <Col span={12}>
            <span className={`${this.getColorStyle(true)} landingText`}>
            Steal your fair share of FOOD tokens as a villainous rat, but watch your body weight and avoid rat traps set by chefs.
            </span>
          </Col>
          <Col span={4}>
            <div className="ratLanding"/>
          </Col>
        </Row>
        </div>
      )
    }

    return (
      <Row style={{marginTop: 250}}>
        <Col span={2}>No</Col>
        <Col span={6}>
          <span className={`${this.getColorStyle(true)} landingText`}>
          Cook FOOD Tokens and become a three star chef while managing your stress level and keeping vicious rats out of your kitchen.
          </span>
        </Col>
        <Col span={4}>
          <div className="chefLanding"/>
        </Col>
        <Col span={4}>
          <div className="ratLanding"/>
        </Col>
        <Col span={6}>
          <span className={`${this.getColorStyle(true)} landingText`}>
          Steal your fair share of FOOD tokens as a villainous rat, but watch your body weight and avoid rat traps set by chefs.
          </span>
        </Col>
        <Col span={2}/>
      </Row>
    )
  }

  updateState() {
    let header1Left = 0;
    let header2Left = 0;
    let seperatorLeft = 0;
    let separatorTop = 0;
    let cityBottom = 0;

    const landingTitle = document.getElementsByClassName('landingTitle')[0];
    if (landingTitle) {
      const rect = landingTitle.getBoundingClientRect();
      header1Left = window.innerWidth/2 - rect.width;
      separatorTop = rect.y + (rect.height / 3) + 5;

      if (window.innerWidth < 900) {
        header1Left -= 50;
        separatorTop -= 5;
      }
    }
    const landingSubTitle = document.getElementsByClassName('landingSubTitle')[0];
    if (landingSubTitle) {
      const rect = landingSubTitle.getBoundingClientRect();
      header2Left = window.innerWidth / 2 + 75;
    }

    const seperator = document.getElementsByClassName('seperator')[0];
    if (seperator) {
      const rect = seperator.getBoundingClientRect();
      seperatorLeft = window.innerWidth / 2 + 20;
      if (window.innerWidth < 900) {
        seperatorLeft -= 30;
      }
    }


    const cityAsleep = document.getElementsByClassName('cityAsleep')[0];
    if (cityAsleep) {
      const rect = cityAsleep.getBoundingClientRect();
      //cityBottom = rect.y + rect.height;
      cityBottom = rect.top + 553;
    }
    this.setState({ header1Left, header2Left, seperatorLeft, separatorTop, cityBottom });
  }

  updateHeight() {
    let height = this.state.height;
    const node = document.getElementsByClassName('content')[0];
    if (node) {
      const rect = node.getBoundingClientRect();
      if (rect && rect.height) {
        height = rect.height + 180;
        if (window.innerWidth < 900 ) {
          height += 600;
        }
      }
      this.setState({ height });
    }
  }

  render() {
    const skyAttr = this.getWidth('sky', true, 1440, 1000);



    if (this.state.seperatorLeft === 0) {
      setTimeout(() => {
        this.updateState();
      }, 50);
    }

    let height = this.state.height;
    if (this.state.height === 0) {
      setTimeout(() => {
        this.updateHeight();
      }, 50);
    }

    let sectionTop = 1400;
    let sectionHeight = 900;
    if (window.innerWidth < 1200) {
      sectionHeight = 1000;
      sectionTop = 1500;
    }

    let offset = 0;

    if (window.innerWidth < 900) {
      offset = 400;
    }

    return (
      <div>
      <div className={this.getGradientClass()} style={{top: skyAttr.height, height: height - skyAttr.height - offset}}>
      </div>
      <div className="content">
      <Row>
          <div className={`${this.getColorStyle()} landingTitle`} style={{left: this.state.header1Left}}>
            Play2Earn
          </div>
          { this.state.header1Left > 0 ?
          <div className="seperator" style={{left: this.state.seperatorLeft, top: this.state.separatorTop}}>
            <div className="landingSeparatorLeft">
            </div>
            <div className={`${this.getColorStyle(null)} landingSeparatorRight`}>
            </div>
          </div> : null }
          <span className={`${this.getColorStyle(true)} landingSubTitle`} style={{left: this.state.header2Left}}>Train2Win</span>
      </Row>

      { this.renderMainContent() }
      <Row align="middle" justify="center" style={{paddingTop: 50}}>
          { this.props.appMode === 'full' ? <div className="landingButton">
            <Account
              address={this.props.address}
              localProvider={this.props.provider}
              userSigner={this.props.userSigner}
              mainnetProvider={this.props.mainnetProvider}
              price={0}
              blockExplorer={this.props.blockExplorer}
              setAddress={this.props.setAddress}
              setInjectedProvider={this.props.setInjectedProvider}
              injectedProvider={this.props.injectedProvider}
              dayTime={this.state.dayTime}
              themeClass={this.getColorStyle()}
              hideLoggedIn={true}
              appMode={this.props.appMode}
              cssClass={'landingWeb3Button'}
              buttonText = 'Connect wallet & play now'
            />
          </div> :
          <span className={`${this.getColorStyle(true)} landingText`}>
          <Button style={{width: 350}} className="landingWeb3Button"><a href="/whitepaper">Read our Whitepaper. Mint Date is May 12!</a></Button>
          </span> }
      </Row>
      <Row align="middle" justify="center" style={{marginTop: 100}}>
        <div style={{width: window.innerWidth}} className="cityAsleep"/>
        <div className="darkBackground" style={{height: sectionHeight, marginTop: sectionTop}}/>
        <span className="scrollDown">
          scroll down to learn more
        </span>
        <div className="arrowDown"/>
      </Row>
      <Row align="middle" justify="center" style={{marginTop: 150}}>
          <span className="landingHeadline">Train your NFTs</span>
          { this.renderTrainContent() }
      </Row>

      <Row align="middle" justify="center" style={{height: window.innerWidth < 900 ? 1200 : 700, marginTop: window.innerWidth < 900 ? 0 : 150}}>
        <div style={{marginTop: window.innerWidth < 900 ? 150 : -150, textAlign: 'center'}}>
          <span className="landingHeadline">State of the Art Security</span>
          <Col span={24}>
            { this.renderSecurityContent() }
          </Col>
        </div>
      </Row>

      <Row  align="middle" justify="center" style={{marginTop: 0}}>
        <div className="darkBackground" style={{height: window.innerWidth < 900 ? 1020 : 900, marginTop: window.innerWidth < 900 ? 120 : -20}}></div>
        <div style={{paddingTop: 150}}>
        <div className="landingHeadline">RatAlert DAO</div>
        <Col span={24}>
            { this.renderDAOContent() }
        </Col>
        </div>
      </Row>

      { window.innerWidth > 900 ?
      <Row  align="middle" justify="center" style={{marginTop: 150}}>
        <div style={{height: 200}}/>
      </Row> : null }


      </div>

      </div>
    );
  }
}
export default withRouter(Landing);
