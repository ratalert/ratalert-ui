import React from "react";
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
} from "antd";
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
} from '@ant-design/icons';


class Main extends React.Component {
  constructor(props) {
    super(props);
    this.townhouseHeight = 0;
    this.state = {
      windowHeight: window.innerHeight - 235,
      nonStakedGraph: { chefRats: [] },
      stakedGraph: { chefRats: [] },
      selectedNfts: {},
      stakedNfts: [],
      unstakedNfts: [],
      allStakedChefs: [],
      totalRats: 0,
      totalCooks: 0,
      totalRatsStaked: 0,
      totalCooksStaked: 0,
      mintAmount: 1,
      loading: true,
      isApprovedForAll: false,
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

  async fetchGraph() {
    let address = "";
    if (this.props.address === "undefined" || !this.props.address || this.props.address.length < 5) {
      setTimeout(async () => {
        this.fetchGraph();
      }, 250);
      return;
    }

    const query1 = `{ chefRats(where: {
          owner: "${this.props.address || "0x2f7CdD90AB83405654eE10FC916a582a3cDe7E6F"}"
        }) {
          id, staked, owner,stakedTimestamp, lastClaimTimestamp, URI, type,
          insanity,  skill,
          intelligence, fatness,
        }
      }`;

    const query2 = `{ chefRats(where: {
          stakingOwner: "${this.props.address || "0x2f7CdD90AB83405654eE10FC916a582a3cDe7E6F"}"
        }) {
          id, staked, owner,stakedTimestamp, lastClaimTimestamp, URI,
          type,
          insanity, skill,
          intelligence,
          fatness,
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

    const allStakedChefs = [];

    result1.chefRats.map(r => {
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
          if (parseInt(r.staked) === 1) {
            stakedNfts.push(parseInt(r.id, 16));
          }
        }
      }
    });

    result2.chefRats.map(r => {
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

    result2.chefRats.map(r => {
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
      totalRats,
      totalChefs,
      totalRatsStaked,
      totalChefsStaked,
      allStakedChefs,
    });

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

  renderStaked() {
    return this.renderNFT(null, 1);
  }

  async mint() {
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
        this.props.writeContracts.ChefRat.mint(amount, false, {
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
    const contract = new ethers.Contract(config[networkName].ChefRat,
      contracts[chainId][networkName].contracts.ChefRat.abi, this.props.provider);

    let isApprovedForAll = await contract.isApprovedForAll(this.props.address, this.props.readContracts.KitchenPack.address);
    this.setState({isApprovedForAll });
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
    const chefRatContract = new ethers.Contract(config[networkName].ChefRat,
      contracts[chainId][networkName].contracts.ChefRat.abi, this.props.provider);
    const kitchenPackContract = new ethers.Contract(config[networkName].KitchenPack,
        contracts[chainId][networkName].contracts.KitchenPack.abi, this.props.provider);

    const minted = await chefRatContract.minted();
    let totalSupply = await chefRatContract.MAX_TOKENS();
    let paidTokens = await chefRatContract.PAID_TOKENS();
    let mintPrice = await chefRatContract.mintPrice();
    if (!mintPrice) {
      mintPrice = 0;
    }
    const rats = await chefRatContract.numRats();
    const chefs = await chefRatContract.numChefs();

    let dailyFFoodRate = await kitchenPackContract.DAILY_FFOOD_RATE();
    if (!dailyFFoodRate) {
      dailyFFoodRate = 0;
    }

    let minimumToExit = await kitchenPackContract.MINIMUM_TO_EXIT();
    if (!minimumToExit) {
      minimumToExit = 0;
    }

    let ratTax = await kitchenPackContract.FFOOD_CLAIM_TAX_PERCENTAGE();
    if (!ratTax) {
      ratTax = 0;
    }

    let maxSupply = await kitchenPackContract.FFOOD_MAX_SUPPLY();
    if (!maxSupply) {
      maxSupply = 0;
    }

    let ratsStaked = await kitchenPackContract.totalRatsStaked();
    if (!ratsStaked) {
      ratsStaked = 0;
    }

    let chefsStaked = await kitchenPackContract.totalChefsStaked();
    if (!chefsStaked) {
      chefsStaked = 0;
    }

    let tokensClaimed = await kitchenPackContract.totalFastFoodEarned();
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
      levelUpThreshold: 86400,
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
            <Button className="mintButton" onClick={this.mint.bind(this)}>
              Mint
            </Button>
          </Col>
          <Col span={6} style={{paddingTop: 5}}>
            <Button className="mintButton" onClick={this.mint.bind(this)}>
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
            <b>Price per NFT: { mintPrice } { this.state.currency }</b>
          </Col>
        </Row>
        <Row  className="officeContent">
          <Col className="officeLine" xs={11} md={12}/>
          <Col className="officeLine" xs={11} md={12} style={{ textAlign: "left" }}>
            <b>Total: { Decimal(mintPrice).times(this.state.mintAmount).toString() } { this.state.currency }</b>
          </Col>
        </Row>
      </div>
    );
  }

  renderNFTInfo(attributes, img) {
    const hash = {};
    attributes.map((m) => {
      hash[m.trait_type] = m.value;
    });

    return (
      <div style={{ width: "300px" }}>
        <Row>
          <Col span={24}>
            <img width={200} src={img} />
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
          <Col span={12}>{attributes[0].value === "Chef" ? "Insanity level" : "Bodymass level"}</Col>
          <Col span={12}>
            <Progress
              strokeColor={attributes[0].value === "Chef" ? "blue" : "brown"}
              percent={ attributes[0].value === "Chef" ? hash['Insanity percentage'] : hash['Fatness percentage'] }
              status="active" />
          </Col>
        </Row>
        <Row>
          <Col span={12}>{attributes[0].value === "Chef" ? "Insanity status" : "Bodymass status"}</Col>
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



  renderNFT(type, staked = 0) {
    const nft = [];
    let element;
    if (staked === 0) {
      element = this.state.nonStakedGraph;
    }
    if (staked === 1) {
      element = this.state.stakedGraph;
    }

    element.chefRats.map(r => {
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
            nft.push({
              name: parseInt(r.id, 16),
              description: json.name,
              timestamp: parseInt(r.stakedTimestamp),
              lastClaimTimestamp: parseInt(r.lastClaimTimestamp),
              image: json.image,
              type,
              attributes: json.attributes,
              insanity: hash['Insanity'],
              insanityLevel: hash['Insanity percentage'],
              skill: hash['Skill'],
              skillLevel: hash['Skill percentage'],
              intelligence: hash['Intelligence'],
              intelligenceLevel: hash['Intelligence percentage'],
              fatness: hash['Fatness'],
              fatnessLevel: hash['Fatness percentage'],
            });
          }
          if (type === null && json.name && r.staked == staked) {
            nft.push({
              name: parseInt(r.id, 16),
              image: json.image,
              description: json.name,
              timestamp: parseInt(r.stakedTimestamp),
              lastClaimTimestamp: parseInt(r.lastClaimTimestamp),
              type: json.attributes[0].value,
              attributes: json.attributes,
              insanity: hash['Insanity'],
              insanityLevel: hash['Insanity percentage'],
              skill: hash['Skill'],
              skillLevel: hash['Skill percentage'],
              intelligence: hash['Intelligence'],
              intelligenceLevel: hash['Intelligence percentage'],
              fatness: hash['Fatness'],
              fatnessLevel: hash['Fatness percentage'],
            });
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
      nftWidth = 190;
    } else {
      offset = 50;
      nftWidth = 190;
    }

    if (window.innerWidth <= 768) {
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
          rows.push(this.renderNFTRow(i, nftsPerRow, rowNFTs, staked, type));
          rows.push(emptyRow);
        }
    }

    if (rows.length === 0) {
      if (type !== 'chef') {
        this.townhouseHeight += 315; // Kitchen
      }
      rows.push(this.renderNFTRow(0, 0, [], staked, type));
      //rows.push(emptyRow);
    }


    return (
      <div>
         { rows }
      </div>
    );
  }

  renderNFTRow(i, nftsPerRow, nft, staked, type) {
    let className;
    let widthType;
    if (staked === 1) {
      className = "fastFoodKitchen";
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
            return this.renderNFTColumn(c, staked);
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

  renderNFTColumn(c, staked) {
    if (!c || !c.name) {
      return <div>&nbsp;</div>
    }
    return (
      <span>
        <div className="nftId"><span style={{color: '#000000'}}>#</span>
        <span style={{color: '#d1c0b6'}}>{c.name}</span>
        </div>
        <div
          onClick={() => this.selectNFT(this, c.name, staked)}
          className={
            this.state.selectedNfts &&
            this.state.selectedNfts[c.name] &&
            this.state.selectedNfts[c.name]["status"] === true
              ? "nftSelected nft"
              : "nftNotSelected nft"
          }
        >
          <Popover mouseEnterDelay={1} content={this.renderNFTInfo(c.attributes, c.image)} title={c.description}>
            <img className={c.type === 'Chef' ? "nftImage nftChef" : "nftImage nftRat"} src={c.image}/>
          </Popover>

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
        {c.timestamp > 0 ? (
          <div>
          <Row>
            <Col style={{marginRight: '5px', marginLeft: '5px'}} xs={3} span={2}>
              <Popover content="Your NFT earns fastfood (FFOOD) tokens when staked into a kitchen.">
              <img src="/img/ffood.png"/>
              </Popover>
            </Col>
            <Col span={7} className="funds" style={{color: '#fee017'}}>
              <Popover content="Amount of $FFOOD your NFTs have accumulated.">
                {this.renderNftProfit(c.type, c.timestamp, c.lastClaimTimestamp)}
              </Popover>
            </Col>
          </Row>
          <Row>
            <Col style={{marginRight: '0px'}} xs={5} span={4}>
              <img src={"/img/time.png"}/>
            </Col>
            <Col xs={16} span={18}>
              <div>{ this.renderTimeLeftForLevelUp(c.lastClaimTimestamp, c.timestamp) }</div>
            </Col>
          </Row>
          </div>
        ) : null}
        </div>
      </span>
    )
  }

  renderTimeLeftForLevelUp(lastClaim, stakeTimestamp) {
    const levelUpMsg = "Your next level upgrade is available. Unstake or claim to level up your NFT!";
    const levelUpSoon = "When the countdown ends, your next level upgrade will be available. Unstake or claim to level up your NFT!";
    if (lastClaim === 0) {
      const now = Math.floor(Date.now() / 1000);
      const d = new Date(stakeTimestamp * 1000);
      let stakeDate = d.getTime() / 1000;
      const numberOfDays = (now - stakeDate) / 86400;


      d.setDate(d.getDate() + numberOfDays);
      const futureDate = d.getTime() / 1000;

      let diff = futureDate - now;

      if ((diff < 0) && (diff > -86400)) {
        diff = 86400 - (diff*-1);
      }

      if (numberOfDays > 1) {
        if (parseInt(Math.floor(diff / 3600)) >= 12) {
            // At least 1 day staked and 12 hours to go
            diff = 86400;
        }
      }

      if (diff >= 86400) {
        return <Popover content={levelUpMsg}><div className="levelUpDone">level up!</div></Popover>;
      }
      return <Popover content={levelUpSoon}>
        <div className="levelUpTime">{this.secondsToHms(diff)}
        </div>
        </Popover>
    } else {
      let now = Math.floor(Date.now() / 1000);
      let futureDate;
      now = Math.floor(Date.now() / 1000);
      const d = new Date(stakeTimestamp * 1000);
      let stakeDate = d.getTime() / 1000;
      const numberOfDays = (now - stakeDate) / 86400;

      if (now - lastClaim >= 86400) {
        futureDate = new Date();
        futureDate.setHours(new Date(lastClaim * 1000).getHours());
        futureDate.setMinutes(new Date(lastClaim * 1000).getMinutes());
        futureDate.setSeconds(new Date(lastClaim * 1000).getSeconds());
        futureDate.setDate(new Date().getDate() + 1);
        futureDate = futureDate.getTime() / 1000;
      } else {
        const d = new Date(lastClaim * 1000);
        d.setDate(d.getDate() + 1);
        futureDate = d.getTime() / 1000;
      }

      let diff = futureDate - now;
      if (numberOfDays > 1) {
        if (parseInt(Math.floor(diff / 3600)) >= 12) {
            // At least 1 day staked and 16 hours to go
            diff = 86400;
        }
      }

      if (diff >= 86400) {
        return <Popover content={levelUpMsg}><div className="levelUpDone">level up!</div></Popover>;
      }
      return <Popover content={levelUpSoon}>
        <div className="levelUpTime"> {this.secondsToHms(diff)}
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

  renderNftProfit(type, timestamp, lastClaimTimestamp) {
    if (lastClaimTimestamp > timestamp) {
      timestamp = lastClaimTimestamp;
    }
    if (type !== "Rat") {
      const owedPerSecond = 1000 / 86400;
      const timePassed = Math.floor(Date.now() / 1000) - timestamp;
      this.nftProfit += timePassed * owedPerSecond * 0.8;
      return (timePassed * owedPerSecond * 0.8).toFixed(0);
    } else {
      let totalChefProfit = 0;
      this.state.allStakedChefs.map(a => {
        const owedPerSecond = 1000 / 86400;
        const timePassed = Math.floor(Date.now() / 1000) - timestamp;
        totalChefProfit += timePassed * owedPerSecond;
      });
      const totalRatProfit = totalChefProfit * 0.2;
      const totalRatsStaked = this.state.totalRatsStaked;
      let myRatProfit = 0;
      if (totalRatsStaked > 1) {
        myRatProfit = (1 / parseInt(totalRatsStaked, 10)) * totalRatProfit;
      } else {
        myRatProfit = totalRatProfit;
      }
      this.nftProfit += myRatProfit;
      return myRatProfit.toFixed(0);
    }
  }

  selectNFT(self, item, staked) {
    const selectedNfts = this.state.selectedNfts;
    if (this.state.selectedNfts[item]) {
      delete selectedNfts[item];
    } else {
      selectedNfts[item] = { status: true, staked };
    }
    this.setState({ selectedNfts });
  }

  async setApprovalForAll() {
    try {
      const result = await this.props.tx(
        this.props.writeContracts.ChefRat.setApprovalForAll(this.props.readContracts.KitchenPack.address, true, {
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
    if (window.innerWidth <= 768) {
      height=50;
    }
    return height;
  }

  renderApprovalButton() {

    const height = this.getButtonHeight();
    let enabled = true;
    if (this.state.isApprovedForAll) {
      enabled = false;
    }

    if (this.state.unstakedNfts.length === 0) {
      enabled = false;
    }

    return (
      <Button style={{height}}
      className="web3Button"
      disabled={!enabled}
      type={!this.state.isApprovedForAll ? "primary" : "default"}
      onClick={this.setApprovalForAll.bind(this)}
      >
        Authorize
      </Button>
    );
  }

  async stakeAll() {
    try {
      const result = await this.props.tx(
        this.props.writeContracts.KitchenPack.stakeMany(this.props.address, this.state.unstakedNfts, {
          from: this.props.address,
          gasLimit: parseInt(this.state.unstakedNfts.length * 220000),
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
        this.props.writeContracts.KitchenPack.claimMany(this.state.stakedNfts, true, {
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
        this.props.writeContracts.KitchenPack.claimMany(selectedToUnStakeNfts, false, {
          from: this.props.address,
          gasLimit: parseInt(this.state.stakedNfts.length * 260000),
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
    try {
      const result = await this.props.tx(
        this.props.writeContracts.KitchenPack.stakeMany(this.props.address, selectedToStakeNfts, {
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
        this.props.writeContracts.KitchenPack.claimMany(selectedToUnStakeNfts, {
          from: this.props.address,
          gasLimit: selectedToUnStakeNfts.length * 200000,
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

  getStakeStats() {
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
    return ({ selectedToStakeNfts, selectedToUnStakeNfts});
  }

  renderStakeAllButton() {
    const {selectedToStakeNfts, selectedToUnStakeNfts} = this.getStakeStats();
    let enabled=true;
    if ((selectedToUnStakeNfts.length > 0) && (selectedToStakeNfts.length === 0)) {
      enabled=false;
    }
    if (!this.state.isApprovedForAll) {
      enabled=false;
    }

    let type = 'default';
    if ((selectedToUnStakeNfts.length === 0) && (selectedToStakeNfts.length === 0)) {
      type = 'primary';
    }

    const height = this.getButtonHeight();

    return (
      <Button style={{height}} disabled={!enabled} className="web3Button" type={type} onClick={this.stakeAll.bind(this)}>
        Stake all
      </Button>
    );
  }

  renderStakeButton() {
    const {selectedToStakeNfts, selectedToUnStakeNfts} = this.getStakeStats();
    let enabled=true;
    if ((selectedToUnStakeNfts.length > 0)) {
      enabled=false;
    }
    if (!this.state.isApprovedForAll) {
      enabled=false;
    }

    if ((selectedToStakeNfts.length === 0)) {
      enabled=false;
    }

    let type = 'default';
    if ((selectedToStakeNfts.length > 0)) {
      type = 'primary';
    }

    const height = this.getButtonHeight();

    return (
      <Button
        className="web3Button"
        type={type}
        style={{height}}
        disabled={!enabled}
        onClick={this.stake.bind(this, selectedToStakeNfts)}
      >
        Stake {selectedToStakeNfts.length} NFTs
      </Button>
    );
  }

  renderUnStakeButton() {
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

  renderUnStakeAllButton() {
    const {selectedToStakeNfts, selectedToUnStakeNfts} = this.getStakeStats();
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

    let type = 'default';
    if ((selectedToUnStakeNfts.length === 0)) {
      type = 'primary';
    }
    const height = this.getButtonHeight();
    return (
      <Button style={{height}} disabled={!enabled} className="web3Button" type={type} onClick={this.unstakeAll.bind(this)}>
         Unstake all
      </Button>
    );
  }

  renderClaimButton() {
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
    let disabledText = <span>Level up & Claim from {selectedToUnStakeNfts.length} NFTs</span>;
    let activeText = <span>Level up & Claim <img style={{paddingLeft: '1px', paddingRight: '1px', marginTop: '-5px'}}src="/img/ffood.png"/> from {selectedToUnStakeNfts.length} NFTs</span>
    if (window.innerWidth <= 768) {
      disabledText = <span style={{marginLeft: '-5px'}}>Level up & Claim <br/>from {selectedToUnStakeNfts.length} NFTs</span>;
      activeText = <span  style={{marginLeft: '-5px'}}>Level up & Claim <img style={{paddingLeft: '3px', marginTop: '-5px'}} src="/img/ffood.png"/><br/>from {selectedToUnStakeNfts.length} NFTs</span>
    }
    return (
      <Button
        className="web3Button"
        style={{height}}
        type={type}
        disabled={!enabled}
        onClick={this.claimFunds.bind(this, selectedToUnStakeNfts)}
      >
      { selectedToUnStakeNfts.length === 0 ?
        disabledText : activeText
      }

      </Button>
    );
  }

  renderLegend() {
    return (
      <div>
        <Row>
          <Col xl={6} lg={0} md={0} sm={0}>
            {this.state.totalChefs} chefs, {this.state.totalChefsStaked} staked
          </Col>
          <Col xl={6} lg={0} md={0} sm={0}>
            {this.state.totalRats} rats, {this.state.totalRatsStaked} staked
          </Col>
        </Row>
        <Row>
          <Col xl={0} md={24} sm={24}>
            {this.state.totalChefs} total chefs, {this.state.totalChefsStaked} staked
          </Col>
          <Col xl={0} md={24} sm={24}>
            {this.state.totalRats} total rats, {this.state.totalRatsStaked} staked
          </Col>
          <Col xl={12} md={24}>
            Total $FFOOD not claimed: {this.nftProfit.toFixed(2)}
          </Col>
        </Row>
      </div>
      );
  }

  renderButtons() {
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

    if ((window.innerWidth >= 768) && (window.innerWidth <= 1020)) {
      return (
        <div>
          <Row>
            <Col span="12">
              {this.renderApprovalButton()}
            </Col>
            <Col span="12">
              {this.renderStakeAllButton()}
            </Col>
          </Row>
          <Row style={{paddingTop: '15px'}}>
            <Col span="12">
              {this.renderStakeButton(selectedToStakeNfts)}
            </Col>
            <Col span="12">
              {this.renderUnStakeButton(selectedToUnStakeNfts)}
            </Col>
          </Row>
          <Row style={{paddingTop: '15px'}}>
            <Col span="12">
              {this.renderUnStakeAllButton()}
            </Col>
            <Col span="12">
              {this.renderClaimButton()}
            </Col>
          </Row>
        </div>
      );
    }

      return (
        <div>
          <Row>
            <Col span="8">
              {this.renderApprovalButton()}
            </Col>
            <Col span="8">
              {this.renderStakeAllButton()}
            </Col>
            <Col span="8">
              {this.renderStakeButton(selectedToStakeNfts)}
            </Col>
          </Row>
          <Row style={{paddingTop: '15px'}}>
            <Col span="8">
              {this.renderUnStakeButton(selectedToUnStakeNfts)}
            </Col>
            <Col span="8">
              {this.renderUnStakeAllButton()}
            </Col>
            <Col span="8">
              {this.renderClaimButton()}
            </Col>
          </Row>
        </div>
      );
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

  getSkylineStyle() {
    const baseSkylineOffset = 170;
    let offset = baseSkylineOffset;
    const originalWidth = 1440;
    const originalHeight = 266;
    const factor = window.innerWidth / originalWidth;
    if (originalHeight * factor < originalHeight) {
        offset = originalHeight * factor - baseSkylineOffset;
    }
    return (
      { width: window.innerWidth, height: originalHeight * factor, top: this.townhouseHeight - offset}
    )
  }


  getStreetLightPosition() {
    const width = this.getWidth('building');
    const margin = (window.innerWidth - width.width)/2;
    const left = margin + width.width - 135;
    return left;
  }

  getFlowerPot1Position() {
    const width = this.getWidth('building');
    const margin = (window.innerWidth - width.width)/2;
    return margin + 10;
  }



  getTownhouseMargin() {
    const width = this.getWidth('building');
    const margin = (window.innerWidth - width.width)/2;
    return {
      marginLeft: margin > 20 ? parseInt(margin) : 20,
      marginTop: 100
    }
  }

  getWidth(type = 'kitchen', stretch = false, originalWidth = false, originalHeight = false) {
    let width = 0;
    let mobile = false;

    const offsets = {
      mobileWidth: 325,
      normalLargeWidth: 650, // kitchen width
      buildingNormal: 450, // whole width for the kitchen
      buildingSmall: 271,
      normalWidth: 500,
      roofSmall: 222,
      roofNormal: 272,
      rat: 220,
      noKitchen: 200,
      townhouseMobile: 222,
      townhouseNormal: 272, // outer box
    };

    let maxWidth = window.innerWidth;
    if (maxWidth > 1400) {
      maxWidth = 1400;
    }

    if (maxWidth <= 768) {
        width = offsets.mobileWidth;
        mobile = true;
    }
    else {
      if (window.innerWidth - 650 > 400) {
        width = maxWidth - offsets.normalLargeWidth;
      } else {
        width = maxWidth - offsets.normalLargeWidth;
      }
    }



    if (type === 'roof') {
      const tmp = this.getWidth('kitchen');
      if (maxWidth <= 768) {
        width = tmp.width + offsets.roofSmall;
      } else {
        width = tmp.width + offsets.roofNormal;
      }
    }
    else if (type === 'townhouse') {
      const tmp = this.getWidth('kitchen');
      if (maxWidth <= 768) {
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
      width = tmp.width + offsets.buildingNormal;
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

  renderRatAlertOfficeInfo() {
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

  renderNfts() {
    this.nftProfit = 0;
    this.townhouseHeight = 0;
    const roofHeight = this.getWidth('roof', true, 1000, 300);
    this.townhouseHeight += roofHeight.height; // Roof
    this.townhouseHeight += 315; // Office
    this.townhouseHeight += 315; // Gourmet Kitchen
    this.townhouseHeight += 315; // Casual Kitchen
    this.townhouseHeight += 315; // Gym
    return (
      <div className="stakeHouse" size="small" style={this.getWidth('townhouse')}>
        <Card className="roofWall" size="small">
          <div className="roof" style={this.getWidth('roof', true, 1000, 300)}>
          </div>
        </Card>
        <Card className="house office" size="small" style={this.getWidth('building')}>
          <Row >
            { window.innerWidth > 1100 ? this.renderRatAlertOfficeInfo() : null }
            <Col>
              <div className={this.getOfficeBackground()} style={this.getWidth(window.innerWidth > 1100 ? 'kitchen' : null)}>
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
                { window.innerWidth < 1099 ? this.renderMobileOfficeNav() : null }

              </div>
            </Col>
          </Row>
        </Card>
        <Card className="house" size="small" style={this.getWidth('building')}>
          <Row >
            <Col style={{width: '180px'}}>
              <div className="gourmetScene">
              </div>
              <div className="restaurantSign">
                <img width={window.innerWidth < 769 ? 75 : 150} src="img/le-stake.png"/>
              </div>
            </Col>
            <Col>
              <div className="fade gourmetKitchen" style={this.getWidth()}>
              </div>
            </Col>
          </Row>
        </Card>
        <Card className="house" size="small" style={this.getWidth('building')}>
          <Row>
            <Col style={{width: '180px'}}>
            <div className="casualScene">
            </div>
            <div className="restaurantSign">
              <img width={window.innerWidth < 769 ? 75 : 150} src="img/stake-house.png"/>
            </div>

            </Col>
            <Col>
            <div className="fade casualKitchen" style={this.getWidth()}>
            </div>

            </Col>
          </Row>
        </Card>
        <Card className="house" size="small" style={this.getWidth('building')}>
          <Row>
            <Col style={{width: '180px'}}>
            <div className="fastFoodScene">
            </div>
            <div className="restaurantSign">
              <img width={window.innerWidth < 769 ? 75 : 150} src="img/mc-stake.png"/>
            </div>
            </Col>
            <Col style={{marginLeft: '20px'}}>
              {!this.state.loading ? this.renderStaked() : <Skeleton />}
            </Col>
          </Row>
        </Card>

        <Card className="house gym" size="small" style={this.getWidth('building')}>
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
                </div>
              </div>
            </Col>
            <Col>
              <div className="gymBackground" style={this.getWidth()}>
              </div>
            </Col>
          </Row>
        </Card>

        <Card className="house gym" size="small" style={this.getWidth('building')}>
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
              <div className="gymDescription">
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
        <div className="streetlight3" style={{ left: this.getStreetLightPosition()} }>
        </div>
        <div className="streetlight1" style={{left: window.innerWidth * 0.9}}>
        </div>

        <div className="flowerpot1" style={{ left: this.getFlowerPot1Position()} }>
        </div>

        <div className="fence" style={{ left: this.getStreetLightPosition() }}>
        </div>

        <div className="flowerpot2" style={{ left: this.getStreetLightPosition()+100} }>
        </div>

        <div className="skyline">
        </div>
        <div className="street">
        </div>

        <div className="darkBackground">
        </div>

        <Card className="sewerEntrance" size="small" style={{height: 55}}>
          <Row >
            <Col style={{width: '180px'}}>
              <div className="descriptionBox">
              </div>
            </Col>
            <Col style={{marginLeft: '40px'}}>
              <div style={this.getWidth('kitchen')} className="ground"/>
            </Col>
          </Row>
        </Card>
        <Card className="house gym sewer" size="small" style={this.getWidth('sewer')}>
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
              <div className="gymDescription">
              </div>
            </div>
          </Col>
            <Col style={{marginLeft: '20px'}}>
            {!this.state.loading ? this.renderRats() : <Skeleton />}
            </Col>
          </Row>
        </Card>
        <div className="belowTheSewer"/>

        <Card size="small">
        { this.renderLegend() }
        { this.renderButtons() }
        </Card>
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

  renderGame() {
    return (
          <Row style={{ height: "100%" }}>
            <div className="sky" style={this.getWidth('sky', true, 1440, 1000)}>
            </div>
            <div className="nightGradient" style={{height: this.townhouseHeight - 1000 + 250}}>
            </div>

            <Col md={24} xs={24}>
              <Row>
                <Col md={1} xs={1} />
                <Col md={22} xs={22}>
                </Col>
                <Col md={1} xs={1} />
              </Row>
              {
                /*
              <Row>
                <Col md={1} xs={1} />
                <Col md={22} xs={22}>
                  <Card size="small" title="My balances" style={{ marginTop: "25px" }}>
                    <div>$FFOOD2 {this.state.fFoodBalance }</div>
                  </Card>
                  <Card size="small" title="Game Stats" style={{ marginTop: "25px" }}>
                    { this.renderStats() }
                  </Card>
                  <Card size="small" title="Info" style={{ marginTop: "25px" }}>
                    <Row>
                      <Col span="24">
                        {this.state.stats.tokensClaimed + this.state.stats.maxSupply * 0.25 <=
                        this.state.stats.maxSupply ? (
                          <div>
                            <p>
                              Chefs earn a minimum of {this.state.stats.dailyFFoodRate} $FFOOD per day. Your chefs may
                              get more daily $FFOOD depending on their <b>skill</b> level.
                            </p>
                            <p>
                              Rats steal {this.state.stats.ratTax}% of all Chef's $FFOOD. Your rats get a proportional
                              cut depending on their <b>fatness</b> level.
                            </p>
                            The minimum staking period is {this.state.stats.minimumToExit / 3600} hours. Learn more
                            about the rules in the whitepaper.
                          </div>
                        ) : (
                          <div>
                            <p>Max supply has been reached, there are no $FFOOD rewards for Chefs and Rats anymore. </p>
                          </div>
                        )}
                      </Col>
                    </Row>
                  </Card>
                </Col>
                <Col span={2} />
              </Row>
              */
            }
            </Col>
            <Col md={24} xs={24}>
              <Row style={{ marginTop: "25px" }}>
                <Col md={1} xs={1} />
                <Col md={22} xs={22}>
                  <div className="townhouseBox" style={this.getTownhouseMargin()}>
                  {this.props.address ? this.renderNfts() : this.renderNACard()}
                  </div>
                </Col>
              </Row>
            </Col>
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
