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

class Faq extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      windowHeight: window.innerHeight - 235,
      dataLoaded: false,
      dayTime: this.props.dayTime,
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

  getFAQ() {
    return (
      <div id="container">
          <div id="bottom">
              <div id="content">
                  <h1 style={{marginTop: 10}}>FAQ</h1>
                  <ol id="tableofcontents">
                      <li><a href="#whatis">What is RatAlert?</a></li>
                      <li><a href="#train2win">What is Train2Win?</a></li>
                      <li><a href="#mintprice">What is RatAlert’s mint price?</a></li>
                      <li><a href="#maximize">How do I maximize the rewards for my chefs and rats?</a></li>
                      <li><a href="#whitelist1">How do I get whitelisted?</a></li>
                      <li><a href="#whitelist2">What do I get when whitelisted?</a></li>
                      <li><a href="#dox">Is the team doxed?</a></li>
                      <li><a href="#audit">Are your smart contracts audited?</a></li>
                      <li><a href="#certik">Who is CertiK and why does it matter?</a></li>
                      <li><a href="#assuredefi">Who is AssureDefi and why does it matter?</a></li>
                      <li><a href="#buykitchen">Can I buy an unlimited amount of kitchens?</a></li>
                      <li><a href="#sellNFT">Can I sell my RatAlert NFTs during the game?</a></li>
                      <li><a href="#sellkitchen">Can I sell RatAlerts kitchens that I own?</a></li>
                      <li><a href="#steal">Can my NFTs get stolen like in other Play2Earn games?</a></li>
                      <li><a href="#vrf">Why does a claim take up to 110 seconds?</a></li>
                      <li><a href="#charge">Why am I being charged 0.002 MATIC for each claim/unstake transaction?</a></li>
                  </ol>
                  <h2 className="faqTitle" id="whatis">1. What is RatAlert?</h2>
                  <p>Simply put, RatAlert is a Play2Earn (P2E) game. However, RatAlert is creating a new genre that we call Train2Earn (T2E) or Train2Win (T2W) It allows your characters to gain experience points which enable them to increase their rewards. In addition, your NFTs update their visual state according to their skill level, both in the game and on OpenSea. This is unique to RatAlert.</p>
                  <h2 className="faqTitle" id="train2win">2. What is Train2Win?</h2>
                  <p>Train2Win is a new unique P2E genre where your NFTs get smarter over time, enabling them to earn more tokens. Visual appearance is changed on a regular basis on both the game and on OpenSea.</p>
                  <h2 className="faqTitle" id="mintprice">3. What is RatAlert’s mint price?</h2>
                  <p>The mint price is 74 MATIC for the public sale and 66 MATIC for whitelist slots (10% discount).</p>
                  <h2 className="faqTitle" id="maximize">4. How do I maximize the rewards for my chefs and rats?</h2>
                  <p>In order to earn the maximum rewards, you will need to keep your NFTs in good health.</p>
                  <p><strong>Chefs:</strong><br/><br/>
                  Train your NFTs to skill level 86% (<strong>Three Star Chef</strong>).<br/>
                  Three star chefs earn 250% of the base $xFOOD ($FFOOD, $CFOOD or $GFOOD) reward. Plus, the higher your skill level, the less likely you’ll get paid a visit by the food inspector.
                  </p>
                  <p><strong>Rats:</strong><br/><br/>
                  Train your NFTs to intelligence level 86% (<b>Genius</b>). Genius rats are less likely to endure mishaps & catastrophes. In addition, only <b>athletic</b> rats earn the maximum reward. Try to keep your body mass between 42% and 57%.<br/><br/>
                  Make sure not to let your rat become <strong>obese</strong> (bodymass level: 86%+) or your rat might be caught by a cat. Send your rat to the gym to keep it in shape and lose body weight.
                  </p>
                  <h2 className="faqTitle" id="whitelist1">5. How do I get whitelisted?</h2>
                  <p>There are multiple ways to get a whitelist slot. There are 2 mini games on our discord which allow you to win daily whitelist slots. You can also take part in our Twitter giveaways or collabs where whitelist slots are given away to the community.</p>
                  <h2 className="faqTitle" id="whitelist2">6. What do I get when whitelisted?</h2>
                  <p>You get a 10% discount on the mint price and you get a 1% permanent experience boost on all of your whitelisted NFTs (max 3). The boost enables your characters to become smarter more quickly. For example, in the McStake kitchen your NFT earns 3 skill points per day instead of 2. Only characters that get minted through a whitelist spot will enjoy this advantage!<br/><br/>
                  You can mint up to 5 NFTs when you are whitelisted. Minting after the whitelist mint-sale is still possible, even if you miss the whitelist mint-sale. The discount will still be applicable.</p>
                  <h2 className="faqTitle" id="dox">7. Is the team doxed?</h2>
                  <p>Yes, the team is KYC’d through AssureDefi and all data is on file. You can access project page at <a target="_new" href="https://www.assuredefi.io/projects/ratalert/">AssureDefi</a>.</p>
                  <h2 className="faqTitle" id="audit">8. Are your smart contracts audited?</h2>
                  <p>Yes, all the contracts used by RatAlert were written from scratch so an audit was a must have for us. Audited contracts significantly reduce the likelihood for an attacker to find exploits or loopholes that compromise the state of the game. The report is available here: <a target="_new" href="https://www.certik.com/projects/rat-alert">CertiK report</a>.</p>
                  <h2 className="faqTitle" id="certik">9. Who is CertiK and why does it matter?</h2>
                  <p>CertiK is one of the leading smart contract auditors on the market and has reviewed countless projects like Polygon or 1Inch. We were impressed, how thorough their audit report for RatAlert was and it shows that this should be an industry standard. In fact, communities should always press for a contract audit.</p>
                  <h2 className="faqTitle" id="assuredefi">10. Who is AssureDefi and why does it matter?</h2>
                  <p>AssureDefi is one of the leading KYC companies in the space aimed to reduce the probability of rugpulls. Legit teams with good intentions should never have a problem to dox themselves via companies like AssureDefi. This also provides extra security for their investors.</p>
                  <h2 className="faqTitle" id="buykitchen">11. Can I buy an unlimited amount of kitchens?</h2>
                  <p>Yes! Remember, each kitchen allows you to stake up to 10 characters, provided they have the required skill level for that kitchen. You can buy as many kitchens as you like, as long as you have enough $FFOOD (for TheStakehouse) or $CFOOD (for LeStake). When they sell out, you will need to buy a kitchen on OpenSea.</p>
                  <h2 className="faqTitle" id="sellNFT">12. Can I sell my RatAlert NFTs during the game?</h2>
                  <p>Yes, absolutely. We recommend that you train your NFTs to the optimum level to make them more valuable. For Chefs, that’s skill level <strong>Three Star Chef</strong> (86%+) and for Rats, that’s intelligence level <strong>Genius</strong> (86%+) and body mass <strong>athletic</strong> (42%-57%). Chefs and rats at their optimum levels earn the most funds. </p>
                  <h2 className="faqTitle" id="sellkitchen">13. Can I sell RatAlerts kitchens that I own?</h2>
                  <p>You can sell as many kitchens as you like on OpenSea.</p>
                  <h2 className="faqTitle" id="steal">14. Can my NFTs get stolen like in other Play2Earn games?</h2>
                  <p>No, in RatAlert NFTs cannot be stolen.</p>
                  <h2 className="faqTitle" id="vrf">15. Why does a claim take up to 110 seconds?</h2>
                  <p>For each claim or unstake transaction we're using the <a target="_new" href="https://docs.chain.link/docs/chainlink-vrf/">Chainlink VRF</a> to make sure nobody can bypass random events. A random number generated by Chainlink takes up to 10 Polygon blocks, that equals 50-110 seconds.</p>
                  <h2 className="faqTitle" id="charge">16. Why am I being charged 0.002 MATIC for each claim/unstake transaction?</h2>
                  <p>For each claim or unstake transaction we're using the <a target="_new" href="https://docs.chain.link/docs/chainlink-vrf/">Chainlink VRF</a> to make sure nobody can bypass random events. In order to prevent a Fund draining attack we're charging the equivalent amount in MATIC to cover the VRF costs. The DAO will be able to adjust this value in the future.</p>











              </div>
          </div>
      </div>
    )
  }

  updateHeight() {
    let height = this.state.height;
    const node = document.getElementsByClassName('roadmap')[0];
    if (node) {
      const rect = node.getBoundingClientRect();
      if (rect && rect.height) {
        height = rect.height + 100;
      }
      this.setState({ height });
    }
  }

  renderFaq() {
    const skyAttr = this.getWidth('sky', true, 1440, 1000);
    const node = this.whitepaperRef.current;
    let height = this.state.height;
    setTimeout(() => {
      this.updateHeight();
    }, 100);

    return (
      <div className="main roadmap" ref={this.whitepaperRef} style={{borderRadius: 30, border: '1px solid #CCCCCC', background: '#F5F5F5', marginLeft: 20, marginRight: 20, marginBottom: 20}}>
      <div className={this.getGradientClass()} style={{top: skyAttr.height, height: height - skyAttr.height}}>
      </div>
      { this.getFAQ() }
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
      return this.renderFaq();
    }
  }
}

export default Faq;
