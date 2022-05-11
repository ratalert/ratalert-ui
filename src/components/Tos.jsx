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

class Whitepaper extends React.Component {
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

  updateHeight() {
    let height = this.state.height;
    const node = document.getElementsByClassName('whitepaper')[0];
    if (node) {
      const rect = node.getBoundingClientRect();
      if (rect && rect.height) {
        height = rect.height + 100;
      }
      this.setState({ height });
    }
  }

  getWhitePaper() {
   return (
     <div id="container">
         <div id="bottom">
             <div id="content">
                 <main>

                     <p><br /><br /></p>
                 </main>
             </div>
         </div>
     </div>
   )
 }

  renderTos() {
    const skyAttr = this.getWidth('sky', true, 1440, 1000);
    let height = this.state.height;
    setTimeout(() => {
      this.updateHeight();
    }, 100);
    let ffoodContract;
    let casualFoodContract;
    let gourmetFoodContract;
    if (this.props.readContracts && this.props.readContracts.FastFood && this.props.readContracts.FastFood.address) {
      ffoodContract = this.props.readContracts.FastFood.address;
      casualFoodContract = this.props.readContracts.CasualFood.address;
      gourmetFoodContract = this.props.readContracts.GourmetFood.address;
    }

    return (
      <div className="main whitepaper" ref={this.whitepaperRef} style={{borderRadius: 30, border: '1px solid #CCCCCC', background: '#F5F5F5', marginLeft: 20, marginRight: 20, marginBottom: 20}}>
      <div className={this.getGradientClass()} style={{top: skyAttr.height, height: height - skyAttr.height}}>
      </div>
      <div>
        <h1>Terms of Service</h1>
        <h2 id="toc">Updated 2022-05-10</h2>

        <p>These Terms and Conditions (this &ldquo;<em>Agreement</em>&rdquo;) is a legally binding agreement by and between the <em>RatAlert DAO</em> (&ldquo;<em>us</em>&rdquo; or &ldquo;<em>we</em>&rdquo;) and any owner of any RatAlert <em>Character or Item</em> (defined below) (&ldquo;<em>Purchaser</em>&rdquo; or &ldquo;<em>you</em>&rdquo;). The <em>RatAlert DAO</em> and each <em>Purchaser</em> may be referred to throughout this agreement collectively as the &ldquo;<em>Parties</em>&rdquo; or individually as a &ldquo;<em>Party</em>&rdquo;. By purchasing or otherwise owning a <em>Character or Item</em>, you acknowledge that you have carefully read and agree to the terms of this agreement.</p>
        <p>This website and its connected services are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranty of any kind. By using this website you are accepting sole responsibility for any and all transactions involving RatAlert <em>Characters or Items</em> digital collectibles<em>.</em></p>
        <p>Your purchase from the <em>RatAlert DAO</em> or purchase from any <em>owner</em> of an NFT originally produced by the <em>RatAlert DAO</em> does not constitute a financial investment. You are buying a piece of art that lives on the Polygon blockchain.</p>
        <p><strong>When you agree to these terms, you are agreeing (with limited exceptions) to resolve any dispute between you and us through binding, individual arbitration rather than in court.</strong></p>
        <h2><strong>1. Agreement to Terms</strong></h2>
        <p><em>Characters or Items</em> refer to non-fungible tokens (<em>NFTs</em>) (i.e controllable electronic records recorded on a blockchain) that represent a digital item. &ldquo;<em>Item Art</em>&rdquo; means the image of the specific <em>Character or Item</em> linked to a particular <em>NFT</em>, which consists of elements of image art compiled by the underlying <em>RatAlert DAO</em> smart contract. They may be available for purchase on third-party platforms, such as OpenSea (an &ldquo;<em>NFT Marketplace</em>&rdquo;), which <em>we</em> do not operate. The access and use of the <em>NFT Marketplace</em> are subject to its own terms.</p>
        <h2><strong>2. Ownership of Characters or Items</strong></h2>
        <p>When <em>Purchaser</em> acquires a <em>Character or Item</em>, <em>Purchaser</em> owns all personal property rights to that item (e.g., the right to freely sell, transfer, or otherwise dispose of that item). The <em>Item Art</em>, however, is free for use by anyone for any purpose without restriction under copyright law.</p>
        <h2><strong>3. Staking and Food Tokens</strong></h2>
        <p><em>Characters or Items</em> may accumulate the 3 utility tokens FFOOD, CFOOD or GFOOD (<em>Food Tokens</em>) when they are staked in one of the respective kitchen smart contracts <em>McStake</em>, <em>TheStakehouse</em>, <em>LeStake</em> (<em>Kitchen</em>). <em>Food Tokens</em> are built for one purpose and one purpose only: to enable you to mint more <em>Characters or Items</em> within the RatAlert ecosystem. <em>Food Tokens</em> have no other functionality other than within the RatAlert ecosystem, and it cannot be purchased from The <em>RatAlert DAO</em>. It can only be accumulated by staking your <em>Characters or Items</em> in <em>Kitchens</em>. The <em>RatAlert DAO</em> does not provide or intend to provide a secondary marketplace for <em>Food Tokens</em>.</p>
        <h2><strong>4. Fees and Payments</strong></h2>
        <p>(a) If <em>you</em> elect to purchase a <em>Character or Item</em> through the website, any financial transactions that <em>you</em> engage in will be conducted solely through the Polygon network. <em>We</em> will have no insight into or control over these payments or transactions, nor do <em>we</em> have the ability to reverse any transactions. <em>We</em> will have no liability to <em>you</em> or to any third party for any claims or damages that may arise as a result of any transactions that <em>you</em> engage or any other transactions that <em>you</em> conduct via the Polygon network.</p>
        <p>(b) Polygon requires the payment of a transaction fee (a <em>Gas Fee</em>) for every transaction that occurs on the network that you will need to pay.</p>
        <h2><strong>5. Transfers</strong></h2>
        <p>All subsequent transactions of the <em>Characters or Items</em> are subject to the following terms:</p>
        <p>(a) the <em>Character or Item</em> transferee (the &ldquo;<em>Transferee</em>&rdquo;) shall, by purchasing, accepting, accessing or otherwise using the <em>Character or Item</em> or <em>Item Art</em>, be deemed to accept all of the terms of this <em>Agreement</em> as a <em>Purchaser</em> hereof.</p>
        <p>(b) the <em>Character or Item</em> transferor (the &ldquo;<em>Transferor</em>&rdquo;) shall provide notice to the <em>Transferee</em> of this <em>Agreement</em>, including a link or other method by which the terms of this <em>Agreement</em> can be accessible by the <em>Transferee</em>. <em>Purchaser</em> further acknowledges and agrees that all subsequent transactions of the <em>Character or Item</em> will be effected on the blockchain network governing the <em>Character or Item</em>, and <em>Purchaser</em> will be required to make or receive payments exclusively through its cryptocurrency wallet.</p>
        <h2><strong>6. The </strong><strong><em>RatAlert DAO&rsquo;s</em></strong><strong> Rights and Obligations</strong></h2>
        <p>The <em>Parties</em> acknowledge and agree that the <em>RatAlert DAO</em> is not responsible for repairing, supporting, replacing, or maintaining any website, <em>Characters or Items</em> or <em>Item Art</em>.</p>
        <h2><strong>7. Warranty Disclaimers and Assumption of Risk</strong></h2>
        <p><em>Purchaser</em> represents and warrants that he</p>
        <p>(a) is the age of majority in <em>Purchaser&rsquo;s</em> place of residence (which is typically 18 years of age in most countries) and has the legal capacity to enter into this <em>Agreement</em></p>
        <p>(b) that <em>Purchaser</em> will use and interact with the <em>Characters or Items</em> and <em>Item Art</em> only for lawful purposes and in accordance with this <em>Agreement</em></p>
        <p>(c) that <em>Purchaser</em> will not use the <em>Characters or Items</em> or <em>Item Art</em> to violate any law, regulation or ordinance or any right of the <em>RatAlert DAO</em>, its licensors or any third party, including without limitation, any right of privacy, publicity, copyright, trademark, or patent. Purchaser further agrees that it will comply with all applicable law.</p>
        <p>The <em>Characters or Items</em> are provided &ldquo;as is&rdquo;. Without warranty of any kind. Without limiting the foregoing, the <em>RatAlert DAO</em> expressly disclaims any implied warranties of merchantability, fitness for a particular purpose, quiet enjoyment and non-infringement, and any warranties arising out of course of dealing or usage of trade. The RatAlert DAO makes no warranty that the <em>Characters or Items</em> will meet <em>Purchaser&rsquo;s</em> requirements or be available on an uninterrupted, secure, or error-free basis. The <em>RatAlert DAO</em> makes no warranty regarding the quality, accuracy, timeliness, truthfulness, completeness or reliability of any information or content on the <em>Characters or Items</em>.</p>
        <p>The <em>RatAlert DAO</em> will not be responsible for or liable to Purchaser for any loss and takes no responsibility for, and will not be liable to you for, any use of <em>Characters or Items</em>, including but not limited to any losses, damages or claims arising from:</p>
        <p>(a) user error such as forgotten passwords, incorrectly constructed transactions or mistyped wallet addresses.</p>
        <p>(b) server failure or data loss</p>
        <p>(c) corrupted cryptocurrency wallet files</p>
        <p>(d) unauthorized access to <em>Characters or Items</em></p>
        <p>(e) any unauthorized third party activities, including without limitation the use of viruses, phishing, brute forcing or other means of attack against the Polygon blockchain underlying the <em>Characters or Items.</em></p>
        <p>The <em>Characters or Items</em> are intangible digital assets. They exist only by virtue of the ownership record maintained in the Polygon network. Any transfer of title that might occur in any unique digital asset occurs on the decentralized ledger within such a blockchain network, which we do not control. The <em>RatAlert DAO</em> does not guarantee that it can affect the transfer or title or right in any <em>Character or Item</em>. <em>Purchaser</em> bears full responsibility for verifying the identity, legitimacy and authenticity of assets that the <em>Purchaser</em> purchases through the <em>NFT Marketplace</em>. Notwithstanding indicators and messages that suggest verification, we make no claims about the identity, legitimacy or authenticity of assets on the <em>NFT Marketplace</em> or any purported subsequent transactions.</p>
        <p>We are not responsible for any kind of failure, abnormal behavior of software (e.g. wallet, smart contract), blockchains or any other features of Characters or Items. The <em>RatAlert DAO</em> is not responsible for casualties due to late report by developers or representatives (or no report at all) of any issues with the blockchain supporting the <em>Characters or Items</em>, including forks, technical node issues or any other issues having fund losses as a result.</p>
        <p>Some jurisdictions do not allow the exclusion of implied warranties in contracts with consumers, so the above exclusion may not apply to <em>you</em>.</p>
      </div>
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
      return this.renderTos();
    }
  }
}

export default Whitepaper;
