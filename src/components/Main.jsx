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
      dayTime: this.props.dayTime,
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
    if (currentStatsNFT >= 0 && currentStatsNFT < this.state.claimStats.length) {
      this.setState({ currentStatsNFT });
    }

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

  getNetworkName() {
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
    return { networkName, chainId };
  }

  async checkClaimHook() {
    const { networkName, chainId } = this.getNetworkName();

    const contract = new ethers.Contract(config[networkName].McStake,
      contracts[chainId][networkName].contracts.McStake.abi, this.props.provider);

    const mintContract = new ethers.Contract(config[networkName].Mint,
        contracts[chainId][networkName].contracts.Mint.abi, this.props.provider);

      mintContract.on("RandomNumberRequested", async(requestId, sender) => {
        console.log(`Randon number requested: ${requestId}`);
      });

      contract.on("ChefClaimed", async(tokenId, earned, unstaked, skill, insanity, eventName, foodTokensPerRat) => {
          const oldNft = this.nfts[parseInt(tokenId)];
          // console.log(`Got event for ${tokenId}, earned ${earned / 1000000000000000000}, event ${eventName}`);
//          eventName = 'burnout';
          const claimInfo = {
            tokenId: parseInt(tokenId),
            earned: earned / 1000000000000000000,
            event: eventName,
            unstaked: unstaked,
            skill: parseInt(skill),
            insanity: parseInt(insanity),
            lastUpdate: Math.floor(Date.now() / 1000),
          };

          const contract = new ethers.Contract(config[networkName].Character,
            contracts[chainId][networkName].contracts.Character.abi, this.props.provider);

          const URI = await contract.tokenURI(parseInt(tokenId));
          if (URI.indexOf("data:application/json;base64,") === 0) {
            const base64 = URI.split(",");
            const decoded = atob(base64[1]);
            const json = JSON.parse(decoded);
            const img = json.image;
            claimInfo['image'] = img;
            const hash = {};
            json.attributes.map((m) => {
              hash[m.trait_type] = m.value;
            });
            const claimStats = this.state.claimStats;
            if (hash['Skill']) {
              claimInfo.skillLevel = hash.Skill;
            }
            if (hash['Insanity']) {
              claimInfo.insanityLevel = hash.Insanity;
            }
            if (oldNft && oldNft.image) {
              claimInfo['oldSkill'] = parseInt(oldNft.skillLevel);
              claimInfo['oldInsanity'] = parseInt(oldNft.insanityLevel);
              claimInfo['oldSkillName'] = oldNft.skillName;
              claimInfo['oldInsanityName'] = oldNft.insanityName;
            }
            claimStats.push(claimInfo);
            window.scrollTo(0, 0);
            this.setState({ claimStats, isClaimModalVisible: true });
          }
      });

      contract.on("RatClaimed", async(tokenId, earned, unstaked, intelligence, fatness, eventName) => {
          const oldNft = this.nfts[parseInt(tokenId)];
           console.log(`Got event for ${tokenId}, earned ${earned / 1000000000000000000}, event ${eventName}`);
//          eventName = 'burnout';
          const claimInfo = {
            tokenId: parseInt(tokenId),
            earned: earned / 1000000000000000000,
            event: eventName,
            unstaked: unstaked,
            intelligence: parseInt(intelligence),
            fatness: parseInt(fatness),
            lastUpdate: Math.floor(Date.now() / 1000),
          };

          const contract = new ethers.Contract(config[networkName].Character,
            contracts[chainId][networkName].contracts.Character.abi, this.props.provider);

          const URI = await contract.tokenURI(parseInt(tokenId));
          if (URI.indexOf("data:application/json;base64,") === 0) {
            const base64 = URI.split(",");
            const decoded = atob(base64[1]);
            const json = JSON.parse(decoded);
            const img = json.image;
            claimInfo['image'] = img;
            const hash = {};
            json.attributes.map((m) => {
              hash[m.trait_type] = m.value;
            });
            const claimStats = this.state.claimStats;
            if (hash['Intelligence']) {
              claimInfo.intelligenceLevel = hash.Intelligence;
            }
            if (hash['Fatness']) {
              claimInfo.fatnessLevel = hash.Fatness;
            }
            if (oldNft && oldNft.image) {
              claimInfo['oldIntelligence'] = parseInt(oldNft.intelligenceLevel);
              claimInfo['oldFatness'] = parseInt(oldNft.fatnessLevel);
              claimInfo['oldIntelligenceName'] = oldNft.intelligenceName;
              claimInfo['oldFatnessName'] = oldNft.fatnessName;
            }
            claimStats.push(claimInfo);
            console.log(claimInfo);
            window.scrollTo(0, 0);
            this.setState({ currentStatsNFT: 0, claimStats, isClaimModalVisible: true });
          }
      });

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
    /*
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
          claimStats[i]['img'] = nft.image;
        }
        i += 1;
      });
      if (found) {
        window.scrollTo(0, 0);
        this.setState({ isClaimModalVisible: true });
      }
    }, 1000);
    */



    setTimeout(async () => {
      this.fetchGraph();
      this.fetchFromUniswap('WOOL', 'WETH', '0x8355dbe8b0e275abad27eb843f3eaf3fc855e525', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'); // WOOL-WETH
      this.fetchFromUniswap('GP', 'WETH','0x38ec27c6f05a169e7ed03132bca7d0cfee93c2c5', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'); // GP-WETH
    }, 3000);

  }

  isScrolledIntoView(el) {
    var rect = el.getBoundingClientRect();
    var elemTop = rect.top;
    var elemBottom = rect.bottom;

    // Only completely visible elements return true:
    var isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);
    // Partially visible elements return true:
    //isVisible = elemTop < window.innerHeight && elemBottom >= 0;
    return isVisible;
  }

  async componentWillMount() {
    window.addEventListener('scroll', () => {
      const scrollPosition = window.pageYOffset;
      const bgElements = document.getElementsByClassName('parallax');
      if (bgElements.length > 0) {
        for (let i = 0; i <= bgElements.length; i += 1) {
          if (i - 1 >= 0) {
            const bgParallax = bgElements[i - 1];
            const limit = bgParallax.offsetTop + bgParallax.offsetHeight;
            const rect = bgParallax.getBoundingClientRect();

              if (scrollPosition > rect.y) {
                //console.log(scrollPosition, rect.y, scrollPosition / 24);
                bgParallax.style.backgroundPositionY = `-${(scrollPosition-rect.y) / 40}px`;
              } else{
                bgParallax.style.backgroundPositionY = '0';
              }
          }
        }
      }
    });

    window.addEventListener("resize", this.handleResize);
    setTimeout(() => {
      if (!this.props.address) {
        this.setState({ noAddressLoaded: true, loading: false });
      } else {
        this.setState({ loading: false, noAddressLoaded: false });
      }

    }, 0);

    setTimeout(() => {
      this.checkClaimHook();
    }, 5000);
    this.fetchGraph();

    this.getUniswapprice();
  }

  async componentDidMount() {
    this.getChainStats();
    window.addEventListener("dayTime", (e) => {
      this.setState({dayTime: e.detail.dayTime})
    });

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
      renderNotification("info", `${amount} mint(s) requested. Your NFTs will be delivered within a minute or two.`, "");
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
    const { networkName, chainId } = this.getNetworkName();
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
    const { networkName, chainId } = this.getNetworkName();
    const fastFoodContract = new ethers.Contract(config[networkName].FastFood,
      contracts[chainId][networkName].contracts.FastFood.abi, this.props.provider);

    let balance = await fastFoodContract.balanceOf(this.props.address);
    balance = ethers.utils.formatEther(balance);
    this.setState({fFoodBalance: parseFloat(balance).toFixed(4)});
  }

  async getChainStats() {
    const { networkName, chainId } = this.getNetworkName();
    const CharacterContract = new ethers.Contract(config[networkName].Character,
      contracts[chainId][networkName].contracts.Character.abi, this.props.provider);
    const McStakeContract = new ethers.Contract(config[networkName].McStake,
        contracts[chainId][networkName].contracts.McStake.abi, this.props.provider);


    const minted = await CharacterContract.minted();
    let totalSupply = await CharacterContract.maxTokens();
    let paidTokens = await CharacterContract.gen0Tokens();
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
              insanityName: hash['Insanity'],
              skill: parseInt(r.skill),
              skillLevel: hash['Skill percentage'],
              skillName: hash['Skill'],
              intelligence: parseInt(r.intelligence),
              intelligenceName: hash['Intelligence'],
              intelligenceLevel: hash['Intelligence percentage'],
              fatness: parseInt(r.fatness),
              fatnessLevel: hash['Fatness percentage'],
              fatnessName: hash['Fatness'],
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
              fatnessName: hash['Fatness'],
              intelligenceName: hash['Intelligence'],
              insanityName: hash['Insanity'],
              skillName: hash['Skill'],
            }
            this.nfts[nftObj.name] = nftObj;
            nft.push(nftObj);
          }
        }
      }
    });
    nft.sort((a, b) => a.name - b.name);
    /*
    if (!this.state.dataLoaded) {
      return (
        <Spin/>
      )
    }
    */

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

    let rowId;
    if (!location) {
      rowId = type;
    } else {
      rowId = location;
    }
    return (
      <div key={`key_${rowId}`}>
         { rows }
      </div>
    );
  }

  renderNFTRow(i, nftsPerRow, nft, staked, type, location) {
    const { networkName, chainId } = this.getNetworkName();
    let className;
    let widthType;
    let closed = false;
    if (staked === 1 && location === 'McStake') {
      if (config[networkName].fastFoodKitchenClosed) {
        closed = true;
        className = "parallax fastFoodKitchenClosed";
      } else {
        className = "parallax fastFoodKitchen";
      }
      widthType = 'kitchen';
    }
    if (staked === 1 && location === 'Gym') {
      className = "parallax gym";
      widthType = 'kitchen';
    }

    if (type === 'Chef') {
      className = "parallax chefWaitingRoom"
      widthType = 'kitchen';
    }
    if (type === 'Rat') {
      className = "ratSewer"
      widthType = 'kitchen';
    }
    const kitchenWidth = this.getWidth('kitchen');
    return (
      <div className={className} style={this.getWidth(widthType)}>
      <div className={ !closed ? 'fade' : null }>
      <Row >
        <Col span={24}>
          <Row className={`kitchenRow_${widthType}`}>
          {!closed && nft.map(c => {
            return this.renderNFTCard(c, staked);
          })}

          { closed && config[networkName].fastfoodClosedSign ? <div style={{left: (kitchenWidth.width / 2)*0.9}}className="closedSign"/> : null }
          { closed && config[networkName].fastfoodForSaleSign ? <div style={{left: (kitchenWidth.width / 2)*0.9}}className="forSaleSign"/> : null }


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
    if (c > 0) {
      setTimeout(() => {
        const nftDetailsActive = this.state.nftDetailsActive;
        nftDetailsActive[c] = false;
        this.setState({ nftDetailsActive });
      }, 100);
    }
  }

  renderToleranceTitle(c, hash, border = false) {
    let className = '';
    if (border) {
      if (c.type === 'Chef') {
        className = 'nftDetailInsanityBorder'
      } else {
        className = 'nftDetailFatnessBorder'
      }
    }
    return (
      <div className={className}>
      <Row>
        <Col style={{marginRight: '0px'}} xs={5} span={4}>
          <img alt={c.type === 'Chef' ? 'Insanity' : 'Fatness'} src={c.type === 'Chef' ? "/img/insanity.png" : "/img/fatness.png"}/></Col>
        <Col xs={16} span={18} className={c.type === 'Chef' ? 'nftDetailInsanity' : 'nftDetailBodymass'}>
          {c.type === 'Chef' ? hash.Insanity : hash.Fatness }
        </Col>
      </Row>
      </div>
    )
  }

  renderEfficiencyTitle(c, hash, border = false) {
    let className = '';
    if (border) {
      if (c.type === 'Chef') {
        className = 'nftDetailSkillBorder'
      } else {
        className = 'nftDetailIntelligenceBorder'
      }
    }
    return (
      <div className={className}>
      <Row>
        <Col style={{marginRight: '0px'}} xs={5} span={4}>
          <img alt={c.type === 'Chef' ? 'Skill' : 'Intelligence'} src={c.type === 'Chef' ? "/img/skill.png" : "/img/intelligence.png"}/></Col>
        <Col xs={16} span={18} className={c.type === 'Chef' ? 'nftDetailSkill' : 'nftDetailIntelligence'}>
          {c.type === 'Chef' ? hash.Skill : hash.Intelligence }
        </Col>
      </Row>
      </div>
    )
  }

  renderNFTDetails(c, staked, type = 'app', highlightEfficiency = false, highlightTolerance = false) {
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
    height += 44;

    let classNameImg = 'nftDetails';
    let classNameStats = 'nftStats';
    if (type === 'modal') {
      classNameImg = 'nftDetailsModal'
      classNameStats = 'nftStatsModalEnd'
    }

    return (
      <span className="nftCardBack">
        <div className={type === 'modal' ? 'nftDetailIdModal' : 'nftDetailId'}>
          <span style={{color: '#000000', paddingLeft: 9}}>{hash.Generation}</span>
          { type !== 'modal' ? <span style={{color: '#FFFFFF', paddingLeft: 5}}>{hash.Type}</span> : null }
          <span className={type === 'modal' ? "nftIdDetailModal" : "nftIdDetail"}>
            <span style={{color: '#000000'}}>#</span>
            <span style={{color: '#d1c0b6'}}>{c.name}</span>
          </span>
        </div>
        <div onClick={() => this.selectNFT(this, c.name, staked, c.type, type)}
        style={{height: 170}}
        className={
          this.state.selectedNfts &&
          this.state.selectedNfts[c.name] &&
          this.state.selectedNfts[c.name]["status"] === true
            ? `nftSelected ${classNameImg}`
            : `nftNotSelected ${classNameImg}`
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
                <Col className="nftDetailHeader" span={24}>{key.trait_type}:</Col>
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
            ? `nftSelectedStats ${classNameStats}`
            : `nftNotSelected ${classNameStats}`
        }        >
        { type !== 'modal' ?
        <div style={{position: 'absolute'}}>
          <div style={{position: 'relative', left: 120, top: 54}} onClick={this.handleNFTLeave.bind(this,c.name) } className="info">
            <img style={{marginTop: -19, marginLeft: -2}} src="/img/i.png"/>
          </div>
        </div> : null }

        { this.renderEfficiencyTitle(c, hash, highlightEfficiency) }
        { this.renderToleranceTitle(c,hash, highlightTolerance) }
        </div>

      </span>
    );
  }

  renderNFTCard(c, staked) {
    return (
      <div key={c.name} className="nftCardFlip">

          { this.state.nftDetailsActive && !this.state.nftDetailsActive[c.name] ? this.renderNFTColumn(c, staked, 'app') : this.renderNFTDetails(c, staked) }
        </div>

    )
  }

  renderNFTColumn(c, staked, type = 'app') {
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
          onClick={() => this.selectNFT(this, c.name, staked, c.type, type)}
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
        </div>
        <div
        style={{height: 99}}
        className={
          this.state.selectedNfts &&
          this.state.selectedNfts[c.name] &&
          this.state.selectedNfts[c.name]["status"] === true
            ? `nftSelectedStats ${classNameStats}`
            : `nftNotSelectedStats ${classNameStats}`
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
        {type !== 'modal' && c.stakingLocation === 'McStake' && c.mcstakeTimestamp > 0 ? (
          <div>
          { type !== 'modal' ? <div style={{position: 'absolute'}}>
            <div style={{position: 'relative', left: 120, top: 10}} onClick={this.handleNFTEnter.bind(this,c.name) } className="info">
              <img style={{marginTop: -19, marginLeft: -2}} src="/img/i.png"/>
            </div>
          </div> : null}


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
            <Col xs={16} span={17}>
              <div>{ this.renderTimeLeftForLevelUp(c.mcstakeLastClaimTimestamp, c.mcstakeTimestamp) }</div>
            </Col>
          </Row>

          </div>
        ) :
        <div>

        { type !== 'modal' ? <div className="clickToSelect">Click to select</div> : null }
        { type !== 'modal' ? <div style={{position: 'absolute'}}>
          <div style={{position: 'relative', left: 120, top: -24}} onClick={this.handleNFTEnter.bind(this,c.name) } className="info">
            <img style={{marginTop: -19, marginLeft: -2}} src="/img/i.png"/>
          </div>
        </div> : null}

        </div>
      }

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
      if (isNaN(numberOfDays)) {
        return 0;
      }
      let diff = now - stakeDate;

      if ((diff > this.state.stats.levelUpThreshold) && (numberOfDays > 1)) {
        diff = this.state.stats.levelUpThreshold - (diff-(Math.floor(numberOfDays) * this.state.stats.levelUpThreshold));
      }

      if (diff < this.state.stats.levelUpThreshold) {
        diff = this.state.stats.levelUpThreshold - diff;
      }

      if (diff > this.state.stats.levelUpThreshold*0.9) {
        return <Popover content={levelUpMsg}><div className="levelUpDone">level up!</div></Popover>;
      }

      return <Popover content={levelUpSoon}>
        <div className="levelUpTime">{this.secondsToHms(diff)}
        </div>
        </Popover>
    } else {
      // Already claimed at least once
      let now = Math.floor(Date.now() / 1000);
      const d = new Date(stakeTimestamp * 1000);
      let stakeDate = d.getTime() / 1000;
      const numberOfDays = (now - stakeDate) / this.state.stats.levelUpThreshold;
      if (isNaN(numberOfDays)) {
        return 0;
      }
      let diff = now - stakeDate;
      if ((diff > this.state.stats.levelUpThreshold) && (numberOfDays > 1)) {
        diff = this.state.stats.levelUpThreshold - (diff-(Math.floor(numberOfDays) * this.state.stats.levelUpThreshold));
      }
      if (diff < this.state.stats.levelUpThreshold) {
        diff = this.state.stats.levelUpThreshold - diff;
      }

      if (diff > this.state.stats.levelUpThreshold*0.9) {
        return <Popover content={levelUpMsg}><div className="levelUpDone">level up!</div></Popover>;
      }

      return <Popover content={levelUpSoon}>
        <div className="levelUpTime">{this.secondsToHms(diff)}
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
        return parseFloat(net).toFixed(2);
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

  selectNFT(self, item, staked , type, origin) {
    if (origin === 'modal') {
      return;
    }
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
      this.setState({ selectedNfts: {}, currentStatsNFT: 0 });
      const result = await this.props.tx(
        this.props.writeContracts.McStake.claimMany(selectedToUnStakeNfts, false, {
          from: this.props.address,
          gasLimit: parseInt(selectedToUnStakeNfts.length * 300000),
        }),
      );
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
      console.log(message);
      renderNotification("error", "Error", message);
    }
  }

  async stake(type, selectedToStakeNfts, data) {
    let contract;
    if (data.key === 'fastfood') {
      contract = 'McStake';
    } else if (data.key === 'gym') {
      contract = 'Gym';
    } else {
      return;
    }


    const stakeTarget = data.key;

    try {
      const result = await this.props.tx(
        this.props.writeContracts[contract].stakeMany(this.props.address, selectedToStakeNfts, {
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
      this.setState({ selectedNfts: {} });
      const result = await this.props.tx(
        this.props.writeContracts.McStake.claimMany(selectedToUnStakeNfts, {
          from: this.props.address,
          gasLimit: selectedToUnStakeNfts.length * 250000,
        }),
      );
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

    const menuStakeAll = (
      <Menu onClick={this.stakeAll.bind(this, type)}>
        <Menu.Item key="fastfood">to McStake</Menu.Item>
        <Menu.Item key="casualfood" disabled={true}>to TheStakeHouse</Menu.Item>
        <Menu.Item key="gourmetfood" disabled={true}>to LeStake</Menu.Item>
        <Menu.Item key="gym">to MuscleBox</Menu.Item>
      </Menu>
    );
    const menuStake = (
      <Menu onClick={this.stake.bind(this, type, selectedToStakeNfts)}>
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
          <Dropdown className="web3Button" type={"default"} overlay={menuStakeAll}>
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
          overlay={menuStake}
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
            <span className="logoText">
              RATalert
            </span>
            <div className="logoLine"/>
            <div className="officeFullDescription">
            The NFT game that lets you train your characters
  on-chain for higher rewards!<br/><br/>
  Learn more about the rules in the <Link to="/whitepaper/">Whitepaper</Link>.
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
          <span className="logoText">
            RATalert
          </span>
          <div className="logoLine"/>
          <div className="officeDescription">
          The NFT game that lets you train your characters
on-chain for higher rewards!<br/><br/>
Learn more about the rules in the <Link to="/whitepaper/">Whitepaper</Link>.
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
    const { networkName, chainId } = this.getNetworkName();
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
    const kitchenWidth = this.getWidth('kitchen');

    return (

      <div className="stakeHouse" style={this.getWidth('townhouse')}>
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
                      this.renderBalances()
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

              <div style={{marginTop: 0}} className={`parallax ${config[networkName].gourmetKitchenClosed ? `gourmetSceneClosed${this.getDayTime()}`: 'gourmetScene' }`}>
              </div>

              <div className="restaurantSign">
                <img width={window.innerWidth < 1080 ? 75 : 150} src={`${config[networkName].gourmetKitchenClosed ? 'img/le-stake-closed.png': 'img/le-stake.png'}`}/>
              </div>
            </Col>
            <Col>
              <div className={`fade parallax ${config[networkName].gourmetKitchenClosed ? 'gourmetKitchenClosed': 'gourmetKitchen' }`} style={this.getWidth()}>
                { config[networkName].gourmetClosedSign ? <div style={{left: (kitchenWidth.width / 2)*0.9}}className="closedSign"/> : null }
                { config[networkName].gourmetForSaleSign ? <div style={{left: (kitchenWidth.width / 2)*0.9}}className="forSaleSign"/> : null }
              </div>
            </Col>
          </Row>
        </Card>
        <div className="floor"/>
        <Card className="house kitchenMargin" size="small" style={this.getWidth('building')}>
          <Row>
            <Col style={{width: '180px'}}>

            <div className={`parallax ${config[networkName].casualKitchenClosed ? `casualSceneClosed${this.getDayTime()}`: 'casualScene' }`}>
            </div>

            <div className="restaurantSign">
              <img width={window.innerWidth < 1080 ? 50 : 150} src={`${config[networkName].casualKitchenClosed ? 'img/stake-house-closed.png': 'img/stake-house.png'}`}/>
            </div>

            </Col>
            <Col>

            <div className={`parallax fade ${config[networkName].casualKitchenClosed ? 'casualKitchenClosed': 'casualKitchen' }`} style={this.getWidth()}>
              { config[networkName].casualClosedSign ? <div style={{left: (kitchenWidth.width / 2)*0.9}}className="closedSign"/> : null }
              { config[networkName].casualForSaleSign ? <div style={{left: (kitchenWidth.width / 2)*0.9}}className="forSaleSign"/> : null }
            </div>

            </Col>
          </Row>
        </Card>
        <div className="floor"/>
        <Card className="house kitchenMargin" size="small" style={this.getWidth('building')}>
          <Row>
            <Col style={{width: '180px'}}>
            <div className={`parallax ${config[networkName].fastFoodKitchenClosed ? `fastFoodSceneClosed${this.getDayTime()}`: 'fastFoodScene' }`}>
              <div style={{paddingTop: 210}}>
                { !config[networkName].fastFoodKitchenClosed ? this.renderUnStakeButton() : null}
              </div>
              <div style={{paddingTop: 10}}>
                { !config[networkName].fastFoodKitchenClosed ? this.renderClaimButton() : null }
              </div>
            </div>
            <div className="restaurantSign">
              <img width={window.innerWidth < 1080 ? 50 : 150} src={`${config[networkName].fastFoodKitchenClosed ? 'img/mc-stake-closed.png': 'img/mc-stake.png'}`}/>
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
                <span className="logoText">
                  GYM
                </span>
                <div className="subtitle">
                  muscle box
                </div>

                <div className="logoLine"/>
                <div className="gymDescription">
                <div style={{paddingTop: 20}}>
                  <div className="hintHeader">Hint</div>
                  <div className="hintContent">
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
              <span className="logoText">
                CHEFs
              </span>
              <div className="subtitle">
                break room
              </div>
              <div className="logoLine"/>

              { this.renderStakeButtons('Chef') }
              <div>
                <div className="hintHeader">Hint</div>
                <div className="hintContent">
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

        <div className="skyline" style={{width: '100%'}}>
        </div>
        <div className="street" style={{width:'100%'}}>
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
              <span className="logoText">
                RATs
              </span>
              <div className="subtitle">
                sewer
              </div>
              <div className="logoLine"/>
              { this.renderStakeButtons('Rat') }

              <div>
                <div>
                  <div className="hintHeader">Hint</div>
                  <div className="hintContent">
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
    const c = this.nfts[parseInt(key.tokenId)];
    delete c.image;
    c.image = key.image;

    if (key.insanity) {
      c.insanityLevel = key.insanity;
    }
    if (key.skill) {
      c.skillLevel = key.skill;
    }
    if (key.fatness) {
      c.fatnessLevel = key.fatness;
    }
    if (key.intelligence) {
      c.intelligenceLevel = key.intelligence;
    }

    const hash = {};
    if (c && c.attributes) {
      let i = 0;
      c.attributes.map((m) => {
        hash[m.trait_type] = m.value;
        if (key.skillLevel && m.trait_type === 'Skill') {
          hash['Skill'] = key.skillLevel;
          c.attributes[i].value = key.skillLevel;
        }
        if (key.insanityLevel && m.trait_type === 'Insanity') {
          hash['Insanity'] = key.insanityLevel;
          c.attributes[i].value = key.insanityLevel;
        }
        if (key.intelligenceLevel && m.trait_type === 'Intelligence') {
          hash['Intelligence'] = key.intelligenceLevel;
          c.attributes[i].value = key.intelligenceLevel;
        }
        if (key.fatnessLevel && m.trait_type === 'Fatness') {
          hash['Fatness'] = key.fatnessLevel;
          c.attributes[i].value = key.fatnessLevel;
        }
        i += 1;
      });
    }



    let events = [];
    let highlightEfficiency = false;
    let highlightTolerance = false;

    if (key.event) {
      if (c.type === 'Rat' && key.event === 'ratTrap') {
        events.push({ event: 'rat_trap',
         image: 'rat_trap.gif',
         nft: `${c.type} #${c.name}`,
         title: 'Rat Trap!',
         description: 'Your rat was caught in a rat trap! Eating and stealing healthier food lowers the chance of getting caught in the rat trap.',
         efficiencyLost: `-${key.oldIntelligence - key.intelligence}`,
         toleranceLost: `-${key.oldFatness - key.fatness}`,
         effiencyName: 'Intelligence',
         toleranceName: 'Bodymass',
         effiency: key.intelligence,
         tolerance: key.fatness,
         efficiencyLevel: hash['Intelligence'],
         toleranceLevel: hash['Fatness'],
         amount: key.earned,
         currency: 'FFOOD',
         earnedTitle: 'Tokens earned',
       });
       highlightEfficiency = true;
       highlightTolerance = true;
      }

      if (c.type === 'Rat' && key.event === 'cat') {
        events.push({ event: 'cat',
         image: 'cat.gif',
         nft: `${c.type} #${c.name}`,
         title: 'Kidnapped by the cat!',
         description: 'Your rat was kidnapped by a cat because your rat got too fat and slow. Send your rats to the gym to lower the chance of getting caught by the cat in the future.',
         efficiencyLost: `-${key.oldIntelligence - key.intelligence}`,
         toleranceLost: `-${key.oldFatness - key.fatness}`,
         effiencyName: 'Intelligence',
         toleranceName: 'Bodymass',
         effiency: key.intelligence,
         tolerance: key.fatness,
         efficiencyLevel: hash['Intelligence'],
         toleranceLevel: hash['Insanity'],
         amount: key.earned,
         currency: 'FFOOD',
         earnedTitle: 'Tokens earned',

       });
       highlightEfficiency = true;
       highlightTolerance = true;
      }

      if (c.type === 'Chef' && key.event === 'foodInspector') {
        events.push({ event: 'food_inspector',
         image: 'food_inspector.gif',
         nft: `${c.type} #${c.name}`,
         title: 'Food Inspector!',
         description: 'Your chef was visited by the food inspector because he is collaborating with the rats. More skilled chefs know how to avoid the food inspector more often.',
         efficiencyLost: `-${key.oldSkill - key.skill}`,
         toleranceLost: `-${key.oldInsanity - key.insanity}`,
         effiencyName: 'Skill',
         toleranceName: 'Freak ',
         effiency: key.skill,
         tolerance: key.insanity,
         efficiencyLevel: hash['Skill'],
         toleranceLevel: hash['Fatness'],
         amount: key.earned,
         currency: 'FFOOD',
         earnedTitle: 'Tokens earned',

       });
       highlightEfficiency = true;
       highlightTolerance = true;
      }

      if (c.type === 'Chef' && key.event === 'burnout') {
        events.push({ event: 'burnout',
         image: 'burnout.gif',
         nft: `${c.type} #${c.name}`,
         title: 'Burnout!',
         description: 'Your chef has suffered a burnout because you had him work too much in the kitchen. Instead of working too hard in the kitchen try sending your Chef to the gym so he can stay mentally sane.',
         efficiencyLost: `-${key.oldSkill - key.skill}`,
         toleranceLost: `-${key.oldInsanity - key.insanity}`,
         effiencyName: 'Skill',
         toleranceName: 'Freak ',
         effiency: key.skill,
         tolerance: key.insanity,
         efficiencyLevel: hash['Skill'],
         toleranceLevel: hash['Fatness'],
         amount: key.earned,
         currency: 'FFOOD',
         earnedTitle: 'Tokens earned',
       });
       highlightEfficiency = true;
       highlightTolerance = true;
      }
    } else {
      if (key.earned > 0) {
        events.push({ nft: `${c.type} #${c.name}`, event: 'earned', amount: key.earned, title: 'Tokens earned', currency: 'FFOOD'});
      }

      if (c.type === 'Chef' && (key.oldSkillName !== hash['Skill']) && (key.skill > key.oldSkill)) {
        events.push({ event: 'new_skill_level', type: 'skill', nft: `${c.type} #${c.name}`, name: 'Skill', value: key.skill, title: 'New Skill Level', gained: `${key.skill - key.oldSkill}%`, level: key.skillLevel});
        highlightEfficiency = true;
      }

      if (c.type === 'Chef' && (key.oldSkillName === hash['Skill']) && (key.skill > key.oldSkill)) {
        events.push({ event: 'skill_earned', type: 'skill', nft: `${c.type} #${c.name}`, name: 'Skill', value: key.skill, title: 'Skill earned', gained: `${key.skill - key.oldSkill}%`, level: key.skillLevel});
      }

      if (c.type === 'Chef' && (key.oldInsanityName === hash['Insanity']) && (key.insanity > key.oldInsanity)) {
        events.push({ event: 'insanity_increased', type: 'insanity', nft: `${c.type} #${c.name}`, name: 'Insanity', value: key.insanity, title: 'Insanity increased', gained: `${key.insanity - key.oldInsanity}%`, level: key.skillLevel});
        highlightTolerance = true;
      }

      if (c.type === 'Chef' && (key.oldInsanityName !== hash['Insanity']) && (key.insanity > key.oldInsanity)) {
        events.push({ event: 'new_insanity_level', type: 'insanity', nft: `${c.type} #${c.name}`, name: 'Insanity', value: key.insanity, title: 'New insanity level', gained: `${key.insanity - key.oldInsanity}%`, level: key.insanityLevel});
        highlightTolerance = true;
      }

      if (c.type === 'Rat' && (key.oldIntelligenceName !== hash['Intelligence']) && (key.intelligence > key.oldIntelligence)) {
        events.push({ event: 'new_intelligence_level', type: 'intelligence', nft: `${c.type} #${c.name}`, name: 'Intelligence', value: key.intelligence, title: 'New Intelligence Level', gained: `${key.intelligence - key.oldIntelligence}%`, level: hash['Intelligence']});
        highlightEfficiency = true;
      }

      if (c.type === 'Rat' && (key.oldIntelligenceName === hash['Intelligence']) && (key.intelligence > key.oldIntelligence)) {
        events.push({ event: 'intelligence_earned', type: 'intelligence', nft: `${c.type} #${c.name}`, name: 'Intelligence', value: key.intelligence, title: 'Intelligence earned', gained: `${key.intelligence - key.oldIntelligence}%`, level: hash['Intelligence']});
      }

      if (c.type === 'Rat' && (key.oldFatnessName === hash['Fatness']) && (key.fatness > key.oldFatness)) {
        events.push({ event: 'bodymass_gained', type: 'bodymass', nft: `${c.type} #${c.name}`, name: 'Bodymass', value: key.fatness, title: 'Bodymass gained', gained: `${key.fatness - key.oldFatness}%`, level: hash['Fatness']});
      }

      if (c.type === 'Rat' && (key.oldFatnessName !== hash['Fatness']) && (key.fatness > key.oldFatness)) {
        events.push({ event: 'new_fatness_level', type: 'bodymass', nft: `${c.type} #${c.name}`, name: 'Body mass', value: key.fatness, title: 'New bodymass level', gained: `${key.fatness - key.oldFatness}%`, level: hash['Fatness']});
        highlightTolerance = true;
      }
    }


    return (
      <div>
        <Row>
          <Col span={12}>
            <div class="selectDisabled">
            { this.renderNFTColumn(c, 0, 'modal') }
            <div style={{marginLeft: 140, marginTop: -294}}>{ this.renderNFTDetails(c, 0, 'modal', highlightEfficiency, highlightTolerance) }</div>
            </div>
          </Col>
          <Col span={12} className="eventBox selectDisabled">
          { events.map( (e) =>
                this.renderEvent(e,c,hash)
          )}

          </Col>
        </Row>


    </div>
    )
  }

  renderEvent (e, c, hash) {
    if (e.event === 'earned') {
      return this.renderEarned(e, c, hash);
    }
    if (e.event === 'rat_trap' || e.event === 'cat' || e.event === 'food_inspector' || e.event === 'burnout') {
      return this.renderNFTEvent(e, c, hash);
    }

    if (e.event === 'new_skill_level' || e.event === 'new_intelligence_level') {
      return this.renderNewEfficiencyLevel(e, c, hash);
    }

    if (e.event === 'new_insanity_level' || e.event === 'new_fatness_level') {
      return this.renderNewToleranceLevel(e, c, hash);
    }

    if (e.event === 'skill_earned' || e.event === 'intelligence_earned') {
      return this.renderEfficiencyEarned(e, c, hash);
    }
    if (e.event === 'insanity_increased' || e.event === 'bodymass_gained') {
      return this.renderToleranceGained(e, c, hash);
    }



  }

  renderNFTEvent(e, c, hash) {
    return (
      <div>
      <div className="nftEventEarned">
        { this.renderEarned(e, c, hash, e.earnedTitle) }
      </div>
      <Row>
        <Col span={24}>
        <Row>
          <Col className="eventTitle" span={24}>
            {e.title}
          </Col>
        </Row>
        <Row>
          <Col className="whiteContent" span={24}>
            <img src={`/img/${e.image}`}/>
          </Col>
        </Row>
        <Row>
          <Col className="whiteContent" span={24}>
            {e.description}
          </Col>
        </Row>
        <Row>
          <Col className="eventContent" span={12}>
            {e.efficiencyLost}% {e.effiencyName}
          </Col>
          <Col className="eventContent" span={12}>
            {e.toleranceLost}% {e.toleranceName}
          </Col>
        </Row>
        <Row>
          <Col className="whiteContent" span={12}>
            {e.effiencyName} level {e.effiency}%
          </Col>
          <Col className="whiteContent" span={12}>
            {e.toleranceName} level {e.tolerance}%
          </Col>
        </Row>

        <Row align="middle" style={{paddingTop: 20}}>
          <Col  span={4}>
          <div className={c.type === 'Chef' ? 'downArrow chefEfficiency' : 'downArrow ratEfficiency'}/>
          </Col>
          <Col span={18}>
          { this.renderEfficiencyTitle(c, hash, true) }
          </Col>
        </Row>

        <Row align="middle" style={{paddingTop: 20}}>
          <Col  span={4}>
          <div className={c.type === 'Chef' ? 'downArrow chefInsanity' : 'downArrow ratFatness'}/>
          </Col>
          <Col span={18}>
          { this.renderToleranceTitle(c, hash, true) }
          </Col>
        </Row>

        </Col>
      </Row>
      </div>
    );
  }

  renderEarned(e, c, hash, title = false) {
    return (
      <div>
      <Row>
        <Col className="eventHeader" span={24}>{!title ? e.title : e.earnedTitle}</Col>
      </Row>
      <Row>
        <Col className="whiteContent" span={24}>
            {e.nft} has earned <u>{e.amount.toFixed(2)}</u> ${e.currency}
        </Col>
      </Row>
      </div>
    );
  }

  renderToleranceGained(e, c, hash) {
    return (
      <div>
      <Row>
        <Col className="eventHeader" span={24}>{e.title}</Col>
      </Row>
      <Row>
        <Col className={e.type === 'insanity' ? 'chefToleranceContent' : 'ratToleranceContent'} span={24}>
            {e.gained} {e.name} { e.type === 'insanity' ? 'obtained' : 'gained'}
        </Col>
      </Row>
      <Row>
        <Col className="whiteContent" span={24}>
            {e.name} level is now {e.value}%
        </Col>
      </Row>
      </div>
    );
  }

  renderEfficiencyEarned(e, c, hash) {
    return (
      <div>
      <Row>
        <Col className="eventHeader" span={24}>{e.title}</Col>
      </Row>
      <Row>
        <Col className={e.type === 'skill' ? 'chefEfficiencyContent' : 'ratEfficiencyContent'} span={24}>
            {e.gained} {e.name} gained
        </Col>
      </Row>
      <Row>
        <Col className="whiteContent" span={24}>
            {e.name} level is now {e.value}%
        </Col>
      </Row>
      </div>
    );
  }

  renderNewToleranceLevel(e, c, hash) {
    return (
      <div>
      <Row>
        <Col className="eventHeader" span={24}>{e.title}</Col>
      </Row>
      <Row>
        <Col className={e.type === 'insanity' ? 'chefToleranceContent' : 'ratToleranceContent'} span={24}>
            {e.gained} {e.name} { e.type === 'insanity' ? 'obtained' : 'gained'}
        </Col>
      </Row>
      <Row>
        <Col className="whiteContent" span={24}>
            {e.name} level is now {e.value}%
        </Col>
      </Row>
      <Row>
        <Col className="whiteContent" span={24}>
            {e.nft} has reached a new level:
        </Col>
      </Row>
      <Row>
        <Col className="whiteContent" span={12}>
            <Row align="middle">
              <Col  span={4}>
              <div className={c.type === 'Chef' ? 'upArrow chefInsanity' : 'upArrow ratFatness'}/>
              </Col>
              <Col span={18}>
              { this.renderToleranceTitle(c, hash, true) }
              </Col>
            </Row>
        </Col>
      </Row>
      </div>
    );
  }

  renderNewEfficiencyLevel(e, c, hash) {
    return (
      <div>
      <Row>
        <Col className="eventHeader" span={24}>{e.title}</Col>
      </Row>
      <Row>
        <Col className={e.type === 'skill' ? 'chefEfficiencyContent' : 'ratEfficiencyContent'} span={24}>
            {e.gained} {e.name} gained
        </Col>
      </Row>
      <Row>
        <Col className="whiteContent" span={24}>
            {e.name} level is now {e.value}%
        </Col>
      </Row>
      <Row>
        <Col className="whiteContent" span={24}>
            {e.nft} has reached a new level:
        </Col>
      </Row>
      <Row>
        <Col className="whiteContent" span={12}>
            <Row align="middle">
              <Col  span={4}>
              <div className={c.type === 'Chef' ? 'upArrow chefEfficiency' : 'upArrow ratEfficiency'}/>
              </Col>
              <Col span={18}>
              { this.renderEfficiencyTitle(c, hash, true) }
              </Col>
            </Row>
        </Col>
      </Row>
      </div>
    );
  }

  renderCarets() {
    return (
      <Row className="carets selectDisabled" style={{marginBottom: '20'}}>
         <Col xs={11} md={12}/>
          <Col style={{width: '30px', paddingTop: '10px'}}>
              <CaretLeftOutlined onClick={this.onChangeCurrentNFT.bind(this, this.state.currentStatsNFT - 1)} style={{cursor: 'pointer', fontSize: '20px'}}/>
          </Col>
          <Col style={{width: '45px', paddingTop: '10px'}}>
              <span style={{textDecoration: 'underline'}}>{ this.state.currentStatsNFT + 1 }</span>
              <span>/ { this.state.claimStats.length }</span>
          </Col>
          <Col span={3} style={{width: '20px', paddingTop: '10px'}}>
            <CaretRightOutlined onClick={this.onChangeCurrentNFT.bind(this, this.state.currentStatsNFT + 1)} style={{cursor: 'pointer', marginLeft: '8px', fontSize: '20px'}}/>
          </Col>
      </Row>
    )
  }

  renderClaimModal() {
    return (
      <div>
        <div className="eventCarets">{ this.state.claimStats.length > 1 ? this.renderCarets() : null }</div>
        <div>
          { this.state.claimStats[this.state.currentStatsNFT] ? this.renderClaimStats(this.state.currentStatsNFT) : null }
        </div>
       {
         /* JSON.stringify(this.state.claimStats)
       */
      }
      </div>
    )
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

  getDayTime() {
    if (this.state.dayTime === 'night') {
      return 'Night';
    }
    if (this.state.dayTime === 'day') {
      return 'Day';
    }
    if (this.state.dayTime === 'morning') {
      return 'Day';
    }
    if (this.state.dayTime === 'evening') {
      return 'Night';
    }
  }

  renderGame() {
    const skyAttr = this.getWidth('sky', true, 1440, 1000);
    return (
          <Row style={{ height: "100%" }}>
            <div className={this.getGradientClass()} style={{top: skyAttr.height, height: this.townhouseHeight - 150}}>
            </div>
            <div ref={this.townhouseRef} className="townhouseBox" style={this.getTownhouseMargin()}>
              { this.renderRoof() }
              { this.renderNfts() }
            </div>

            <Modal bodyStyle={{height: 480}} title={`This is what happened... ${this.state.claimStats.length} ${this.state.claimStats.length === 1 ? 'Event' : 'Events'}`}
            onCancel={() => this.setState({isClaimModalVisible: false, claimStats: []})}
            onOk={() => this.setState({isClaimModalVisible: false, claimStats: []})}
            footer={[
              <Button className="web3Button" key="submit" type="default"
              onClick={() => this.setState({isClaimModalVisible: false, claimStats: []})}>
                Close
              </Button>
            ]}
            visible={this.state.isClaimModalVisible}>
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
        return this.renderGame();
    }
  }
}

export default Main;
