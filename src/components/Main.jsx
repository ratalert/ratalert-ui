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
import { request, gql } from "graphql-request";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
const APIURL = `${process.env.REACT_APP_GRAPH_URI}`;
console.log('APIURL:', APIURL);
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
    this.kitchenRef = {};
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
      noAddressLoaded: true,
      dataLoaded: false,
      pairs: {},
      currency: 'ETH',
    };
    this.nftProfit = 0;
  }

  setCurrency(val) {
    if ( (val.target.value === 'ETH') || (val.target.value === 'WOOL') || (val.target.value === 'GP') ) {
      this.setState({currency: val.target.value})
    }
  }

  getMintPrice() {
    let mintPrice = 0;
    if (this.props.stats && this.props.stats.mintPrice) {
      mintPrice = this.props.stats.mintPrice;
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
    const url = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';

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

    const results = await request(url, query);
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
          id, staked, owner,stakedTimestamp, URI, type,
          insanity,  skill,
          intelligence, fatness,
        }
      }`;

    const query2 = `{ chefRats(where: {
          stakingOwner: "${this.props.address || "0x2f7CdD90AB83405654eE10FC916a582a3cDe7E6F"}"
        }) {
          id, staked, owner,stakedTimestamp, URI,
          type,
          insanity, skill,
          intelligence,
          fatness,
        }
      }`;

    const result1 = await request(APIURL, query1);
    const result2 = await request(APIURL, query2);
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
      const sum = amount * 0.1;
      let gasLimit;
      if (amount === 1) {
        gasLimit = 160000;
      } else {
        gasLimit = amount * 140000;
      }

      // {gasPrice: 1000000000, from: this.props.address, gasLimit: 85000}
      const result = await this.props.writeContracts.ChefRat.mint(amount, {
        from: this.props.address,
        value: ethers.utils.parseEther(sum.toString()),
        gasLimit,
      });
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

  renderMintContent() {
    if (!this.state.dataLoaded) {
      return (
        <Card size="small" title="Minting">
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
      <Card size="small" title="Minting">

        <Row></Row>
        <Row>
          <Col span={8}/>
          <Col span={16} style={{ textAlign: "left" }}>
            Select how many NFTs you want to mint:
          </Col>
        </Row>
        <Row>
          <Col span={10} />
          <Col span={12}>
            <Row>
              <Col span={3}>
                <CaretLeftOutlined onClick={this.onChangeAmount.bind(this, this.state.mintAmount - 1)} style={{cursor: 'pointer', fontSize: '32px'}}/>
              </Col>
              <Col span={3}>
              <InputNumber
                min={1}
                max={10}
                style={{ width: '40px' }}
                value={this.state.mintAmount}
                onChange={this.onChangeAmount.bind(this)}
              />
              </Col>
              <Col span={3}>
                <CaretRightOutlined onClick={this.onChangeAmount.bind(this, this.state.mintAmount + 1)} style={{cursor: 'pointer', marginLeft: '8px', fontSize: '32px'}}/>
              </Col>
            </Row>
          </Col>
          <Col span={4}>

          </Col>
        </Row>
        <Row>
          <Col span={8}/>
          <Col span={16} style={{ textAlign: "left" }}>
            Select currency for payment:
          </Col>
        </Row>
        <Row>
          <Col span={0}/>
          <Col span={24} style={{ textAlign: "center" }}>
          <Radio.Group onChange={this.setCurrency.bind(this)} value={this.state.currency} buttonStyle="solid">
            <Radio.Button value="ETH">$ETH</Radio.Button>
            <Radio.Button disabled={this.state.pairs['WOOL/WETH'] > 0 ? false : true} value="WOOL">$WOOL</Radio.Button>
            <Radio.Button disabled={this.state.pairs['GP/WETH'] > 0 ? false : true} value="GP">$GP</Radio.Button>
          </Radio.Group>
          </Col>
          <Col span={8}/>
        </Row>
        <Row>
          <Col span={8}/>
          <Col span={12} style={{ textAlign: "left" }}>
            <b>Price per NFT: { mintPrice } { this.state.currency }</b>
          </Col>
        </Row>
        <Row>
          <Col span={8}/>
          <Col span={12} style={{ textAlign: "left" }}>
            <b>Total: { Decimal(mintPrice).times(this.state.mintAmount).toString() } { this.state.currency }</b>
          </Col>
        </Row>

        <Row  style={{ paddingTop: "25px" }}>
          <Col span={8} />
          <Col span={3} style={{ textAlign: "center" }}>
            Gen {this.props.stats.minted > this.props.stats.paidTokens ? 1 : 0}
          </Col>
          <Col span={8} style={{ textAlign: "center" }}>
            {this.props.stats.minted} /{" "}
            {this.props.stats.minted > this.props.stats.paidTokens
              ? this.props.stats.totalSupply
              : this.props.stats.paidTokens}
          </Col>
        </Row>
        <Row style={{ paddingTop: "25px" }}>
          <Col span={6}/>
          <Col span="6" style={{ textAlign: "center" }}>
            <Button type="primary" onClick={this.mint.bind(this)} style={{ textAlign: "center" }}>
              Mint
            </Button>
          </Col>
          <Col span="6" style={{ textAlign: "center" }}>
            <Button type="primary" onClick={this.mint.bind(this)} style={{ textAlign: "center" }}>
              Mint & Stake
            </Button>
          </Col>
          <Col span={6}/>
        </Row>
        <Row>
          <Col span={6}/>
          <Col span="6" style={{ textAlign: "center" }}>
          </Col>
          <Col span="6" style={{ textAlign: "center" }}>
            (saves gas costs)
          </Col>
        </Row>
      </Card>
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
          <Col span={12}>{attributes[0].value === "Chef" ? "Insanity level" : "Fatness level"}</Col>
          <Col span={12}>
            <Progress
              strokeColor={attributes[0].value === "Chef" ? "blue" : "brown"}
              percent={ attributes[0].value === "Chef" ? hash['Insanity percentage'] : hash['Fatness percentage'] }
              status="active" />
          </Col>
        </Row>
        <Row>
          <Col span={12}>{attributes[0].value === "Chef" ? "Insanity status" : "Fatness status"}</Col>
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
                key.trait_type !== 'Fatness' && key.trait_type !== 'Fatness percentage'
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
    this.nftProfit = 0;

    if (!this.state.dataLoaded) {
      return (
        <Spin/>
      )
    }

    let nftsPerRow = 0;
    let offset = 0;
    let minimumNftsPerRow = 3;

    if (staked) {
      // Is in a kitchen
      offset = 290;
      minimumNftsPerRow = 2;
    } else {
      offset = 100;
    }

    let availableSpace = window.innerWidth - offset;
    availableSpace = availableSpace * 0.65;
    nftsPerRow = parseInt(availableSpace / 122);
    if (nftsPerRow < minimumNftsPerRow) {
      nftsPerRow = minimumNftsPerRow;
    }


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
        rows.push(this.renderNFTRow(i, nftsPerRow, rowNFTs, staked, type));
    }


    return (
      <div>
        { rows }
      </div>
    );
  }

  renderNFTRow(i, nftsPerRow, nft, staked, type) {
    return (
      <Row>
        <Col span={24}>
          <Row style={{marginLeft: '10px', marginRight: '10px'}}>
          {nft.map(c => {
            return this.renderNFTColumn(c, staked);
          })}
          </Row>
        </Col>
      </Row>
    )
  }

  renderNFTColumn(c, staked) {
    if (!c || !c.name) {
      return <div>&nbsp;</div>
    }
    return (
      <span style={{ width: "120px", marginRight: "20px"}}>
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
          <div>#{c.name}</div>
          <Popover mouseEnterDelay={1} content={this.renderNFTInfo(c.attributes, c.image)} title={c.description}>
            <img width={100} src={c.image} />
          </Popover>
          <Progress
            strokeColor={c.type === "Chef" ? "green" : "orange"}
            percent={ c.type === 'Chef' ? c.skillLevel : c.intelligenceLevel }
            size="small"
            status="active"
          />
          <Progress
          strokeColor={c.type === "Chef" ? "blue" : "brown"}
          percent={ c.type === 'Chef' ? c.insanityLevel : c.fatnessLevel }
          size="small"
          status="active"
           />
          {c.timestamp > 0 ? (
            <p style={{ fontSize: "11px" }}>{this.renderNftProfit(c.type, c.timestamp)} $FFOOD</p>
          ) : null}
        </div>
      </span>
    )
  }

  renderNftProfit(type, timestamp) {
    if (type !== "Rat") {
      const owedPerSecond = 1000 / 86400;
      const timePassed = Math.floor(Date.now() / 1000) - timestamp;
      this.nftProfit += timePassed * owedPerSecond * 0.8;
      return (timePassed * owedPerSecond * 0.8).toFixed(0);
    } else {
      let totalChefProfit = 0;
      this.state.allStakedChefs.map(a => {
        const owedPerSecond = 1000 / 86400;
        const timePassed = Math.floor(Date.now() / 1000) - a.stakedTimestamp;
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
    } catch (e) {
      renderNotification("error", "Error", e.message);
    }
  }

  renderApprovalButton() {
    return (
      <Button className="web3Button" type={"default"} onClick={this.setApprovalForAll.bind(this)}>
        Authorize
      </Button>
    );
  }

  async stakeAll() {
    try {
      const result = await this.props.tx(
        this.props.writeContracts.KitchenPack.stakeMany(this.props.address, this.state.unstakedNfts, {
          gasPrice: 1000000000,
          from: this.props.address,
          gasLimit: this.state.unstakedNfts.length * 120000,
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
          gasPrice: 1000000000,
          from: this.props.address,
          gasLimit: this.state.stakedNfts.length * 125000,
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

  async stake(selectedToStakeNfts) {
    try {
      const result = await this.props.tx(
        this.props.writeContracts.KitchenPack.stakeMany(this.props.address, selectedToStakeNfts, {
          gasPrice: 1000000000,
          from: this.props.address,
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
          gasPrice: 1000000000,
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

  renderStakeAllButton() {
    return (
      <Button className="web3Button" type={"primary"} onClick={this.stakeAll.bind(this)}>
        Stake all
      </Button>
    );
  }

  renderStakeButton(selectedToStakeNfts) {
    return (
      <Button
        className="web3Button"
        type={"primary"}
        disabled={selectedToStakeNfts.length === 0}
        onClick={this.stake.bind(this, selectedToStakeNfts)}
      >
        Stake {selectedToStakeNfts.length} NFTs
      </Button>
    );
  }

  renderUnStakeButton(selectedToUnStakeNfts) {
    return (
      <Button
        className="web3Button"
        type={"default"}
        disabled={selectedToUnStakeNfts.length === 0}
        onClick={this.unstake.bind(this, selectedToUnStakeNfts)}
      >
        Unstake {selectedToUnStakeNfts.length} NFTs
      </Button>
    );
  }

  renderUnStakeAllButton() {
    return (
      <Button className="web3Button" type={"default"} onClick={this.unstakeAll.bind(this)}>
        Unstake all
      </Button>
    );
  }

  renderClaimButton() {
    return (
      <Button className="web3Button" type={"default"} onClick={this.unstakeAll.bind(this)}>
        Claim $FFOOD
      </Button>
    );
  }

  renderLegend() {
    return (
      <div>
        <Row>
          <Col xl={4} md={8} sm={8}>
            Chefs
          </Col>
          <Col xl={4} md={8} sm={8} style={{ color: "green" }}>
            Skill level
          </Col>
          <Col xl={4} md={8} sm={8} style={{ color: "blue" }}>
            Insanity level
          </Col>
          <Col xl={6} lg={0} md={0} sm={0}>
            {this.state.totalChefs} chefs, {this.state.totalChefsStaked} staked
          </Col>
          <Col xl={6} lg={0} md={0} sm={0}>
            {this.state.totalRats} rats, {this.state.totalRatsStaked} staked
          </Col>
        </Row>
        <Row>
          <Col xl={4} md={8} sm={8}>
            Rats
          </Col>
          <Col xl={4} md={8} sm={8} style={{ color: "orange" }}>
            Intelligence
          </Col>
          <Col xl={4} md={8} sm={8} style={{ color: "brown" }}>
            Fatness
          </Col>
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

  renderNfts() {
    return (
      <Card size="small" title="My NFTs">
        <Card size="small" style={{background: '#CCCCCC', height: '100px'}}>
        Roof
        </Card>
        <Card size="small">
          <Row>
            <Col style={{width: '180px', border: '1px solid #000000'}}>
              Le stake ***
            </Col>
            <Col span="22">

            </Col>
          </Row>
        </Card>
        <Card size="small">
          <Row>
            <Col style={{width: '180px', border: '1px solid #000000'}}>
              Stake house
            </Col>
            <Col span={22}>
            </Col>
          </Row>
        </Card>
        <Card size="small">
          <Row>
            <Col style={{width: '180px', border: '1px solid #000000'}}>
              McStake
            </Col>
            <Col style={{border: '1px solid #000000', marginLeft: '20px'}}>
              {!this.state.loading ? this.renderStaked() : <Skeleton />}
            </Col>
          </Row>
        </Card>
        <Card size="small">{!this.state.loading ? this.renderChefs() : <Skeleton />}</Card>
        <Card size="small" style={{background: '#CCCCCC', height: '30px'}}>
          Ground
        </Card>

        <Card size="small">{!this.state.loading ? this.renderRats() : <Skeleton />}</Card>



        <Card size="small">
        { this.renderLegend() }
        { this.renderButtons() }
        </Card>
      </Card>
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
      <Row>
        <Col span={12}>Total rats</Col>
        <Col span={12}>{this.props.stats.rats}</Col>
        <Col span={12}>Total rats staked</Col>
        <Col span={12}>{this.props.stats.ratsStaked}</Col>
        <Col span={12}>Total chefs</Col>
        <Col span={12}>{this.props.stats.chefs}</Col>
        <Col span={12}>Total chefs staked</Col>
        <Col span={12}>{this.props.stats.chefsStaked}</Col>
        <Col span={12}>Total $FFOOD claimed</Col>
        <Col span={12}>{this.props.stats.tokensClaimed}</Col>
      </Row>
    )
  }

  renderGame() {
    return (
          <Row style={{ height: "100%" }}>
            <Col md={24} xs={24}>
              <Row>
                <Col md={2} xs={1} />
                <Col md={20} xs={20}>
                  {this.props.address ? this.renderMintContent() : this.renderNACard("Mint")}
                </Col>
                <Col md={2} xs={1} />
              </Row>
              <Row>
                <Col md={2} xs={1} />
                <Col span={20}>
                  <Card size="small" title="My balances" style={{ marginTop: "25px" }}>
                    {this.props.balanceContent}
                  </Card>
                  <Card size="small" title="Game Stats" style={{ marginTop: "25px" }}>
                    { this.renderStats() }
                  </Card>
                  <Card size="small" title="Info" style={{ marginTop: "25px" }}>
                    <Row>
                      <Col span="24">
                        {this.props.stats.tokensClaimed + this.props.stats.maxSupply * 0.25 <=
                        this.props.stats.maxSupply ? (
                          <div>
                            <p>
                              Chefs earn a minimum of {this.props.stats.dailyFFoodRate} $FFOOD per day. Your chefs may
                              get more daily $FFOOD depending on their <b>skill</b> level.
                            </p>
                            <p>
                              Rats steal {this.props.stats.ratTax}% of all Chef's $FFOOD. Your rats get a proportional
                              cut depending on their <b>fatness</b> level.
                            </p>
                            The minimum staking period is {this.props.stats.minimumToExit / 3600} hours. Learn more
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
            </Col>
            <Col md={24} xs={24}>
              <Row style={{ marginTop: "25px" }}>
                <Col md={2} xs={1} />
                <Col md={20} xs={22}>
                  {this.props.address ? this.renderNfts() : this.renderNACard("Your NFTs")}
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
