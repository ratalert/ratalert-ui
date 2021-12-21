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
  Slider,
  InputNumber,
  Skeleton,
  Progress,
} from "antd";
const { Header, Footer, Sider, Content } = Layout;
import { useEventListener } from "eth-hooks/events/useEventListener";
import { request, gql } from "graphql-request";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
const APIURL = "http://localhost:8000/subgraphs/name/ChefRat";
import { LeftOutlined } from "@ant-design/icons";
const { ethers } = require("ethers");
import { renderNotification } from "../helpers";

class Main extends React.Component {
  constructor(props) {
    super(props);
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
      noAddressLoaded: false,
    };
    this.nftProfit = 0;
  }

  componentDidUpdate(prevProps) {}

  onChangeAmount(mintAmount) {
    if (mintAmount >= 1 && mintAmount <= 10) {
      this.setState({ mintAmount });
    } else {
      this.setState({ mintAmount: 1 });
    }
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
          id, staked, owner,stakedTimestamp, URI,
        }
      }`;

    const query2 = `{ chefRats(where: {
          stakingOwner: "${this.props.address || "0x2f7CdD90AB83405654eE10FC916a582a3cDe7E6F"}"
        }) {
          id, staked, owner,stakedTimestamp, URI,
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
    }, 3000);
  }

  decToHex(dec) {
    return (+dec).toString(16);
  }

  async getNFTObject(id) {
    const hex = `0x${this.decToHex(id)}`;
    const query = `{
        chefRat(id:"${hex}") {
          id, URI
        }
      }`;
    const result = await request(APIURL, query);
    if (result.chefRat) {
      const URI = result.chefRat.URI;
      const base64 = URI.split(",");
      const decoded = atob(base64[1]);
      const json = JSON.parse(decoded);
      return { image: json.image, name: json.name };
    }
    return { image: "", name: "" };
  }

  async componentWillMount() {
    setTimeout(async () => {
      const filter = {
        address: this.props.readContracts.ChefRat.address,
        topics: [
          // the name of the event, parnetheses containing the data type of each event, no spaces
          ethers.utils.id("Transfer(address,address,uint256)"),
        ],
      };
      let format = ["address", "address", "uint256"];

      this.props.provider.on(filter, async data => {
        data.topics.shift();

        let i = 0;
        const decoded = [];
        data.topics.map(v => {
          const tmp = ethers.utils.defaultAbiCoder.decode([format[i]], v);
          i += 1;
          decoded.push(tmp);
        });

        if (
          decoded[1] &&
          decoded[0] &&
          decoded[1].toString() === this.props.address &&
          decoded[0].toString() === "0x0000000000000000000000000000000000000000"
        ) {
          setTimeout(async () => {
            const { name, image } = await this.getNFTObject(decoded[2]);
            if (image) {
              renderNotification(
                "info",
                "NFT minted",
                <div>
                  <img style={{ paddingRight: "10px" }} width={50} src={image} />
                  <b>{name}</b> has been minted
                </div>,
              );
            }
          }, 10000);
        }
      });
    }, 1000);

    window.addEventListener("resize", this.handleResize);
    setTimeout(() => {
      if (!this.props.address) {
        this.setState({ noAddressLoaded: true });
      }
    }, 500);
    this.fetchGraph();
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
      // {gasPrice: 1000000000, from: this.props.address, gasLimit: 85000}
      const result = await this.props.writeContracts.ChefRat.mint(amount, {
        from: this.props.address,
        value: ethers.utils.parseEther(sum.toString()),
        gasLimit: amount * 250000,
      });
      renderNotification("info", `${amount} mint(s) requested`, "");
    } catch (e) {
      renderNotification("error", "Error", e.message);
    }
  }

  renderMintContent() {
    return (
      <Card size="small" title="Minting">
        <Row>
          <Col span={24} style={{ textAlign: "center" }}>
            <b>Price per NFT: {this.props.stats.mintPrice} ETH</b>
          </Col>
        </Row>
        <Row></Row>
        <Row>
          <Col span={24} style={{ textAlign: "center" }}>
            Select how many NFTs you want to mint:
          </Col>
        </Row>
        <Row>
          <Col span={4} />
          <Col span={12}>
            <Slider
              min={1}
              max={10}
              onChange={this.onChangeAmount.bind(this)}
              value={typeof this.state.mintAmount === "number" ? this.state.mintAmount : 0}
            />
          </Col>
          <Col span={4}>
            <InputNumber
              min={1}
              max={10}
              style={{ margin: "0 16px" }}
              value={this.state.mintAmount}
              onChange={this.onChangeAmount.bind(this)}
            />
          </Col>
        </Row>
        <Row>
          <Col span={6} />
          <Col span={6} style={{ textAlign: "center" }}>
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
          <Col span="24" style={{ textAlign: "center" }}>
            <Button type="primary" onClick={this.mint.bind(this)} style={{ textAlign: "center" }}>
              Mint
            </Button>
          </Col>
        </Row>
      </Card>
    );
  }

  renderNFTInfo(attributes, img) {
    /*

      */
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
            <Progress strokeColor={attributes[0].value === "Chef" ? "green" : "orange"} percent={33} status="active" />
          </Col>
        </Row>
        <Row>
          <Col span={12}>{attributes[0].value === "Chef" ? "Skill status" : "Intelligence status"}</Col>
          <Col span={12}>{attributes[0].value === "Chef" ? "Guru" : "Normal"}</Col>
        </Row>
        <Row>
          <Col span={12}>{attributes[0].value === "Chef" ? "Insanity level" : "Fatness level"}</Col>
          <Col span={12}>
            <Progress strokeColor={attributes[0].value === "Chef" ? "blue" : "brown"} percent={66} status="active" />
          </Col>
        </Row>
        <Row>
          <Col span={12}>{attributes[0].value === "Chef" ? "Insanity status" : "Fatness status"}</Col>
          <Col span={12}>{attributes[0].value === "Chef" ? "Insane" : "Fat"}</Col>
        </Row>

        <Row>
          <Col span={24}>
            <b>Attributes</b>
          </Col>
        </Row>
        {attributes.map(key => (
          <Row>
            <Col span={12}>{key.trait_type}</Col>
            <Col span={12}>{key.value}</Col>
          </Row>
        ))}
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
          if (type !== null && json.name && json.attributes[0].value === type && r.staked == staked) {
            nft.push({
              name: parseInt(r.id, 16),
              description: json.name,
              timestamp: parseInt(r.stakedTimestamp),
              image: json.image,
              type,
              attributes: json.attributes,
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
            });
          }
        }
      }
    });
    nft.sort((a, b) => a.name - b.name);
    this.nftProfit = 0;
    return (
      <Row>
        {nft.map(c => (
          <Col md={7} xl={3} lg={4} style={{ padding: "5px" }}>
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
              #{c.name}
              <Popover mouseEnterDelay={1} content={this.renderNFTInfo(c.attributes, c.image)} title={c.description}>
                <img src={c.image} />
              </Popover>
              <Progress
                strokeColor={c.type === "Chef" ? "green" : "orange"}
                percent={33}
                size="small"
                status="active"
              />
              <Progress strokeColor={c.type === "Chef" ? "blue" : "brown"} percent={66} size="small" status="active" />
              {c.timestamp > 0 ? (
                <p style={{ fontSize: "11px" }}>{this.renderNftProfit(c.type, c.timestamp)} $FFOOD</p>
              ) : null}
            </div>
          </Col>
        ))}
      </Row>
    );
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
      <Button type={"default"} onClick={this.setApprovalForAll.bind(this)}>
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
      <Button type={"primary"} onClick={this.stakeAll.bind(this)}>
        Stake all
      </Button>
    );
  }

  renderStakeButton(selectedToStakeNfts) {
    return (
      <Button
        type={"primary"}
        disabled={selectedToStakeNfts.length === 0}
        onClick={this.stake.bind(this, selectedToStakeNfts)}
      >
        Stake {selectedToStakeNfts.length} selected
      </Button>
    );
  }

  renderUnStakeButton(selectedToUnStakeNfts) {
    return (
      <Button
        type={"default"}
        disabled={selectedToUnStakeNfts.length === 0}
        onClick={this.unstake.bind(this, selectedToUnStakeNfts)}
      >
        Unstake {selectedToUnStakeNfts.length} selected
      </Button>
    );
  }

  renderUnStakeAllButton() {
    return (
      <Button type={"default"} onClick={this.unstakeAll.bind(this)}>
        Unstake all
      </Button>
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
        <Row>
          <Col xxl={4} lg={7} md={7} sm={8}>
            {this.renderApprovalButton()}
          </Col>
          <Col xxl={4} lg={7} md={7} sm={5}>
            {this.renderStakeAllButton()}
          </Col>
          <Col xxl={6} lg={10} md={10} sm={8}>
            {this.renderStakeButton(selectedToStakeNfts)}
          </Col>
          <Col xxl={6} lg={10} md={10} sm={8}>
            {this.renderUnStakeButton(selectedToUnStakeNfts)}
          </Col>
          <Col xxl={4} lg={5} md={6} sm={8}>
            {this.renderUnStakeAllButton()}
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
        <Card size="small">{!this.state.loading ? this.renderRats() : <Skeleton />}</Card>
        <Card size="small">{!this.state.loading ? this.renderChefs() : <Skeleton />}</Card>
        <Card size="small" title="Stake">
          {!this.state.loading ? this.renderStaked() : <Skeleton />}
        </Card>

        <Card size="small">{this.renderButtons()}</Card>
      </Card>
    );
  }

  render() {
    return (
      <Layout>
        <PageHeader ghost={false} title="Rat Alert" subTitle="the newest NFT game" extra={this.props.data}></PageHeader>
        <Content>
          <Row style={{ height: "100%" }}>
            <Col md={12} xs={24}>
              <Row>
                <Col md={2} xs={1} />
                <Col md={22} xs={22}>
                  {this.props.address ? this.renderMintContent() : this.renderNACard("Mint")}
                </Col>
              </Row>
              <Row>
                <Col md={2} xs={1} />
                <Col span={22}>
                  <Card size="small" title="My balances" style={{ marginTop: "25px" }}>
                    {this.props.balanceContent}
                  </Card>
                  <Card size="small" title="Game Stats" style={{ marginTop: "25px" }}>
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
            <Col md={12} xs={24}>
              <Row className="mobileRow">
                <Col md={2} xs={1} />
                <Col md={20} xs={22}>
                  {this.props.address ? this.renderNfts() : this.renderNACard("Your NFTs")}
                </Col>
              </Row>
            </Col>
          </Row>
        </Content>
        <Footer>Footer</Footer>
      </Layout>
    );
  }
}

export default Main;
