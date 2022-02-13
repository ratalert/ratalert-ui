import React from "react";
import ReactDOM from 'react-dom'
import {
  PageHeader,
  Button,
  Descriptions,
  Popover,
  Layout,
  Card,
  Row,
  Col,
  InputNumber,
  Skeleton,
  Progress,
  Spin,
  Slider,
  Radio,
  Menu,
  Dropdown,
  Icon,
  Modal,
} from "antd";
let lastBlockTime = 0;
const { Header, Footer, Sider, Content } = Layout;

const univ3prices = require('@thanpolas/univ3prices');
import Decimal from 'decimal.js';
import { useEventListener } from "eth-hooks/events/useEventListener";
import { Link } from 'react-router-dom';
import { GraphQLClient, gql } from 'graphql-request'



import { contracts } from '../contracts/contracts.js';
import config from '../config.js';
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
const APIURL = `${process.env.REACT_APP_GRAPH_URI}`;

const graphQLClient = new GraphQLClient(APIURL, {
    mode: 'cors',
});

const uniswapGraph = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';
const uniswapClient = new GraphQLClient(uniswapGraph, {
    mode: 'cors',
});



import { LeftOutlined } from "@ant-design/icons";
const { ethers } = require("ethers");
import { renderNotification } from "../helpers";
import {
  DashboardOutlined,
  OrderedListOutlined,
  FileTextOutlined,
  CaretLeftOutlined,
  CaretRightOutlined,
  DownOutlined,
} from '@ant-design/icons';


class Main extends React.Component {
  constructor(props) {
    super(props);

    this.townhouseHeight = 0;
    this.townhouseRef = React.createRef();
    this.mobileBreakpoint = 651;
    this.officeBreakpoint = 1160;
    this.nfts = {};
    this.state = {
      isClaimModalVisible: false,
      currentStatsNFT: 0,
      windowHeight: window.innerHeight - 235,
      nonStakedGraph: { characters: [] },
      stakedGraph: { characters: [] },
      selectedNfts: {},
      stakedNfts: [],
      unstakedNfts: [],
      allStakedChefs: [],
      unstakedChefs: [],
      unstakedRats: [],
      stakedChefs: [],
      stakedRats: [],
      claimStats: [],
      totalRats: 0,
      totalCooks: 0,
      totalRatsStaked: 0,
      totalCooksStaked: 0,
      mintAmount: 1,
      loading: true,
      nftDetailsActive: {},
      isApprovedForAll: {
        "McStake": false,
        "Gym": false,
      },
      noAddressLoaded: true,
      dataLoaded: false,
      pairs: {},
      currency: 'ETH',
      officeView: 'mint',
      fFoodBalance: 0,
      stats: {

        minted: 0,
        totalSupply: 0,
        rats: 0,
        chefs: 0,
        ratsStaked: 0,
        chefsStaked: 0,
        tokensClaimed: 0,
        paidTokens: 0,
        dailyFFoodRate: 0,
        minimumToExit: 0,
        ratTax: 0,
        maxSupply: 0,
        mintPrice: 0,
      },
    };
    this.nftProfit = 0;
  }

  setCurrency(val) {
    if ( (val.target.value === 'ETH') || (val.target.value === 'WOOL') || (val.target.value === 'GP') ) {
      this.setState({currency: val.target.value})
    }
  }

  setOfficeView(val) {
    if ( (val.target.value === 'mint') || (val.target.value === 'balance') || (val.target.value === 'stats') ) {
      this.setState({officeView: val.target.value})
    }
  }

  getMintPrice() {
    let mintPrice = 0;
    if (this.state.stats && this.state.stats.mintPrice) {
      mintPrice = this.state.stats.mintPrice;
    }
    switch (this.state.currency) {
      case 'ETH':
        return mintPrice;
      case 'WOOL':
          return parseInt(this.state.pairs['WOOL/WETH'] * mintPrice);
      case 'GP':
          return parseInt(this.state.pairs['GP/WETH'] * mintPrice);
    }
  }

  componentDidUpdate(prevProps) {

    if (this.props.address && !prevProps.address) {
      this.setState({
        loading: false
      });

      setTimeout(() => {
        this.getBalances();
        this.checkContractApproved();
      }, 500);

    }
  }

  onChangeCurrentNFT(currentStatsNFT) {
    this.setState({ currentStatsNFT });
  }
  onChangeAmount(mintAmount) {
    if (mintAmount >= 1 && mintAmount <= 10) {
      this.setState({ mintAmount });
    }
    if (mintAmount > 10) {
      this.setState({ mintAmount: 10 });
    }
    if (mintAmount < 1) {
      this.setState({ mintAmount: 1 });
    }
  }

  async getUniswapprice() {
    // "1.00212"
  }

  async fetchFromUniswap(pair1, pair2, contract1, contract2) {

    const query = `{
	pools(first:1, where:
    {
      token0:"${contract1}",
      token1:"${contract2}"
    }
  )
  {
    id, sqrtPrice,
    token0 { id, symbol, decimals },
    token1 {id, symbol, decimals},
    liquidity, tick
  }
}`;

    const results = await uniswapClient.request(query);
    const pools = results.pools;


    const price = univ3prices([pools[0].token0.decimals, pools[0].token0.decimals], pools[0].sqrtPrice).toAuto();
    const price2 = univ3prices.tickPrice([pools[0].token0.decimals, pools[0].token0.decimals], pools[0].tick).toAuto();

    const pairs = this.state.pairs;
    pairs[`${pair1}/${pair2}`] = parseInt(price2).toFixed(8);
    this.setState({pairs});
  }

  async checkClaimHook() {
    const chainId = this.props.chainId;
    let networkName;
    if (chainId === 1337) {
      networkName = 'localhost';
    } else if (chainId === 4) {
      networkName = 'rinkeby';
    }
    else {
      networkName = 'mainnet';
    }

    const contract = new ethers.Contract(config[networkName].McStake,
      contracts[chainId][networkName].contracts.McStake.abi, this.props.provider);


      contract.on("ChefClaimed", (tokenId, earned, unstaked, skill, insanity, eventName, foodTokensPerRat) => {
        const oldNft = this.nfts[parseInt(tokenId)];
        // console.log(`Got event for ${tokenId}, earned ${earned / 1000000000000000000}, event ${eventName}`);

        const claimInfo = {
          tokenId: parseInt(tokenId),
          earned: earned / 1000000000000000000,
          event: eventName,
          unstaked: unstaked,
          skill: parseInt(skill),
          insanity: parseInt(insanity),
          lastUpdate: Math.floor(Date.now() / 1000),
        };
        if (oldNft && oldNft.image) {
          claimInfo['oldSkill'] = parseInt(oldNft.skill);
          claimInfo['oldInsanity'] = parseInt(oldNft.insanity);
          claimInfo['oldImg'] = oldNft.image;
        }

        const claimStats = this.state.claimStats;
        claimStats.push(claimInfo);
        this.setState({ currentStatsNFT: 0, claimStats });
      });
/*
    const filter = {
      address: this.props.readContracts.McStake.address,
      topics: [
        // the name of the event, parnetheses containing the data type of each event, no spaces
        //ethers.utils.id("TokenStaked(uint256,address,uint256"),
        ethers.utils.id("ChefClaimed(uint256,uint256,bool,uint8,uint8,string,uint256)"),
      ],
    };
    console.log('Starting claim hook at ', this.props.readContracts.McStake.address, filter);
    let format = ["uint256", "uint256", "bool", "uint8", "uint8", "string", "uint256"];

    this.props.provider.on(filter, async data => {
      let i = 0;
      const decoded = [];
      console.log(data);
      //console.log(data.topics);
      data.topics.map(v => {
        const tmp = ethers.utils.defaultAbiCoder.decode([format[i]], v);
        i += 1;
        decoded.push(tmp);
      });
      console.log('CLAIM', decoded);
    });
    */
  }

  async fetchGraph() {
    let address = "";
    if (this.props.address === "undefined" || !this.props.address || this.props.address.length < 5) {
      setTimeout(async () => {
        this.fetchGraph();
      }, 250);
      return;
    }

    const query1 = `{ characters(first: 1000, where: {
          owner: "${this.props.address || "0x2f7CdD90AB83405654eE10FC916a582a3cDe7E6F"}"
        }) {
          id, staked, owner, mcstakeStakedTimestamp, mcstakeLastClaimTimestamp, URI, type,
          insanity,  skill,
          intelligence, fatness, owed, foodTokensPerRat, stakingLocation
        }
      }`;

    const query2 = `{ characters(where: {
          mcstakeStakingOwner: "${this.props.address || "0x2f7CdD90AB83405654eE10FC916a582a3cDe7E6F"}"
        }) {
          id, staked, owner, mcstakeStakedTimestamp, mcstakeLastClaimTimestamp, URI,
          type,
          insanity, skill,
          intelligence,
          fatness, owed, foodTokensPerRat, stakingLocation
        }
      }`;

    let result1;
    try {
      result1 = await graphQLClient.request(query1);
    } catch (e) {
      console.log('ERROR', e);
      this.fetchGraph();
    }
    let result2;
    try {
      result2 = await graphQLClient.request(query2);
    } catch (e) {
      console.log('ERROR', e);
      this.fetchGraph();
    }

    let totalRats = 0;
    let totalChefs = 0;
    let totalRatsStaked = 0;
    let totalChefsStaked = 0;

    const stakedNfts = [];
    const unstakedNfts = [];

    const unstakedChefs = [];
    const unstakedRats = [];
    const stakedChefs = [];
    const stakedRats = [];


    const allStakedChefs = [];
    result1.characters.map(r => {
      if (r.URI) {
        if (r.URI.indexOf("data:application/json;base64,") === 0) {
          const base64 = r.URI.split(",");
          const decoded = atob(base64[1]);
          const json = JSON.parse(decoded);
          if (json.attributes[0].value === "Rat") {
            totalRats++;
          }
          if (json.attributes[0].value === "Chef") {
            totalChefs++;
          }
          if (parseInt(r.staked) === 0) {
            unstakedNfts.push(parseInt(r.id, 16));
          }
          if (parseInt(r.staked) === 0 && r.type === 'chef') {
            unstakedChefs.push(parseInt(r.id, 16));
          }
          if (parseInt(r.staked) === 0 && r.type === 'rat') {
            unstakedRats.push(parseInt(r.id, 16));
          }

          if (parseInt(r.staked) === 1 && r.type === 'chef') {
            stakedChefs.push(parseInt(r.id, 16));
          }
          if (parseInt(r.staked) === 1 && r.type === 'rat') {
            stakedRats.push(parseInt(r.id, 16));
          }

          if (parseInt(r.staked) === 1) {
            stakedNfts.push(parseInt(r.id, 16));
          }
        }
      }
    });
    this.newestfoodTokensPerRat = 0;
    this.newestClaim = 0;
    result2.characters.map(r => {
      if (parseInt(r.mcstakeLastClaimTimestamp) > this.newestClaim) {
        this.newestfoodTokensPerRat = parseInt(r.foodTokensPerRat);
        this.newestClaim = parseInt(r.mcstakeLastClaimTimestamp);
      }
      if (r.URI) {
        if (r.URI.indexOf("data:application/json;base64,") === 0) {
          const base64 = r.URI.split(",");
          const decoded = atob(base64[1]);
          const json = JSON.parse(decoded);
          if (json.attributes[0].value === "Rat") {
            totalRats++;
          }
          if (json.attributes[0].value === "Chef") {
            totalChefs++;
          }
          if (json.attributes[0].value === "Rat" && parseInt(r.staked) === 1) {
            totalRatsStaked++;
          }
          if (json.attributes[0].value === "Chef" && parseInt(r.staked) === 1) {
            totalChefsStaked++;
          }
          if (parseInt(r.staked) === 0) {
            unstakedNfts.push(parseInt(r.id, 16));
          }
          if (parseInt(r.staked) === 1) {
            stakedNfts.push(parseInt(r.id, 16));
          }
        }
      }
    });
    // console.log('Newest foodTokenperRat: ', newestfoodTokensPerRat);
    // console.log('Newest claim:', newestClaim );

    result2.characters.map(r => {
      if (r.URI) {
        if (r.URI.indexOf("data:application/json;base64,") === 0) {
          const base64 = r.URI.split(",");
          const decoded = atob(base64[1]);
          const json = JSON.parse(decoded);
          if (json.attributes[0].value === "Chef") {
            allStakedChefs.push(r);
          }
        }
      }
    });

    this.setState({
      loading: false,
      nonStakedGraph: result1,
      dataLoaded: true,
      stakedGraph: result2,
      stakedNfts,
      unstakedNfts,
      unstakedChefs,
      unstakedRats,
      stakedChefs,
      stakedRats,
      totalRats,
      totalChefs,
      totalRatsStaked,
      totalChefsStaked,
      allStakedChefs,
    });

    setTimeout(() => {
      const claimStats = this.state.claimStats;
      let found = false;
      let i = 0;
      claimStats.map((c) => {
        const now = Math.floor(Date.now() / 1000);
        if (now - c.lastUpdate > 10) {
          found = true;
          const nft = this.nfts[c.tokenId];
          //console.log('Found new img:', nft.image);
          claimStats[i]['newImg'] = nft.image;
        }
        i += 1;
      });
      if (found) {
        window.scrollTo(0, 0);
        this.setState({ isClaimModalVisible: true });
      }
    }, 1000);



    setTimeout(async () => {
      this.fetchGraph();
      this.fetchFromUniswap('WOOL', 'WETH', '0x8355dbe8b0e275abad27eb843f3eaf3fc855e525', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'); // WOOL-WETH
      this.fetchFromUniswap('GP', 'WETH','0x38ec27c6f05a169e7ed03132bca7d0cfee93c2c5', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'); // GP-WETH
    }, 3000);

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

    setTimeout(() => {
      this.checkClaimHook();
    }, 5000);
    this.fetchGraph();

    this.getUniswapprice();
  }

  async componentDidMount() {
    this.getChainStats();
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize = e => {
    this.setState({ windowHeight: window.innerHeight - 235 });
  };

  renderChefs() {
    return this.renderNFT("Chef");
  }

  renderRats() {
    return this.renderNFT("Rat");
  }

  renderStakedAtMcStake() {
    return this.renderNFT(null, 1, "McStake");
  }

  renderStakedAtGym() {
    return this.renderNFT(null, 1, "Gym");
  }


  async mint(stake = false) {
    try {
      const amount = this.state.mintAmount;
      let mintPrice = 0;
      if (this.state.stats && this.state.stats.mintPrice) {
        mintPrice = parseFloat(this.state.stats.mintPrice);
      }
      const sum = amount * mintPrice;
      let gasLimit;
      if (amount === 1) {
        gasLimit = 500000;
      } else {
        gasLimit = amount * 500000;
      }


      const result = await this.props.tx(
        this.props.writeContracts.Character.mint(amount, stake, {
          from: this.props.address,
          value: ethers.utils.parseEther(sum.toString()),
          gasLimit,
        }),
      );
      // {gasPrice: 1000000000, from: this.props.address, gasLimit: 85000}
      renderNotification("info", `${amount} mint(s) requested`, "");
    } catch (e) {
      const regExp = /\"message\":\"(.+?)\"/;
      const d = e.message.match(regExp);
      if (d && d[1]) {
        e.message = d[1];
      }

      renderNotification("error", "Error", e.message);
    }
  }

  async checkContractApproved() {
    const chainId = this.props.chainId;
    let networkName;
    if (chainId === 1337) {
      networkName = 'localhost';
    } else if (chainId === 4) {
      networkName = 'rinkeby';
    }
    else {
      networkName = 'mainnet';
    }
    const contract = new ethers.Contract(config[networkName].Character,
      contracts[chainId][networkName].contracts.Character.abi, this.props.provider);

    let mcStakeApproved = await contract.isApprovedForAll(this.props.address, this.props.readContracts.McStake.address);
    let gymApproved = await contract.isApprovedForAll(this.props.address, this.props.readContracts.Gym.address);
    const isApprovedForAll = {
      'McStake': mcStakeApproved,
      'Gym': gymApproved,
    }
    this.setState({isApprovedForAll});
  }

  async getBalances() {
    const chainId = this.props.chainId;
    let networkName;
    if (chainId === 1337) {
      networkName = 'localhost';
    } else if (chainId === 4) {
      networkName = 'rinkeby';
    }
    else {
      networkName = 'mainnet';
    }
    const fastFoodContract = new ethers.Contract(config[networkName].FastFood,
      contracts[chainId][networkName].contracts.FastFood.abi, this.props.provider);

    let balance = await fastFoodContract.balanceOf(this.props.address);
    balance = ethers.utils.formatEther(balance);
    this.setState({fFoodBalance: parseFloat(balance).toFixed(4)});
  }

  async getChainStats() {
    const chainId = this.props.chainId;
    let networkName;
    if (chainId === 1337) {
      networkName = 'localhost';
    } else if (chainId === 4) {
      networkName = 'rinkeby';
    }
    else {
      networkName = 'mainnet';
    }
    const CharacterContract = new ethers.Contract(config[networkName].Character,
      contracts[chainId][networkName].contracts.Character.abi, this.props.provider);
    const McStakeContract = new ethers.Contract(config[networkName].McStake,
        contracts[chainId][networkName].contracts.McStake.abi, this.props.provider);

    const minted = await CharacterContract.minted();
    let totalSupply = await CharacterContract.MAX_TOKENS();
    let paidTokens = await CharacterContract.PAID_TOKENS();
    let mintPrice = await CharacterContract.mintPrice();
    if (!mintPrice) {
      mintPrice = 0;
    }
    const rats = await CharacterContract.numRats();
    const chefs = await CharacterContract.numChefs();

    let dailyFFoodRate = await McStakeContract.dailyChefEarnings();
    if (!dailyFFoodRate) {
      dailyFFoodRate = 0;
    }

    let accrualPeriod = await McStakeContract.accrualPeriod();
    if (!accrualPeriod) {
      accrualPeriod = 0;
    }

    let chefEfficiencyMultiplier = await McStakeContract.chefEfficiencyMultiplier();
    if (!chefEfficiencyMultiplier) {
      chefEfficiencyMultiplier = 0;
    }



    let minimumToExit = await McStakeContract.vestingPeriod();
    if (!minimumToExit) {
      minimumToExit = 0;
    }

    let ratTax = await McStakeContract.ratTheftPercentage();
    if (!ratTax) {
      ratTax = 0;
    }

    let maxSupply = await McStakeContract.foodTokenMaxSupply();
    if (!maxSupply) {
      maxSupply = 0;
    }

    // TODO get once every 5-10 minutes
    let foodTokensPerRat = await McStakeContract.foodTokensPerRat();
    if (!foodTokensPerRat) {
      foodTokensPerRat = 0;
    }

    let ratEfficiencyMultiplier = await McStakeContract.ratEfficiencyMultiplier();
    if (!ratEfficiencyMultiplier) {
      ratEfficiencyMultiplier = 0;
    }

    let ratEfficiencyOffset = await McStakeContract.ratEfficiencyOffset();
    if (!ratEfficiencyOffset) {
      ratEfficiencyOffset = 0;
    }

    let ratsStaked = await McStakeContract.totalRatsStaked();
    if (!ratsStaked) {
      ratsStaked = 0;
    }

    let chefsStaked = await McStakeContract.totalChefsStaked();
    if (!chefsStaked) {
      chefsStaked = 0;
    }

    let tokensClaimed = await McStakeContract.totalFoodTokensEarned();
    if (!tokensClaimed) {
      tokensClaimed = 0;
    }
    const stats = {
      minted,
      totalSupply: parseInt(totalSupply) || 0,
      rats,
      chefs,
      ratsStaked: parseInt(ratsStaked),
      chefsStaked: parseInt(chefsStaked),
      tokensClaimed: parseFloat(ethers.utils.formatEther(tokensClaimed)).toFixed(8),
      paidTokens: parseInt(paidTokens),
      dailyFFoodRate: parseInt(ethers.utils.formatEther(dailyFFoodRate)),
      minimumToExit: parseInt(minimumToExit),
      ratTax: parseInt(ratTax),
      maxSupply: parseInt(parseInt(ethers.utils.formatEther(maxSupply))),
      mintPrice: parseFloat(ethers.utils.formatEther(mintPrice || 0)) || 0,
      levelUpThreshold: parseInt(accrualPeriod),
      chefEfficiencyMultiplier: parseInt(chefEfficiencyMultiplier),
      foodTokensPerRat: parseInt(foodTokensPerRat),
      ratEfficiencyMultiplier: parseInt(ratEfficiencyMultiplier),
      ratEfficiencyOffset: parseInt(ratEfficiencyOffset),
    };
    this.setState({ stats });

  }

  renderMintContent() {
    if (!this.state.dataLoaded) {
      return (
        <Card size="small">
          <Row>
            <Col span={24} style={{ textAlign: "center" }}>
              <Spin/>
            </Col>
          </Row>
        </Card>
      )
    }
    const mintPrice = this.getMintPrice();
    return (
      <div className="officeHeadline">
        <Row>
          <Col span={16}>
            Mint your character here:
          </Col>
        </Row>
        <Row className="officeContent">
          <Col  span={24}>
            <Row>
              <Col xs={11} md={12} className="officeLine">1. Amount of NFTs to mint</Col>
              <Col style={{width: '20px', paddingTop: '0px'}}>
                <CaretLeftOutlined onClick={this.onChangeAmount.bind(this, this.state.mintAmount - 1)} style={{cursor: 'pointer', fontSize: '20px'}}/>
              </Col>
              <Col style={{width: '25px'}}>
              <div style={{textDecoration: 'underline', paddingLeft: 11, marginTop: 5}}>{this.state.mintAmount}</div>
              </Col>
              <Col span={3}>
                <CaretRightOutlined onClick={this.onChangeAmount.bind(this, this.state.mintAmount + 1)} style={{cursor: 'pointer', marginLeft: '8px', fontSize: '20px'}}/>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row className="officeContent">
          <Col className="officeLine" xs={11} md={12} style={{ textAlign: "left"}}>
            2. Select currency for payment
          </Col>
          <Col span={12} style={{marginTop: -5}}>
          <Radio.Group onChange={this.setCurrency.bind(this)} value={this.state.currency} buttonStyle="solid">
            <Radio.Button value="wETH">$wETH</Radio.Button>
            <Radio.Button disabled={this.state.pairs['WOOL/WETH'] > 0 ? false : true} value="MATIC">$MATIC</Radio.Button>
          </Radio.Group>
          </Col>
        </Row>
        <Row  className="officeContent">
          <Col className="officeLine" xs={11} md={12}>
            3. Start minting
          </Col>
          <Col span={3} style={{paddingTop: 5}}>
            <Button className="mintButton" onClick={this.mint.bind(this, false)}>
              Mint
            </Button>
          </Col>
          <Col span={6} style={{paddingTop: 5}}>
            <Button className="mintButton" onClick={this.mint.bind(this, true)}>
              Mint & Stake
            </Button>
          </Col>
        </Row>
        <Row  className="officeContent">
          <Col className="officeLine" span={3} style={{ textAlign: "left" }}>
            Gen {this.state.stats.minted > this.state.stats.paidTokens ? 1 : 0}
          </Col>
          <Col className="officeLine" xs={8} md={9} style={{ textAlign: "left" }}>
            {this.state.stats.minted} /{" "}
            {this.state.stats.minted > this.state.stats.paidTokens
              ? this.state.stats.totalSupply
              : this.state.stats.paidTokens}
          </Col>
          <Col className="officeLine" xs={8}  style={{ textAlign: "left" }}>
            <b>1 NFT: { mintPrice } { this.state.currency }</b>
          </Col>
        </Row>
        <Row  className="officeContent">
          <Col className="officeLine" xs={11} md={12}/>
          <Col className="officeLine" xs={11} md={12} style={{ textAlign: "left" }}>
            <b>Total price: { Decimal(mintPrice).times(this.state.mintAmount).toString() } { this.state.currency }</b>
          </Col>
        </Row>
      </div>
    );
  }

  renderNFT(type, staked = 0, location = false) {
    const nft = [];
    let element;
    if (staked === 0) {
      element = this.state.nonStakedGraph;
    }
    if (staked === 1) {
      element = this.state.stakedGraph;
    }

    element.characters.map(r => {
      if (r.URI) {
        if (r.URI.indexOf("data:application/json;base64,") === 0) {
          const base64 = r.URI.split(",");
          const decoded = atob(base64[1]);
          const json = JSON.parse(decoded);
          const hash = {};
          json.attributes.map((m) => {
            hash[m.trait_type] = m.value;
          });
          if (type !== null && json.name && json.attributes[0].value === type && r.staked == staked) {
            const nftObj = {
              name: parseInt(r.id, 16),
              description: json.name,
              mcstakeTimestamp: parseInt(r.mcstakeStakedTimestamp),
              mcstakeLastClaimTimestamp: parseInt(r.mcstakeLastClaimTimestamp),
              image: json.image,
              type,
              attributes: json.attributes,
              stakingLocation: r.stakingLocation,
              insanity: parseInt(r.insanity),
              insanityLevel: hash['Insanity percentage'],
              skill: parseInt(r.skill),
              skillLevel: hash['Skill percentage'],
              intelligence: parseInt(r.intelligence),
              intelligenceLevel: hash['Intelligence percentage'],
              fatness: parseInt(r.fatness),
              fatnessLevel: hash['Fatness percentage'],
              owed: parseInt(r.owed),
              foodTokensPerRat: parseInt(r.foodTokensPerRat),
            };
            this.nfts[nftObj.name] = nftObj;
            nft.push(nftObj);
          }
          if (type === null && json.name && r.staked == staked && r.stakingLocation == location) {
            const nftObj = {
              name: parseInt(r.id, 16),
              image: json.image,
              description: json.name,
              stakingLocation: r.stakingLocation,
              mcstakeTimestamp: parseInt(r.mcstakeStakedTimestamp),
              mcstakeLastClaimTimestamp: parseInt(r.mcstakeLastClaimTimestamp),
              type: json.attributes[0].value,
              attributes: json.attributes,
              insanity: parseInt(r.insanity),
              insanityLevel: parseInt(r.insanity),
              skill: parseInt(r.skill),
              skillLevel: parseInt(r.skill),
              intelligence: parseInt(r.intelligence),
              intelligenceLevel: parseInt(r.intelligence),
              fatness: parseInt(r.fatness),
              fatnessLevel: parseInt(r.fatness),
              owed: parseInt(r.owed),
              foodTokensPerRat: parseInt(r.foodTokensPerRat),
            }
            this.nfts[nftObj.name] = nftObj;
            nft.push(nftObj);
          }
        }
      }
    });
    nft.sort((a, b) => a.name - b.name);
    if (!this.state.dataLoaded) {
      return (
        <Spin/>
      )
    }

    let nftsPerRow = 0;
    let offset = 0;
    let minimumNftsPerRow = 2;
    let nftWidth = 0;
    if (staked) {
      // Is in a kitchen
      offset = 200;
      minimumNftsPerRow = 2;
      nftWidth = 170;
    } else {
      offset = 50;
      nftWidth = 170;
    }

    if (window.innerWidth <= this.mobileBreakpoint) {
      nftWidth = 150;
    }

    // let availableSpace = window.innerWidth - offset;
    // availableSpace = availableSpace * 0.70;
    let availableSpace = this.getWidth('kitchen');
    availableSpace = availableSpace.width;
    let widthType = 'kitchen';
    if (!staked) {
      widthType = 'kitchen'
    }
    const width = this.getWidth(widthType);

    availableSpace = width.width;
    nftsPerRow = parseInt(availableSpace / nftWidth);

    if (nftsPerRow < minimumNftsPerRow) {
      nftsPerRow = minimumNftsPerRow;
    }

    const emptyRow = <Row>
      <Col span={24}>
        <Row className={`kitchenRow_${type}`}>
          <div style={{height: 10}}/>
        </Row>
      </Col>
    </Row>;

    const numberOfRows = parseInt(nft.length / nftsPerRow);
    const rows = [];
    for (let i=0;i <= numberOfRows; i += 1) {
        const rowNFTs = [];
        for (let j = 0; j < nftsPerRow; j += 1) {
          const temp = nft.shift();
          if (temp) {
            rowNFTs.push(temp);
          }

        }
        if (rowNFTs.length > 0) {
          if (type !== 'chef') {
            this.townhouseHeight += 315; // Kitchen
          }
          rows.push(this.renderNFTRow(i, nftsPerRow, rowNFTs, staked, type, location));
          if (i !== numberOfRows - 1) {
            rows.push(emptyRow);
          }

        }
    }

    if (rows.length === 0) {
      if (type !== 'chef') {
        this.townhouseHeight += 315; // Kitchen
      }
      rows.push(this.renderNFTRow(0, 0, [], staked, type, location));
      //rows.push(emptyRow);
    }


    return (
      <div>
         { rows }
      </div>
    );
  }

  renderNFTRow(i, nftsPerRow, nft, staked, type, location) {
    let className;
    let widthType;
    if (staked === 1 && location === 'McStake') {
      className = "fastFoodKitchen";
      widthType = 'kitchen';
    }
    if (staked === 1 && location === 'Gym') {
      className = "gym";
      widthType = 'kitchen';
    }

    if (type === 'Chef') {
      className = "chefWaitingRoom"
      widthType = 'kitchen';
    }
    if (type === 'Rat') {
      className = "ratSewer"
      widthType = 'kitchen';
    }

    return (
      <div className={className} style={this.getWidth(widthType)}>
      <div className="fade">
      <Row >
        <Col span={24}>
          <Row className={`kitchenRow_${widthType}`}>
          {nft.map(c => {
            return this.renderNFTCard(c, staked);
          })}
          </Row>
        </Col>
      </Row>
      </div>
      </div>
    )
  }

  renderAttribute(type) {
    switch (type) {
      case 'skill':
        return <div style={{width: '200px'}}>The chef's <img src="/img/skill.png"/> skill level increases 4% per day. </div>;
      case 'insanity':
        return <div style={{width: '200px'}}>The chef's <img src="/img/insanity.png"/> freak level increases 2% per day. When freak level reaches the state "insane" your chef might burn out.</div>;
      case 'intelligence':
          return <div style={{width: '200px'}}>The rats's <img src="/img/intelligence.png"/> intelligence level increases 4% per day. </div>;
      case 'bodymass':
          return <div style={{width: '200px'}}>The rats's <img src="/img/fatness.png"/> body mass level increases 2% per day. When the body mass reaches the state "obese" your rat might be killed by a cat. </div>;

      break;
    }
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

  handleNFTEnter(c) {
    this.setState({ nftDetailsActive: {} });
    if (c > 0) {
      const nftDetailsActive = this.state.nftDetailsActive;
      nftDetailsActive[c] = true;
      this.setState({ nftDetailsActive });
    }
  }

  handleNFTLeave(c) {
    if (c.name > 0) {
      setTimeout(() => {
        const nftDetailsActive = this.state.nftDetailsActive;
        nftDetailsActive[c.name] = false;
        this.setState({ nftDetailsActive });
      }, 100);
    }
  }

  renderNFTDetails(c, staked) {
    const hash = {};
    if (c.attributes) {
      c.attributes.map((m) => {
        hash[m.trait_type] = m.value;
      });
    }
    let height = 0;
    if (this.state.selectedNfts &&
    this.state.selectedNfts[c.name] &&
    this.state.selectedNfts[c.name]["status"] === true) {
      height = 59;
    } else {
      height = 55;
    }

    if (c.stakingLocation === 'McStake') {
      height += 44;
    }

    return (
      <span className="nftCardBack" onMouseLeave={() => this.handleNFTLeave(c)}>
        <div className="nftDetailId">
          <span style={{color: '#000000', paddingLeft: 9}}>{hash.Generation}</span>
          <span style={{color: '#FFFFFF', paddingLeft: 5}}>{hash.Type}</span>
          <span className="nftIdDetail">
            <span style={{color: '#000000'}}>#</span>
            <span style={{color: '#d1c0b6'}}>{c.name}</span>
          </span>
        </div>
        <div onClick={() => this.selectNFT(this, c.name, staked, c.type)}
        style={{height: 160}}
        className={
          this.state.selectedNfts &&
          this.state.selectedNfts[c.name] &&
          this.state.selectedNfts[c.name]["status"] === true
            ? "nftSelected nftDetails"
            : "nftNotSelected nftDetails"
        }

        >
        { c.attributes.map( (key) => (

              <div>
              {
                key.trait_type !== 'Insanity' && key.trait_type !== 'Insanity percentage' &&
                key.trait_type !== 'Skill' && key.trait_type !== 'Skill percentage' &&
                key.trait_type !== 'Intelligence' && key.trait_type !== 'Intelligence percentage' &&
                key.trait_type !== 'Fatness' && key.trait_type !== 'Fatness percentage' &&
                key.trait_type !== 'Generation' && key.trait_type !== 'Type' &&
                key.value.length > 0
                ?
              <div>
              <Row>
                <Col className="nftDetailHeader" span={24}>{key.trait_type}</Col>
              </Row>
              <Row>
                <Col className="nftDetailDetails" span={24}>{key.value}</Col>
              </Row>
              </div>: null }
              </div>
            )
        )}
        </div>
        <div style={{height}}
        className={
          this.state.selectedNfts &&
          this.state.selectedNfts[c.name] &&
          this.state.selectedNfts[c.name]["status"] === true
            ? "nftSelectedStats nftStats"
            : "nftNotSelected nftStats"
        }        >
        <Row>
          <Col style={{marginRight: '0px'}} xs={5} span={4}>
            <img alt={c.type === 'Chef' ? 'Skill' : 'Intelligence'} src={c.type === 'Chef' ? "/img/skill.png" : "/img/intelligence.png"}/></Col>
          <Col xs={16} span={18} className={c.type === 'Chef' ? 'nftDetailSkill' : 'nftDetailIntelligence'}>
            {c.type === 'Chef' ? hash.Skill : hash.Intelligence }
          </Col>
        </Row>
        <Row>
          <Col style={{marginRight: '0px'}} xs={5} span={4}>
            <img src={c.type === 'Chef' ? "/img/insanity.png" : "/img/fatness.png"}/>
          </Col>
          <Col xs={16} span={18} className={c.type === 'Chef' ? 'nftDetailInsanity' : 'nftDetailBodymass'}>
            {c.type === 'Chef' ? hash.Insanity : hash.Fatness }
          </Col>
        </Row>

        </div>

      </span>
    );
  }

  renderNFTCard(c, staked) {
    return (
      <div className="nftCardFlip">

          { this.state.nftDetailsActive && !this.state.nftDetailsActive[c.name] ? this.renderNFTColumn(c, staked) : this.renderNFTDetails(c, staked) }
        </div>

    )
  }

  renderNFTColumn(c, staked) {
    if (!c || !c.name) {
      return <div>&nbsp;</div>
    }
    return (
      <div className="nftCardFlipInner">
      <span >
        <div className="nftId"><span style={{color: '#000000'}}>#</span>
        <span style={{color: '#d1c0b6'}}>{c.name}</span>
        </div>
        <div
          onClick={() => this.selectNFT(this, c.name, staked, c.type)}

          className={
            this.state.selectedNfts &&
            this.state.selectedNfts[c.name] &&
            this.state.selectedNfts[c.name]["status"] === true
              ? "nftSelected nft"
              : "nftNotSelected nft"
          }
        >
        <img  className={c.type === 'Chef' ? "nftImage nftChef" : "nftImage nftRat"} src={c.image}/>
        </div>
        <div
        className={
          this.state.selectedNfts &&
          this.state.selectedNfts[c.name] &&
          this.state.selectedNfts[c.name]["status"] === true
            ? "nftSelectedStats nftStats"
            : "nftNotSelectedStats nftStats"
        }>
        <Popover mouseEnterDelay={1} content={c.type === 'Chef' ? this.renderAttribute.bind(this, 'skill') : this.renderAttribute.bind(this, 'intelligence')}>
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
        <Popover mouseEnterDelay={1} content={c.type === 'Chef' ? this.renderAttribute.bind(this, 'insanity') : this.renderAttribute.bind(this, 'bodymass')}>
        <Row>
        <Col style={{marginRight: '0px'}} xs={5} span={4}>
          <img src={c.type === 'Chef' ? "/img/insanity.png" : "/img/fatness.png"}/></Col>
          <Col xs={16} span={18}>
          <Progress
          format={() => <span>100<div className={this.getPercentageClass(c, 100, 2)}></div></span>}
          format={percent => <span>{percent}<div className={this.getPercentageClass(c, percent, 2)}></div></span>}
          className={c.type === 'Chef' ? "nftProgressSecondRow chef-insanity" : "nftProgressSecondRow rat-fatness"}
          strokeColor={c.type === "Chef" ? "#fc24ff" : "#ffae00"}
          percent={ c.type === 'Chef' ? c.insanityLevel : c.fatnessLevel }
          size="small"
           />
          </Col>
        </Row>
        </Popover>
        {c.stakingLocation === 'McStake' && c.mcstakeTimestamp > 0 ? (
          <div>
          <Row>
            <Col style={{marginRight: '5px', marginLeft: '0px'}} xs={3} span={2}>
              <Popover content="Your NFT earns fastfood (FFOOD) tokens when staked into a kitchen.">
              <img src="/img/ffood.png"/>
              </Popover>
            </Col>
            <Col span={7} className="funds" style={{color: '#fee017'}}>
              <Popover content="Amount of $FFOOD your NFTs have accumulated.">
                {this.renderNftProfit(c.type, c.mcstakeTimestamp, c.mcstakeLastClaimTimestamp, c.type == 'Chef' ? c.skillLevel : c.intelligenceLevel, c.type == 'Chef' ? c.insanityLevel : c.fatnessLevel, c.name, c.owed)}
              </Popover>
            </Col>
          </Row>
          <Row>
            <Col style={{marginRight: '0px'}} xs={5} span={4}>
              <img src={"/img/time.png"}/>
            </Col>
            <Col xs={16} span={18}>
              <div>{ this.renderTimeLeftForLevelUp(c.mcstakeLastClaimTimestamp, c.mcstakeTimestamp) }</div>

            </Col>
          </Row>
          </div>
        ) : null}
        <div onClick={this.handleNFTEnter.bind(this,c.name) } className="info"
        style={c.stakingLocation === 'McStake' ? {left: 135, top: 245} : {left: 137, top: 200}}>
          <img style={{marginTop: -20, marginLeft: -2}} src="/img/i.png"/>
        </div>

        </div>
      </span>
      </div>
    )
  }

  renderTimeLeftForLevelUp(lastClaim, stakeTimestamp) {
    const levelUpMsg = "Your next level upgrade is available. Unstake or claim to level up your NFT!";
    const levelUpSoon = "When the countdown ends, your next level upgrade will be available. Unstake or claim to level up your NFT!";
    if (lastClaim === 0) {
      const now = Math.floor(Date.now() / 1000);
      const d = new Date(stakeTimestamp * 1000);
      let stakeDate = d.getTime() / 1000;
      const numberOfDays = (now - stakeDate) / this.state.stats.levelUpThreshold;


      d.setDate(d.getDate() + numberOfDays);
      const futureDate = d.getTime() / 1000;

      let diff = futureDate - now;

      if ((diff < 0) && (diff > this.state.stats.levelUpThreshold * -1)) {
        diff = this.state.stats.levelUpThreshold - (diff*-1);
      }


      if (numberOfDays >= 86400) {
        return <Popover content={levelUpMsg}><div className="levelUpDone">level up!</div></Popover>;
      }
      return <Popover content={levelUpSoon}>
        <div className="levelUpTime">Y{this.secondsToHms(diff)}
        </div>
        </Popover>
    } else {
      // Already claimed at least once
      let now = Math.floor(Date.now() / 1000);
      let futureDate;
      now = Math.floor(Date.now() / 1000);
      const d = new Date(stakeTimestamp * 1000);
      let stakeDate = d.getTime() / 1000;
      const numberOfDays = (now - stakeDate) / this.state.stats.levelUpThreshold;
      if (now - lastClaim >= this.state.stats.levelUpThreshold) {
        futureDate = new Date();
        futureDate.setHours(new Date(lastClaim * 1000).getHours());
        futureDate.setMinutes(new Date(lastClaim * 1000).getMinutes());
        futureDate.setSeconds(new Date(lastClaim * 1000).getSeconds()+this.state.stats.levelUpThreshold);
        // futureDate.setDate(new Date().getDate() + 1);
        futureDate = futureDate.getTime() / 1000;
      } else {
        const d = new Date(lastClaim * 1000);
        d.setSeconds(new Date(lastClaim * 1000).getSeconds()+this.state.stats.levelUpThreshold);
        futureDate = d.getTime() / 1000;
      }

      let diff = futureDate - now;
      if (diff >= this.state.stats.levelUpThreshold) {
        return <Popover content={levelUpMsg}><div className="levelUpDone">level up!</div></Popover>;
      }
      return <Popover content={levelUpSoon}>
        <div className="levelUpTime"> X{this.secondsToHms(diff)}
        </div>
        </Popover>;
    }


  }

  secondsToHms(d) {
    d = Number(d);
    let h = Math.floor(d / 3600);
    let m = Math.floor(d % 3600 / 60);
    let s = Math.floor(d % 3600 % 60);

    if (h < 10) {
      h = "0" + h;
    }
    if (m < 10) {
      m = "0" + m;
    }
    if (s < 10) {
      s = "0" + s;
    }

    return <span>{h}<img className="colon" src="/img/colon.svg"/>{m}<img className="colon" src="/img/colon.svg"/>{s}</span>;
  }

  renderNftProfit(type, timestamp, lastClaimTimestamp, skill = 1, tolerance = 1, name, owed) {

    if (lastClaimTimestamp > timestamp) {
      timestamp = lastClaimTimestamp;
    }
    if (type !== "Rat") {
      if (this.state.stats && this.state.stats.dailyFFoodRate > 0) {
        const nominal = (this.props.lastBlockTime - timestamp) * parseInt(this.state.stats.dailyFFoodRate) / parseInt(this.state.stats.levelUpThreshold);
        const multiplier = 100000 + (skill * this.state.stats.chefEfficiencyMultiplier * 10);
        let gross = nominal * multiplier / 100000;
        let net = gross * (100 - this.state.stats.ratTax) / 100;
        /*
        console.log(`----NFT ${name}`);
        console.log(`last blocktime ${this.props.lastBlockTime} Staked Time ${timestamp} Diff ${this.props.lastBlockTime - timestamp} DailyFoodRate ${this.state.stats.dailyFFoodRate} accrualPeriod ${this.state.stats.levelUpThreshold}`);
        console.log(`efficiency ${skill} chefEfficiencyMultiplier ${this.state.stats.chefEfficiencyMultiplier }`);
        console.log(`Nominal: ${nominal} Multiplier: ${multiplier}`);
        console.log(`Gross: ${gross} Net: ${net}`);
        console.log(`----END`);
        */
        if (gross < 0) {
          gross = 0;
        }
        return parseFloat(gross).toFixed(2);
      }
      return 0;
    } else {


      const nominal = this.newestfoodTokensPerRat - owed; // stake.value ist der fastFoodPerRat Betrag zum Zeitpunkt des stakens
      const multiplier = (tolerance <= 50 ? tolerance : 100 - tolerance * this.state.stats.ratEfficiencyMultiplier * 1000 / 100) + (this.state.stats.ratEfficiencyOffset * 1000);
      // console.log('RAT', owed, this.newestfoodTokensPerRat, nominal, multiplier);
      let net = nominal * multiplier / 100000;
      if (net < 0) {
        net = 0;
      }
      return parseFloat(net).toFixed(2);
    }
  }

  selectNFT(self, item, staked , type) {
    const selectedNfts = this.state.selectedNfts;
    if (this.state.selectedNfts[item]) {
      delete selectedNfts[item];
    } else {
      selectedNfts[item] = { status: true, staked, type };
    }
    this.setState({ selectedNfts });
  }

  async setApprovalForAll(type) {
    let contract;
    if (type === 'McStake') {
      contract = 'McStake';
    } else if (type === 'Gym') {
      contract = 'Gym';
    }
    try {
      const result = await this.props.tx(
        this.props.writeContracts.Character.setApprovalForAll(this.props.readContracts[contract].address, true, {
          gasPrice: 1000000000,
          from: this.props.address,
          gasLimit: 85000,
        }),
      );
      renderNotification("info", `Approval successful`, "");
      this.checkContractApproved();
    } catch (e) {
      renderNotification("error", "Error", e.message);
    }
  }

  getButtonHeight() {
    let height=32;
    if (window.innerWidth <= this.mobileBreakpoint) {
      height=50;
    }
    return height;
  }

  renderApprovalButton(type) {

    const height = this.getButtonHeight();
    let enabled = true;
    if (this.state.isApprovedForAll[type]) {
      enabled = false;
    }

    if (this.state.unstakedNfts.length === 0) {
      enabled = false;
    }

    if (!enabled){
      return (
        <div></div>
      );
    }

    return (
      <Button style={{height}}
      className="web3Button"
      disabled={!enabled}
      type={!this.state.isApprovedForAll ? "default" : "default"}
      onClick={this.setApprovalForAll.bind(this, type)}
      >
        Authorize {type}
      </Button>
    );
  }

  async stakeAll(type, data) {
    let contract;
    if (data.key === 'fastfood') {
      contract = 'McStake';
    } else if (data.key === 'gym') {
      contract = 'Gym';
    } else {
      return;
    }

    const stakeTarget = data.key;
    const {selectedToStakeNfts, selectedToUnStakeNfts} = this.getStakeStats(type);
    let nfts = [];
    if (type === 'Rat') {
      nfts = this.state.unstakedRats;
    } else {
      nfts = this.state.unstakedChefs;
    }
    try {
      const result = await this.props.tx(
        this.props.writeContracts[contract].stakeMany(this.props.address, nfts, {
          from: this.props.address,
          gasLimit: parseInt(nfts.length * 220000),
        }),
      );
      this.setState({ selectedNfts: {} });
      renderNotification("info", `All your NFTs have been staked.`, "");
    } catch (e) {
      this.setState({ selectedNfts: {} });
      let message = e.message;
      if (e.data && e.data.message) {
        message = e.data.message;
      }
      if (message.indexOf("while formatting outputs") !== -1) {
        message = "Error while submitting transaction";
      }
      renderNotification("error", "Error", message);
    }
  }

  async unstakeAll() {
    try {
      const result = await this.props.tx(
        this.props.writeContracts.McStake.claimMany(this.state.stakedNfts, true, {
          from: this.props.address,
          gasLimit: parseInt(this.state.stakedNfts.length) * 260000,
        }),
      );
      this.setState({ selectedNfts: {} });
      renderNotification("info", `All your NFTs have been unstaked.`, "");
    } catch (e) {
      this.setState({ selectedNfts: {} });
      let message = e.message;
      if (e.data && e.data.message) {
        message = e.data.message;
      }
      renderNotification("error", "Error", message);
    }
  }

  async claimFunds(selectedToUnStakeNfts) {
    try {
      const result = await this.props.tx(
        this.props.writeContracts.McStake.claimMany(selectedToUnStakeNfts, false, {
          from: this.props.address,
          gasLimit: parseInt(selectedToUnStakeNfts.length * 260000),
        }),
      );
      this.setState({ selectedNfts: {} });
      renderNotification("info", `Your NFTs have been leveled up & Funds from your NFTs have been claimed.`, "");
      setTimeout(() => {
        this.getBalances();
      }, 1000);
    } catch (e) {
      this.setState({ selectedNfts: {} });
      let message = e.message;
      if (e.data && e.data.message) {
        message = e.data.message;
      }
      renderNotification("error", "Error", message);
    }
  }

  async stake(selectedToStakeNfts) {
    if (data.key !== 'fastfood') {
      return;
    }
    const stakeTarget = data.key;

    try {
      const result = await this.props.tx(
        this.props.writeContracts.McStake.stakeMany(this.props.address, selectedToStakeNfts, {
          from: this.props.address,
          gasLimit: parseInt(selectedToStakeNfts.length * 200000),
        }),
      );
      this.setState({ selectedNfts: {} });
      renderNotification("info", `All your NFTs have been staked.`, "");
    } catch (e) {
      this.setState({ selectedNfts: {} });
      let message = e.message;
      if (e.data && e.data.message) {
        message = e.data.message;
      }
      renderNotification("error", "Error", message);
    }
  }

  async unstake(selectedToUnStakeNfts) {
    try {
      const result = await this.props.tx(
        this.props.writeContracts.McStake.claimMany(selectedToUnStakeNfts, {
          from: this.props.address,
          gasLimit: selectedToUnStakeNfts.length * 250000,
        }),
      );
      this.setState({ selectedNfts: {} });
      renderNotification("info", `All your NFTs have been unstaked.`, "");
    } catch (e) {
      this.setState({ selectedNfts: {} });
      let message = e.message;
      if (e.data && e.data.message) {
        message = e.data.message;
      }

      renderNotification("error", "Error", message);
    }
  }

  getStakeStats(type = false) {
    const selectedToStakeNfts = [];
    const selectedToUnStakeNfts = [];
    if (type) {
      Object.keys(this.state.selectedNfts).map(n => {
        console.log(`Got status ${this.state.selectedNfts[n]["status"]} ${this.state.selectedNfts[n]["staked"]} type ${this.state.selectedNfts[n]["type"]}`);
        if (
          this.state.selectedNfts[n] &&
          this.state.selectedNfts[n]["status"] === true &&
          this.state.selectedNfts[n]["staked"] === 0 &&
          this.state.selectedNfts[n]["type"] === type
        ) {
          selectedToStakeNfts.push(parseInt(n));
        }
        if (
          this.state.selectedNfts[n] &&
          this.state.selectedNfts[n]["status"] === true &&
          this.state.selectedNfts[n]["staked"] === 1 &&
          type && this.state.selectedNfts[n]["type"]
        ) {
          selectedToUnStakeNfts.push(parseInt(n));
        }
      });
    } else {
      Object.keys(this.state.selectedNfts).map(n => {
        if (
          this.state.selectedNfts[n] &&
          this.state.selectedNfts[n]["status"] === true &&
          this.state.selectedNfts[n]["staked"] === 0
        ) {
          selectedToStakeNfts.push(parseInt(n));
        }
        if (
          this.state.selectedNfts[n] &&
          this.state.selectedNfts[n]["status"] === true &&
          this.state.selectedNfts[n]["staked"] === 1
        ) {
          selectedToUnStakeNfts.push(parseInt(n));
        }
      });
    }

    return ({ selectedToStakeNfts, selectedToUnStakeNfts});
  }

  renderStakeButton(type) {
    const {selectedToStakeNfts, selectedToUnStakeNfts} = this.getStakeStats(type);
    let enabled=true;
    if ((selectedToUnStakeNfts.length > 0) && (selectedToStakeNfts.length === 0)) {
      enabled=false;
    }
    if (!this.state.isApprovedForAll) {
      enabled=false;
    }

    const menu = (
      <Menu onClick={this.stakeAll.bind(this, type)}>
        <Menu.Item key="fastfood">to McStake</Menu.Item>
        <Menu.Item key="casualfood" disabled={true}>to TheStakeHouse</Menu.Item>
        <Menu.Item key="gourmetfood" disabled={true}>to LeStake</Menu.Item>
        <Menu.Item key="gym">to MuscleBox</Menu.Item>
      </Menu>
    );
    const height = this.getButtonHeight();
    if ((selectedToUnStakeNfts.length === 0) && (selectedToStakeNfts.length === 0)) {
      let nfts;
      if (type === 'Rat') {
        nfts = this.state.unstakedRats;
      } else {
        nfts = this.state.unstakedChefs;
      }

      if (nfts.length > 0) {



        return (
          <Dropdown className="web3Button" type={"default"} overlay={menu}>
            <Button>
              Stake all {type}s <DownOutlined/>
            </Button>
          </Dropdown>
        );
      } else {
        return <div></div>
      }
    } else if (enabled) {
      return (
        <Dropdown className="web3Button"
          type={"default"}
          overlay={menu}
          className="web3Button"
          style={{height}}
          disabled={!enabled}
          onClick={this.stake.bind(this, selectedToStakeNfts)}
        >
          <Button>
            Stake {selectedToStakeNfts.length} {type}s <DownOutlined/>
          </Button>
        </Dropdown>
      );
    }


  }

  renderUnStakeButton() {
    const {selectedToStakeNfts, selectedToUnStakeNfts} = this.getStakeStats(false);
    let enabled=true;

    if (!this.state.isApprovedForAll) {
      enabled=false;
    }

    const height = this.getButtonHeight();
    if ((selectedToUnStakeNfts.length === 0) && (selectedToStakeNfts.length === 0)) {
      const nfts = this.state.stakedNfts;
      if (nfts.length > 0) {
        return (
          <Button style={{height}} disabled={!enabled} className="web3ButtonTransparent" type={"default"} onClick={this.unstakeAll.bind(this)}>
            Unstake all
          </Button>
        );
      } else {
        return <div></div>
      }
    } else {
      return (
        <Button
          className="web3ButtonTransparent"
          type={"default"}
          style={{height}}
          disabled={!enabled}
          onClick={this.unstake.bind(this, selectedToUnStakeNfts)}
        >
          Unstake {selectedToUnStakeNfts.length} NFTs
        </Button>
      );
    }


  }

  renderUnStakeButtonOld() {
    const {selectedToStakeNfts, selectedToUnStakeNfts} = this.getStakeStats();
    let enabled=true;
    if ((selectedToStakeNfts.length > 0)) {
      enabled=false;
    }

    if ((selectedToUnStakeNfts.length === 0)) {
      enabled=false;
    }

    if (!this.state.isApprovedForAll) {
      enabled=false;
    }

    let type = 'default';
    if ((selectedToUnStakeNfts.length > 0)) {
      type = 'primary';
    }

    const height = this.getButtonHeight();

    return (
      <Button
        className="web3Button"
        style={{height}}
        type={type}
        disabled={!enabled}
        onClick={this.unstake.bind(this, selectedToUnStakeNfts)}
      >
        Unstake {selectedToUnStakeNfts.length} NFTs
      </Button>
    );
  }

  renderUnStakeAllButton(type) {
    const {selectedToStakeNfts, selectedToUnStakeNfts} = this.getStakeStats(type);
    let enabled=true;
    if ((selectedToStakeNfts.length > 0)) {
      enabled=false;
    }

    if ((selectedToUnStakeNfts.length > 0)) {
      enabled=false;
    }

    if (!this.state.isApprovedForAll) {
      enabled=false;
    }

    if (this.state.stakedNfts.length === 0) {
      enabled = false;
    }

    if ((selectedToUnStakeNfts.length === 0)) {
    }
    const height = this.getButtonHeight();
    return (
      <Button style={{height}} disabled={!enabled} className="web3Button" type={"default"} onClick={this.unstakeAll.bind(this)}>
         Unstake all
      </Button>
    );
  }

  renderClaimButton() {
    const {selectedToStakeNfts, selectedToUnStakeNfts} = this.getStakeStats();
    let enabled=true;

    if (!this.state.isApprovedForAll) {
      enabled=false;
    }

    let type = 'default';
    let nfts = [];
    if ((selectedToUnStakeNfts.length > 0)) {
      nfts = selectedToUnStakeNfts;
    } else {
      nfts = this.state.stakedNfts;
    }
    const height = this.getButtonHeight();
    let activeText = <span>Level up & Claim <img style={{paddingLeft: '1px', paddingRight: '1px', marginTop: '-5px'}}src="/img/ffood.png"/></span>
    if (nfts.length > 0) {
      return (
        <Button
          className="web3ButtonTransparent"
          style={{height}}
          type={type}
          onClick={this.claimFunds.bind(this, nfts)}
        >
          {activeText}
        </Button>
      );
    }
  }

  getSelectedNFTs() {
    const selectedToStakeNfts = [];
    const selectedToUnStakeNfts = [];
    Object.keys(this.state.selectedNfts).map(n => {
      if (
        this.state.selectedNfts[n] &&
        this.state.selectedNfts[n]["status"] === true &&
        this.state.selectedNfts[n]["staked"] === 0
      ) {
        selectedToStakeNfts.push(parseInt(n));
      }
      if (
        this.state.selectedNfts[n] &&
        this.state.selectedNfts[n]["status"] === true &&
        this.state.selectedNfts[n]["staked"] === 1
      ) {
        selectedToUnStakeNfts.push(parseInt(n));
      }
    });
    return { selectedToStakeNfts, selectedToUnStakeNfts };
  }

  renderChefHint() {
    if (this.state.unstakedChefs.length !== 0 && (!this.state.isApprovedForAll['McStake'] || !this.state.isApprovedForAll['Gym'])) {
      return (
        <div>
          In order to use the game, you will need to authorize the contracts first. Please press each Authorize button.
        </div>
      );
      return;
    } else {

      if (this.state.unstakedChefs.length === 0) {
        return (
          <span>
            The break room represents your wallet, your chefs hang out here.<br/><br/>
            From here, you can stake your chefs in a kitchen or in the gym here by selecting one chef or clicking 'Stake all'.
          </span>
        )
      }
      return (
        <span>From here, you can stake your chefs in a kitchen or in the gym here by selecting one chef or clicking 'Stake all'.</span>
      )
    }
  }

  renderRatHint() {
    if (this.state.unstakedChefs.length !== 0 && (!this.state.isApprovedForAll['McStake'] || !this.state.isApprovedForAll['Gym'])) {
      return (
        <div>
          In order to use the game, you will need to authorize the contracts first. Please press each Authorize button.
        </div>
      );
      return;
    } else {

      if (this.state.unstakedChefs.length === 0) {
        return (
          <span>
            The sewer represents your wallet, your rats hang out here.<br/><br/>
            From here, you can stake your rats in a kitchen or in the gym here by selecting one chef or clicking 'Stake all'.
          </span>
        )
      }
      return (
        <span>From here, you can stake your rats in a kitchen or in the gym here by selecting one chef or clicking 'Stake all'.</span>
      )
    }
  }

  renderStakeButtons(type) {
    let amount;
    if (type === 'Chef') {
      amount = this.state.unstakedChefs.length;
    }
    if (type === 'Rat') {
      amount = this.state.unstakedRats.length;
    }

    if (amount !== 0 && (!this.state.isApprovedForAll['McStake'] || !this.state.isApprovedForAll['Gym'])) {
      return (
      <div style={{marginTop: 20}}>
        <Row>
        <Col span="8">
          { !this.state.isApprovedForAll['McStake'] ? this.renderApprovalButton('McStake') : null}
        </Col>
        </Row>
        <Row>
        <Col span="8">
          { !this.state.isApprovedForAll['Gym'] ? this.renderApprovalButton('Gym') : null}
        </Col>
        </Row>

      </div>
      );
    }
    return (
      <div style={{marginTop: 20}}>
        <Row>
        <Col span="8">
          { this.renderStakeButton(type) }
        </Col>
        </Row>
      </div>
    )
  }

  renderNACard(title) {
    if (this.state.loading) {
      return (
        <Card size="small" title={title}>
          {!this.state.noAddressLoaded ? <Skeleton /> : <p>Connect your wallet with metamask!</p>}
        </Card>
      );
    }
  }


  getStreetLightPosition(type = 1) {
    const node = this.townhouseRef.current;
    if (node) {
      const rect = node.getBoundingClientRect();
      if (type === 1) {
        return rect.x+rect.width;
      } else {
        return rect.x+rect.width+180;
      }
    } else {
      return 0;
    }
  }

  getFlowerPot1Position() {
    const node = this.townhouseRef.current;
    if (node) {
      const rect = node.getBoundingClientRect();
      return rect.x-35;
    } else {
      return 0;
    }
  }

  getTownhouseMargin() {
    const width = this.getWidth('building');
    const margin = (window.innerWidth - width.width)/2;
    return {
      margin: "0 auto",
    }
  }

  getWidth(type = 'kitchen', stretch = false, originalWidth = false, originalHeight = false) {
    let width = 0;
    let mobile = false;

    const offsets = {
      mobileWidth: 310,
      normalLargeWidth: 650, // kitchen width
      buildingNormal: 450, // whole width for the kitchen
      buildingSmall: 271,
      normalWidth: 500,
      roofSmall: 600,
      roofNormal: 272,
      rat: 220,
      noKitchen: 200,
      townhouseMobile: 290,
      townhouseNormal: 272, // outer box, not visible
      buildingMobileWidth: 750 // Building width mobile
    };

    let maxWidth = window.innerWidth;
    if (maxWidth > 1400) {
      maxWidth = 1400;
    }

    if (maxWidth <= 900) {
        width = offsets.mobileWidth;
        mobile = true;
    }
    else {
      if (window.innerWidth > 1100) {
        if (window.innerWidth - 650 > 400) {
          width = maxWidth - offsets.normalLargeWidth;
        } else {
          width = maxWidth - offsets.normalLargeWidth;
        }
      } else {
        width = window.innerWidth * 0.5;
      }
    }



    if (type === 'roof') {
      const tmp = this.getWidth('kitchen');
      if (maxWidth <= this.mobileBreakpoint) {
        width = offsets.roofSmall;
      } else {
        width = tmp.width + offsets.roofNormal;
      }
    }
    else if (type === 'townhouse') {


      const tmp = this.getWidth('kitchen');
      if (maxWidth <= this.mobileBreakpoint) {
        width = tmp.width + offsets.townhouseMobile;
      } else {
        width = tmp.width + offsets.townhouseNormal;
      }
    }
    else if (type === 'sewer') {
      const tmp = this.getWidth('kitchen');
      width = tmp.width + 272;
    } else if (type === 'building') {
      const tmp = this.getWidth('kitchen');
      if (window.innerWidth > this.mobileBreakpoint) {
        width = tmp.width + offsets.buildingNormal;
        if (width > 1022) {
          width = 1022;
        }
      } else {
        width = offsets.buildingMobileWidth;
      }

    } else if (type === 'rats') {
        width += offsets.rat;
    } else if (type !== 'kitchen') {
          width += offsets.noKitchen;
    }


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

  getOfficeBackground() {
    if (this.state.officeView === 'mint') {
      return 'officeBackground1';
    }
    if (this.state.officeView === 'balance') {
      return 'officeBackground2';
    }
    if (this.state.officeView === 'stats') {
      return 'officeBackground3';
    }

  }

  renderRatAlertOfficeInfo(fullLine = false) {
    if (fullLine) {
      return (
        <Row>
        <Col span={24}>
          <div className="officeFullScene">
            <span class="logoText">
              RATalert
            </span>
            <div className="logoLine"/>
            <div className="officeFullDescription">
            The NFT game that lets you train your characters
  on-chain for higher rewards!<br/><br/>
  Learn more about the rules in the <Link>Whitepaper</Link>.
            </div>
            <Radio.Group onChange={this.setOfficeView.bind(this)} value={this.state.officeView} buttonStyle="solid">
              <Radio.Button value="mint">Mint</Radio.Button>
              <Radio.Button value="balance">Balance</Radio.Button>
              <Radio.Button value="stats">Stats</Radio.Button>
            </Radio.Group>

          </div>
        </Col>
        </Row>
      );
    }

    return (
      <Col style={{width: '180px'}}>
        <div className="officeScene">
          <span class="logoText">
            RATalert
          </span>
          <div className="logoLine"/>
          <div className="officeDescription">
          The NFT game that lets you train your characters
on-chain for higher rewards!<br/><br/>
Learn more about the rules in the <Link>Whitepaper</Link>.
          </div>
          <Radio.Group onChange={this.setOfficeView.bind(this)} value={this.state.officeView} buttonStyle="solid">
            <Radio.Button value="mint">Mint</Radio.Button>
            <Radio.Button value="balance">Balance</Radio.Button>
            <Radio.Button value="stats">Stats</Radio.Button>
          </Radio.Group>

        </div>
      </Col>
    );
  }

  renderMobileOfficeNav() {
    return (
      <div style={{marginTop: 70, marginLeft: 90, color: '#FFFFFF'}}>
      <Radio.Group onChange={this.setOfficeView.bind(this)} value={this.state.officeView} buttonStyle="solid">
        <Radio.Button value="mint">Mint</Radio.Button>
        <Radio.Button value="balance">Balance</Radio.Button>
        <Radio.Button value="stats">Stats</Radio.Button>
      </Radio.Group>
      </div>
    );
  }

  renderRoof() {
    const style = this.getWidth('roof', true, 1000, 300);
    style.margin = "0 auto";
    const catWidth = style.width * 0.04;
    const catHeight = style.height * 0.14;
    return (
      <div className="roof" style={style}>
        <div className="roofCat" style={{width: catWidth, height: catHeight}}>
        </div>
      </div>
    )
  }

  renderNfts() {
    this.nftProfit = 0;
    this.townhouseHeight = 0;
    const roofHeight = this.getWidth('roof', true, 1000, 300);
    this.townhouseHeight += roofHeight.height; // Roof
    this.townhouseHeight += 315; // Office
    this.townhouseHeight += 315; // Gourmet Kitchen
    this.townhouseHeight += 315; // Casual Kitchen
    this.townhouseHeight += 315; // Gym
    const sewer = this.getWidth('sewer');
    if (window.innerWidth < 769) {
      sewer.width += 18;
    }
    return (
      <div className="stakeHouse" size="small" style={this.getWidth('townhouse')}>
        <Card className="house office kitchenMargin" size="small" style={this.getWidth('building')}>
          <Row >
            { window.innerWidth > this.officeBreakpoint ? this.renderRatAlertOfficeInfo(false) : this.renderRatAlertOfficeInfo(true) }
            <Col>
              <div className={this.getOfficeBackground()} style={this.getWidth(window.innerWidth > this.officeBreakpoint ? 'kitchen' : null)}>
                <div className="officeBoard">
                  { this.state.officeView === 'mint' ?
                    this.props.address ? this.renderMintContent() : this.renderNACard("Mint")
                    : null }
                    { this.state.officeView === 'balance' ?
                      this.props.address ? this.renderBalances() : this.renderNACard("Balance")
                      : null }
                      { this.state.officeView === 'stats' ?
                        this.renderStats()
                        : null }
                </div>
              </div>
            </Col>
          </Row>
        </Card>
        <div className="floor"/>
        <Card className="house kitchenMargin" size="small" style={this.getWidth('building')}>
          <Row >
            <Col style={{width: '180px'}}>
              <div className="gourmetScene">
              </div>
              <div className="restaurantSign">
                <img width={window.innerWidth < 1080 ? 75 : 150} src="img/le-stake.png"/>
              </div>
            </Col>
            <Col>
              <div className="fade gourmetKitchen" style={this.getWidth()}>
              </div>
            </Col>
          </Row>
        </Card>
        <div className="floor"/>
        <Card className="house kitchenMargin" size="small" style={this.getWidth('building')}>
          <Row>
            <Col style={{width: '180px'}}>
            <div className="casualScene">
            </div>
            <div className="restaurantSign">
              <img width={window.innerWidth < 1080 ? 50 : 150} src="img/stake-house.png"/>
            </div>

            </Col>
            <Col>
            <div className="fade casualKitchen" style={this.getWidth()}>
            </div>

            </Col>
          </Row>
        </Card>
        <div className="floor"/>
        <Card className="house kitchenMargin" size="small" style={this.getWidth('building')}>
          <Row>
            <Col style={{width: '180px'}}>
            <div className="fastFoodScene">
              <div style={{paddingTop: 210}}>
                { this.renderUnStakeButton() }
              </div>
              <div style={{paddingTop: 10}}>
                { this.renderClaimButton() }
              </div>
            </div>
            <div className="restaurantSign">
              <img width={window.innerWidth < 1080 ? 50 : 150} src="img/mc-stake.png"/>
            </div>
            </Col>
            <Col style={{marginLeft: '20px'}}>
              {!this.state.loading ? this.renderStakedAtMcStake() : <Skeleton />}
            </Col>
          </Row>
        </Card>
        <div className="floor"/>
        <Card className="house kitchenMargin" size="small" style={this.getWidth('building')}>
          <Row >
            <Col style={{width: '180px'}}>
              <div className="descriptionBox">
                <span class="logoText">
                  GYM
                </span>
                <div class="subtitle">
                  muscle box
                </div>

                <div className="logoLine"/>
                <div className="gymDescription">
                <div style={{paddingTop: 20}}>
                  <div class="hintHeader">Hint</div>
                  <div class="hintContent">
                  Time in the gym is good for your NFTs health. No tokens are earned.
                  <br/><br/>
                  Chefs reduce their freak level by -12% per day.
                  <br/><br/>
                  Rats reduce their body mass by -8% per day.
                  </div>
                </div>
                </div>
              </div>
            </Col>
            <Col style={{marginLeft: '20px'}}>
              <div style={this.getWidth()}>
              {!this.state.loading ? this.renderStakedAtGym() : <Skeleton />}
              </div>
            </Col>
          </Row>
        </Card>
        <div className="floor"/>
        <Card className="house kitchenMargin" size="small" style={this.getWidth('building')}>
          <Row >
          <Col style={{width: '180px'}}>
            <div className="descriptionBox">
              <span class="logoText">
                CHEFs
              </span>
              <div class="subtitle">
                break room
              </div>
              <div className="logoLine"/>

              { this.renderStakeButtons('Chef') }
              <div>
                <div class="hintHeader">Hint</div>
                <div class="hintContent">
                  { this.renderChefHint() }
                </div>
              </div>
            </div>
          </Col>
            <Col style={{marginLeft: '20px'}}>
            {!this.state.loading ? this.renderChefs() : <Skeleton />}
            </Col>
        </Row>
        </Card>
        <div className="streetlight2">
        </div>
        <div className="streetlight3" style={{ left: this.getStreetLightPosition(1)} }>
        </div>
        <div className="streetlight1" style={{ left: this.getStreetLightPosition(2)} }>
        </div>

        <div className="flowerpot1" style={{ left: this.getFlowerPot1Position()} }>
        </div>

        <div className="fence" style={{ left: this.getStreetLightPosition() }}>
        </div>

        <div className="flowerpot2" style={{ left: this.getStreetLightPosition()+100} }>
        </div>

        <div className="skyline" style={{width: window.innerWidth+150}}>
        </div>
        <div className="street" style={{width: window.innerWidth+150}}>
        </div>

        <div className="darkBackground" style={{height: 900, width: window.innerWidth+100}}>
        </div>

        <div className="sewerEntrance">
          <div style={this.getWidth('kitchen')} className="ground"/>
        </div>
        <Card className="house gym sewer" size="small" style={sewer}>
          <Row >
          <Col style={{width: '180px'}}>
            <div className="descriptionBox">
              <span class="logoText">
                RATs
              </span>
              <div class="subtitle">
                sewer
              </div>
              <div className="logoLine"/>
              { this.renderStakeButtons('Rat') }

              <div>
                <div>
                  <div class="hintHeader">Hint</div>
                  <div class="hintContent">
                    { this.renderRatHint() }
                  </div>
                </div>
              </div>
            </div>
          </Col>
            <Col className="marginSewer">
            {!this.state.loading ? this.renderRats() : <Skeleton />}
            </Col>
          </Row>
        </Card>
        <div className="belowTheSewer"/>
      </div>
    );
  }

  async addToken() {
    const tokenAddress = this.props.readContracts.FastFood.address;
    const tokenSymbol = 'FFOOD';
    const tokenDecimals = 18;
    const tokenImage = 'http://placekitten.com/200/300';

    try {
      // wasAdded is a boolean. Like any RPC method, an error may be thrown.
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20', // Initially only supports ERC20, but eventually more!
          options: {
            address: tokenAddress, // The address that the token is at.
            symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
            decimals: tokenDecimals, // The number of decimals in the token
            image: tokenImage, // A string url of the token logo
          },
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  renderStats() {
    if (!this.state.dataLoaded) {
      return (
        <Row>
          <Col span={24} style={{ textAlign: "center" }}>
            <Spin/>
          </Col>
        </Row>
      )
    }

    return (
      <div className="officeHeadline">
      <Row>
        <Col span={12}>
          Stats
        </Col>
      </Row>
      <Row>
        <Col span={12}>Total rats</Col>
        <Col span={12}>{this.state.stats.rats}</Col>
        <Col span={12}>Total rats staked</Col>
        <Col span={12}>{this.state.stats.ratsStaked}</Col>
        <Col span={12}>Total chefs</Col>
        <Col span={12}>{this.state.stats.chefs}</Col>
        <Col span={12}>Total chefs staked</Col>
        <Col span={12}>{this.state.stats.chefsStaked}</Col>
        <Col span={12}>Total $FFOOD claimed</Col>
        <Col span={12}>{this.state.stats.tokensClaimed}</Col>
      </Row>
      </div>
    )
  }

  renderBalances() {
    return (
      <div className="officeHeadline">
        <Row>
          <Col span={16}>
            Balances
          </Col>
        </Row>
        <Row className="officeContent">
          <Col span={12}>
            $FFOOD
          </Col>
          <Col span={12}>
          {this.state.fFoodBalance }
          </Col>
        </Row>
      </div>
    );

  }

  renderClaimStats(id) {
    const key = this.state.claimStats[id];
    return (
      <div>
        <Row>
          <Col span={4} >Claimed</Col>
            <Col span={20} className="modalClaim">
            { parseFloat(key.earned).toFixed(2) } $FFOOD
            </Col>
        </Row>
        <Row>
          <Col span={4}>Event</Col>
            <Col span={20} className="modalClaim">
            { key.event ? key.event : 'No event has happened.' }
            </Col>
        </Row>
        <Row style={{marginTop: 30}}>
        </Row>
        <Row>
            <Col span={24}><strong>Attributes</strong></Col>
        </Row>
        <Row>
            <Col span={4}></Col>
            <Col span={10} className="modalClaim">Old</Col>
            <Col span={10} className="modalClaim">New</Col>
        </Row>
        <Row>
            <Col span={4}>Image</Col>
            <Col span={10} className="modalClaim">
              <img style={{width: 125}} src={key.oldImg}/>
            </Col>
            <Col span={10} className="modalClaim">
              <img style={{width: 125}} src={key.newImg}/>
            </Col>
        </Row>
        <Row>
            <Col span={4}>Skill</Col>
            <Col span={10}  className="modalClaim">
              { key.skill }
            </Col>
            <Col span={10} className="modalClaim">
              { key.oldSkill }
            </Col>
        </Row>
        <Row>
            <Col span={4}>Freak Level</Col>
            <Col span={10} className="modalClaim">
              { key.insanity }
            </Col>
            <Col span={10} className="modalClaim">
              { key.insanity }
            </Col>
        </Row>
    </div>
    )
  }

  renderClaimModal() {
    return (
      <div>
        <div>
        <Col  span={24}>
          <Row>
            <Col xs={11} md={12} className="officeLine">Total NFT Updates: </Col>
            <Col style={{width: '20px', paddingTop: '10px'}}>
              <CaretLeftOutlined onClick={this.onChangeCurrentNFT.bind(this, this.state.currentStatsNFT - 1)} style={{cursor: 'pointer', fontSize: '20px'}}/>
            </Col>
            <Col style={{width: '30px', paddingTop: '10px'}}>
            <span style={{textDecoration: 'underline'}}>{ this.state.currentStatsNFT + 1 }</span> / { this.state.claimStats.length }
            </Col>
            <Col span={3} style={{width: '20px', paddingTop: '10px'}}>
              <CaretRightOutlined onClick={this.onChangeCurrentNFT.bind(this, this.state.currentStatsNFT + 1)} style={{cursor: 'pointer', marginLeft: '8px', fontSize: '20px'}}/>
            </Col>
          </Row>
        </Col>
          { this.state.claimStats[this.state.currentStatsNFT] ? this.renderClaimStats(this.state.currentStatsNFT) : null }
        </div>
       {
         /* JSON.stringify(this.state.claimStats)
       */
      }
      </div>
    )
  }

  renderGame() {
    const skyAttr = this.getWidth('sky', true, 1440, 1000);
    return (
          <Row style={{ height: "100%" }}>
            <div className="sky" style={skyAttr}>
            </div>
            <div className="nightGradient" style={{top: skyAttr.height, height: this.townhouseHeight - 150}}>
            </div>




            <div ref={this.townhouseRef} className="townhouseBox" style={this.getTownhouseMargin()}>
              { this.renderRoof() }
              {this.props.address ? this.renderNfts() : this.renderNACard()}
            </div>

            <Modal title="Claiming was successful" onOk={() => this.setState({isClaimModalVisible: false, claimStats: []})} visible={this.state.isClaimModalVisible}>
              { this.renderClaimModal() }
            </Modal>

          </Row>
    );
  }

  renderSplash() {
    return (
          <Row style={{ height: window.innerHeight-140, textAlign: 'center' }}>
            <Col span={24}>
            Splash screen
            </Col>
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
      if (this.props.address) {
        return this.renderGame();
      } else {
        return this.renderSplash();
      }

    }
  }
}

export default Main;
