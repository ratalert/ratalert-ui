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
} from '@ant-design/icons';

class Landing extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      windowHeight: window.innerHeight - 235,
      dataLoaded: false,
      dayTime: this.props.dayTime,
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
    window.addEventListener("dayTime", (e) => {
      this.setState({dayTime: e.detail.dayTime})
    });

    window.addEventListener("resize", (e) => {
      this.updateState();
      this.updateHeight();
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
      window.location.href = 'game';
    }
  }

  renderMainContent() {
    if (window.innerWidth < 1200) {
      return (
        <div>
        <Row align="middle" style={{marginTop: 150}}>
          <Col span={3}/>
          <Col span={10}>
            <span className={`${this.getColorStyle(true)} landingText`}>
            Cook FOOD Tokens and become a three star chef while managing your stress level and keeping vicious rats out of your kitchen.
            </span>
          </Col>
          <Col span={4}>
            <div className="chefLanding"/>
          </Col>
        </Row>
        <Row align="middle">
          <Col span={3}/>
          <Col span={11}>
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
      <Row style={{marginTop: 150}}>
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



    if (this.state.separatorTop === 0 && this.state.seperatorLeft === 0) {
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

    return (
      <div>

      <div className={this.getGradientClass()} style={{top: skyAttr.height, height: height - skyAttr.height}}>
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
      <Row style={{paddingTop: 20}}>
        <Col span={24} align="middle" justify="center">
          { this.props.appMode === 'full' ? <div className="landingButton" style={{left: window.innerWidth > 900 ? '40%' : '20%'}}>
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
            />
          </div> :
          <span className={`${this.getColorStyle(true)} landingText`}>
          Read our Whitepaper. Mint Date in April
          </span> }
        </Col>
      </Row>
      <Row style={{marginTop: 100}}>
        { window.innerWidth > 900 ? <div className="cityAsleep"/> : null }
        { window.innerWidth > 900 ? <div className="darkBackground" style={{height: 150, marginTop: 518}}>
        </div> : null}
      </Row>
      </div>

      </div>
    );
  }
}
export default withRouter(Landing);
