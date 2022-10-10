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

  getWhitePaper() {
    return (
      <div id="container">
          <div id="bottom">
              <div id="content">
                  <main>
                      <h1>RatAlert Whitepaper</h1>


                      <h2 id="tldr">TL;DR</h2>
                      <p>
                          Paris - it’s the city where aspiring entrepreneurial <a href="/gameplay#chefs">chefs</a> make
                          their way to the top. Only the crème de la crème will get to open mint their own
                          GourmetFood kitchen such as <a href="/gameplay#lestake">LeStake&copy;</a>,
                          the famous 3-star restaurant in the metaverse. Slip into the role of an <strong>entrepreneurial
                          chef</strong> and <del>recruit</del> mint your <strong>kitchen team</strong>!
                      </p>
                      <p>
                          RatAlert is more than a play2earn game: We like to call it <strong>train2win</strong>. Why? Because the NFT
                          characters that you mint are not just random traits of different rarity. They are dynamic.
                          <strong>You</strong> are the one who <strong>multiplies their value by training them</strong>!
                      </p>
                      <p>
                          Trained characters earn much higher yields when staked in either of three different
                          kitchens: <em>Michael McSaylor’s</em> fast food joint <a href="/gameplay#mcstake">McStake&copy;</a>,
                          the casual diner <a href="/gameplay#thestakehouse">TheStakehouse&copy;</a> &amp;
                          the gourmet cuisine <a href="/gameplay#lestake">LeStake&copy;</a>.
                          Each kitchen earns a different food token and all of them have different utility.
                          FastFood <a href="/gameplay#ffood">$FFOOD</a> is required to mint characters and your own TheStakehouse kitchen + items.
                          CasualFood <a href="/gameplay#cfood">$CFOOD</a> is required to mint your own LeStake kitchen + items. The
                          low-supply GourmetFood <a href="/gameplay#gfood">$GFOOD</a> is the game’s DAO token and required to mint LeStake
                          kitchen items. You guessed it: Kitchens are RatAlerts “land”.
                      </p>
                      <p>
                          <strong>Chefs earn food tokens</strong> and grow their <strong>skill level</strong> when staked in kitchens.
                          However, since working in kitchens is a demanding job, they also build up a certain <strong>stress
                          level</strong>. You may not be able to avoid periodic visits by the food inspector but you certainly
                          don’t want them to suffer a burn-out. That’s why you’re advised to make use of
                          the <strong>gym</strong> to <strong>blow off some <del>steam</del> stress</strong> from time to time.
                      </p>
                      <p>
                          <strong>Rats</strong>, the villain characters in the game, <strong>steal food tokens</strong> when staked in kitchens. The
                          more they steal, the more their <strong>intelligence level</strong> grows. On the flip side, they cannot
                          help but consume a lot which is not advantageous to their <strong>body mass level</strong>. While rat traps
                          become less of an issue when they’re intelligent, they will become much easier prey to cats
                          when they are obese. Take care of your rats and make them <strong>lose weight</strong> in the <strong>gym</strong>.
                      </p>
                      <p>
                          RatAlert <strong>rewards active players</strong> over inactive players. That’s why you should have an eye
                          on your characters on a <strong>daily basis</strong>. You won’t lose if you don’t but you won’t win either.
                          Also, while RatAlert NFTs cannot be stolen (for now), they can be fragile as tamagotchi and
                          you may have to return to square one.
                      </p>
                      <p>
                          The <strong>555 Gen0 “OG” characters</strong> are proud members of the illustrious <strong>555 Club</strong>. They
                          already have and will also receive in the future <strong>a lot more utility</strong> than the 10,000 Gen1
                          characters.
                      </p>
                      <p>Check out our <a href="/infographic">infographic</a> for a quick glance.</p>


                      <h2 id="vision">Vision</h2>
                      <p>
                          We believe that NFT gaming projects cannot be static. That’s why most RatAlert <strong>contracts are
                          upgradeable</strong> through <strong>RatAlert DAO proposals</strong>. Not only does this allow all sorts of <strong>updates
                          to the game and its rules</strong>, it also opens the door to an entirely different <strong>game
                          sequel</strong> that reuses the characters and kitchens of RatAlert. More importantly, upgradeable
                          contracts enable RatAlert to <strong>pivot</strong> to all sorts of internal and external market
                          challenges.
                      </p>
                      <p>We also strongly believe that <strong>community ownership</strong> is key for the long term success of a
                          play2earn game. From the moment the game’s smart contracts were deployed, RatAlert became a
                          community effort. The code was <strong>open sourced</strong> & all contracts surrendered their ownership
                          to the <a href="https://www.tally.xyz/governance/eip155:137:0xb85F643F9bb94a30c1B95e9dC3bADff771B749A6" target="_blank">RatAlert DAO</a>.
                          What this means is that <strong>everyone</strong> is not only able but entitled
                          to <strong>make changes</strong> to the game through a <strong>DAO proposal</strong> without the
                          consent of the core team.
                      </p>


                      <h2 id="mission">Mission</h2>
                      <p>We aim to become an <strong>OG project</strong> among play2earn games. RatAlert’s innovative <strong>dynamic
                          NFTs</strong> evolve during their lifecycle. They change their properties and visual appearance
                          on-chain, both in the game and on NFT marketplaces. This <strong>train2win</strong> concept has been
                          introduced by RatAlert and will be copied by many others. Another new concept not seen in the
                          play2earn space before RatAlert is the idea of handling your NFTs like <strong>tamagotchis</strong>&nbsp;
                          and <strong>rewarding active players</strong> over inactive players.</p>


                      <h2 id="tech">Tech</h2>
                      <p>RatAlert has been deployed with every Web3 best practice in mind.</p>
                      <ul>
                          <li>Smart contracts are built using the well-audited <a href="https://www.openzeppelin.com/">OpenZeppelin</a> library</li>
                          <li>Smart contracts surrender ownership to a <a href="https://polygonscan.com/address/0x32dd207f1f16dd4ceea94833ab9fb5dd96bc0924">TimelockController</a></li>
                          <li>DAO proposals & voting is powered by <a href="https://www.tally.xyz/governance/eip155:137:0xb85F643F9bb94a30c1B95e9dC3bADff771B749A6">Tally</a></li>
                          <li>Funds are governed by a 4 of 6 multisig <a href="https://gnosis-safe.io/app/matic:0xbEf526C8325C47817ceb435011bf1E6bc9ec691d/home">Gnosis Safe</a> co-signed by the community</li>
                          <li>All smart contracts have been open sourced on <a href="https://github.com/ratalert/ratalert-contracts">GitHub</a></li>
                          <li>All smart contracts have been audited by <a href="https://www.certik.com/projects/rat-alert">CertiK</a></li>
                          <li>Operations that depend on randomness use <a href="https://docs.chain.link/docs/chainlink-vrf/">ChainLink VRF</a></li>
                          <li>Character NFTs implement <a href="https://eips.ethereum.org/EIPS/eip-721">ERC-721</a>, kitchens and kitchen items implement <a href="https://eips.ethereum.org/EIPS/eip-1155">ERC-1155</a></li>
                          <li>Food tokens implement vanilla <a href="https://eips.ethereum.org/EIPS/eip-20">ERC-20</a>, only $GFOOD extends <a href="https://docs.openzeppelin.com/contracts/4.x/governance">governance</a> features</li>
                          <li>The entire game state can be queried through the <a href="https://thegraph.com/hosted-service/subgraph/ratalert/ratalert">Graph Protocol</a></li>
                          <li>The UI is a <a href="https://reactjs.org/">React</a> app and implements <a href="https://docs.ethers.io/v5/">Ethers.js</a> &amp; <a href="https://ant.design/">Ant Design</a></li>
                      </ul>


                      <h2 id="team">The Team</h2>
                      <div class="team">
                          <div class="member">
                              <img src="../assets/images/team_daniel.png" alt="Daniel" title="Daniel" />
                              <div>
                                  <h5>Daniel aka george-prime#7574<br/>Co-Founder &amp; Web3 Engineer (UI)</h5>
                                  <p>"I’ve been a software architect for 20+ years and have been consulting major
                                      enterprises. I got involved with crypto in early 2011 and I’ve been hooked ever
                                      since. I run my own crypto-consultancy business and I provide services to
                                      various crypto companies since 2018. I got involved with DeFi in 2020 and have
                                      always been very curious about web3 technologies and smart contracts. I’ve had a
                                      lot of fun during the 6 months of development for RatAlert."</p>
                                  <p className="links">
                                      <a href="https://twitter.com/george_prime1" target="_blank" className="social">Twitter</a>
                                  </p>
                              </div>
                          </div>
                          <div class="member">
                              <img src="../assets/images/team_chris.png" alt="Chris" title="Chris" />
                              <div>
                                  <h5>Chris aka juggernod#0921<br/>Co-Founder &amp; Web3 Engineer (Solidity)</h5>
                                  <p>“I’ve spent 20 years as a freelance software architect consulting startups &amp; major
                                      enterprises. When I learned about crypto in 2015, I was drawn in right away.
                                      Between the 2017/18 altcoin boom and the 2020 halving, I worked for 2 crypto
                                      exchanges and developed my own high-frequency arbitrage trading engine. With the
                                      rise of DeFi, DAOs &amp; NFTs in 2020-21, I went all in Web3 &amp; Solidity until we
                                      finally came up with the idea of RatAlert in November 2021.”</p>
                                  <p className="links">
                                      <a href="https://twitter.com/kwizzn" target="_blank" className="social">Twitter</a>
                                  </p>
                              </div>
                          </div>
                          <div class="member">
                              <img src="../assets/images/team_leo.png" alt="Leo" title="Leo" />
                              <div>
                                  <h5>Leo aka cap#5523<br/>Co-Founder &amp; Art Director</h5>
                                  <p>"I’m an Interaction Designer and Usability Engineer for 13+ years and have been
                                      working with large enterprises as well as co-founding tech startups. In addition,
                                      I’m lecturing Human-Centered Design at engineering and design faculties. For 5
                                      years I've been active in the crypto space and for me nothing is more exciting
                                      than to combine UX work with our own projects in the area of crypto and Web3."</p>
                                  <p className="links">
                                      <a href="https://twitter.com/leoglomann" target="_blank" className="social">Twitter</a>
                                  </p>
                              </div>
                          </div>
                          <div class="member">
                              <img src="../assets/images/team_jon.png" alt="Jon" title="Jon" />
                              <div>
                                  <h5>Jon aka KryptoDreamz#0921<br/>Chief Marketing Officer</h5>
                                  <p>"I have over 20 years of marketing and promotional experience and have been
                                      involved with blockchain for 5 years. I specialize in analyzing trends and
                                      implementing strategic marketing plans. I’m also the host of the NFT and Metaverse
                                      YouTube channel KryptoDreamz.”</p>
                                  <p className="links">
                                      <a href="https://twitter.com/DreamzKrypto" target="_blank" className="social">Twitter</a>
                                  </p>
                              </div>
                          </div>
                      </div>

                      <h2 id="partners">Partners</h2>
                      <div className="partners">
                          <p>
                              <a href="https://polygon.technology/" target="_blank" className="partnerLogo"><img src="../assets/images/partner_polygon.png" alt="Polygon" title="Polygon" /></a>
                              <strong>Polygon.</strong> The Game is implemented on the Polygon (MATIC) L2 blockchain for 2 obvious
                              reasons: OpenSea support and gas costs (you are going to want to make a lot of blockchain
                              requests…).
                          </p>
                          <p>
                              <a href="https://chain.link/vrf" target="_blank" className="partnerLogo"><img src="../assets/images/partner_chainlink.png" alt="ChainLink" title="ChainLink" /></a>
                              <strong>ChainLink.</strong> Fairness and security is our utmost concern. We proudly use Chainlink VRF for
                              both minting and claiming. RatAlert is not susceptible to “Flashbot” attacks on weak
                              randomizers that Wolf Game or Wizard &amp; Dragons suffered from.
                          </p>
                          <p>
                              <a href="https://www.certik.com/projects/rat-alert" target="_blank" className="partnerLogo"><img src="../assets/images/partner_certik.png" alt="CertiK" title="CertiK" /></a>
                              <strong>CertiK.</strong> When we evaluated the market in December 2021, many play2earn projects struggled
                              with exploits. We chose to submit all our smart contracts into an audit to not only avoid that
                              but to signal our legitimacy. CertiK proved to be a perfect partner, their diligence and
                              helpfulness were unmatched. See our <a href="https://www.certik.com/projects/rat-alert" target="_blank">audit report</a>.
                          </p>
                          <p>
                              <a href="https://assuredefi.io/projects/ratalert/" target="_blank" className="partnerLogo"><img src="../assets/images/partner_assuredefi.png" alt="AssureDeFi" title="AssureDeFi" /></a>
                              <strong>AssureDefi.</strong> For a development team to remain anonymous while being doxxed to the community
                              through a proxy company has become an industry standard. While we also
                              <a href="https://assuredefi.io/projects/ratalert/" target="_blank"> doxxed ourselves </a>
                              with AssureDeFi, we’re convinced that nothing beats honesty and transparency. That’s why
                              the <a href="#team">team section</a> is now public.
                          </p>
                          <p>
                              <a href="https://www.tally.xyz/governance/eip155:137:0xb85F643F9bb94a30c1B95e9dC3bADff771B749A6" target="_blank" className="partnerLogo"><img src="../assets/images/partner_tally.png" alt="Tally" title="Tally" /></a>
                              <strong>Tally.</strong> The heart and soul of the <a href="https://www.tally.xyz/governance/eip155:137:0xb85F643F9bb94a30c1B95e9dC3bADff771B749A6" target="_blank">RatAlert DAO</a>. This is where all community decisions are made
                              and proposals find votes.
                          </p>
                          <p>
                              <a href="https://gnosis-safe.io/app/matic:0xbEf526C8325C47817ceb435011bf1E6bc9ec691d/home" target="_blank" className="partnerLogo"><img src="../assets/images/partner_gnosissafe.png" alt="Gnosis Safe" title="Gnosis Safe" /></a>
                              <strong>Gnosis Safe.</strong> The RatAlert DAO funds are governed by a 4 of 6 multisig <a href="https://gnosis-safe.io/app/matic:0xbEf526C8325C47817ceb435011bf1E6bc9ec691d/home" target="_blank">Gnosis Safe</a> that is
                              co-signed by 3 community members.
                          </p>
                          <p>
                              <a href="https://opensea.io/collection/ratalert-characters" target="_blank" className="partnerLogo"><img src="../assets/images/partner_opensea.png" alt="OpenSea" title="OpenSea" /></a>
                              <strong>OpenSea.</strong> Needs no introduction. One of the reasons why RatAlert is implemented on Polygon
                              is because OpenSea was one of the first NFT marketplaces that supported the blockchain.
                          </p>
                          <p>
                              <a href="https://metacombine.io/" target="_blank" className="partnerLogo"><img src="../assets/images/partner_metacombine.png" alt="MetaCombine" title="MetaCombine" /></a>
                              <strong>MetaCombine.</strong> We’re proud to be an early partner. MetaCombine’s ecosystem will increase
                              RatAlert’s visibility in the market and allow our gamers to join guilds with fellow
                              gamers.
                          </p>
                      </div>


                      <h2 id="roadmap">Roadmap</h2>

                      <h3>Released</h3>
                      <p>Our accomplishments so far.</p>
                      <ul>
                          <li>Dec 2021 Development started</li>
                          <li>Jan 2022: Team doxxed through AssureDefi</li>
                          <li>Mar 2022: Smart contracts submitted into audit by CertiK</li>
                          <li>Apr 2022: Beta test launched</li>
                          <li>May 2022: Launch &amp; whitelist mint</li>
                          <li>May 2022: Public mint</li>
                          <li>May 2022: Food tokens $FFOOD, $CFOOD &amp; $GFOOD launched</li>
                          <li>May 2022: LP program launched</li>
                          <li>Jun 2022: Food tokens listed on Coingecko</li>
                          <li>Jun 2022: RatAlert DAO launched</li>
                          <li>Jun 2022: First DAO proposal executed to reduce character supply</li>
                          <li>Jun 2022: RatAlert Generation 0 mints out</li>
                          <li>Jul 2022: 555 Club opens</li>
                      </ul>

                      <h3>Backlog</h3>
                      <p>
                          RatAlert v2 covers the remaining features of the “inflationary economy”, i.e. the phase in
                          the game where NFTs &amp; tokens can be <del>printed</del> minted. They are planned for Q3 2022 - Q1
                          2023. The game sequel reuses all NFTs &amp; food tokens in a “deflationary economy”, where new
                          players need to buy on the open market and exchange throughout players is encouraged
                          through the game. It is planned for 2023.
                      </p>

                      <h4>v2</h4>
                      <ul>
                          <li><strong>Additional claim events.</strong> Be prepared to face new challenges when you claim. The
                              food inspector, burnouts &amp; rat traps &amp; cats will still haunt you but you’ll encounter
                              new events such as kitchen fires. But don’t worry, not all of them will be negative
                              and you may face them in other venues as well.
                          </li>
                          <li><strong>Kitchen items.</strong> No kitchen is complete without appliances. They will help reduce
                              or neutralize detrimental effects caused by claim events. Some of them only once, some
                              multiple times. Just imagine not having a fire extinguisher when you need it the most!
                          </li>
                          <li><strong>Playable cat.</strong> The third playable character in the game. Only 100 cats will ever
                              exist in the game and they can be minted for free only by insane chefs. A cat allows
                              you to steal the loot from 5 random obese rats per day. However, after 10 days, the
                              cat will seek a new home!
                          </li>
                          <li><strong>Kitchen rental market.</strong> Commercial space in Paris is limited, and so is kitchen
                              space. You have kitchen space that you don’t use? Rent it out to fellow players and
                              earn a cut of their staking income.
                          </li>
                          <li><strong>Dice games.</strong> Feeling lucky? Then roll the dice each time you claim your food
                              tokens. You may triple your income or lose it all, even your NFT!
                          </li>
                          <li><strong>Breeding recipes.</strong> Create the perfect dish and enter the chef de cuisine hall of
                              fame. It needs the right amount of everything. Only the right chef in the right
                              kitchen using the right amount of food tokens will create a once in a lifetime
                              masterpiece.
                          </li>
                      </ul>

                      <h4>Sequel</h4>
                      <p>The sequel is yet to be announced.</p>


                      <h2 id="gameplay">Gameplay</h2>
                      <p>
                          You can find everything about RatAlert’s characters, kitchens and the general rules of the
                          game on the <a href="/gameplay">Gameplay</a> page.
                      </p>


                      <h2 id="tokenomics">Tokenomics</h2>

                      <h3>Food Tokens</h3>
                      <p>
                          The game introduces 3 different ERC-20 <strong>food tokens</strong>, each one with a different max supply.
                          50% of each token’s supply is issued to players through play2earn
                          by <del>working/stealing</del> staking your characters in one of the kitchens. The tokens have
                          different utility and can be purchased on QuickSwap for Polygon (MATIC) or traded for the
                          other food tokens.
                      </p>

                      <h4>FastFood ($FFOOD)</h4>
                      <p>Earned through staking your character(s) at <a href="/gameplay#mcstake">McStake&copy;</a>.</p>
                      <table>
                          <tr>
                              <td>Max supply</td>
                              <td>100,000,000</td>
                          </tr>
                          <tr>
                              <td>Play2earn supply</td>
                              <td>50,000,000 (50%)</td>
                          </tr>
                          <tr>
                              <td>Earning</td>
                              <td>Stake character(s) at <a href="/gameplay#mcstake">McStake&copy;</a></td>
                          </tr>
                          <tr>
                              <td>Trading on QuickSwap</td>
                              <td>
                                  <ul>
                                      <li><a href="https://www.google.com/url?q=https://quickswap.exchange/%23/swap?outputCurrency%3D0x2721d859ee8d03599f628522d30f14d516502944&amp;sa=D&amp;source=editors&amp;ust=1659105791512133&amp;usg=AOvVaw2YpfZyKSF9lEDzRD_uigyb">MATIC / FFOOD</a></li>
                                      <li><a href="https://www.google.com/url?q=https://quickswap.exchange/%23/swap?inputCurrency%3D0x33CC3b1852939Ef8CFd77BB5c3707cF2D3E72490%26outputCurrency%3D0x2721d859ee8d03599f628522d30f14d516502944&amp;sa=D&amp;source=editors&amp;ust=1659105791512458&amp;usg=AOvVaw1Ol2xVrs9QDzh8dDx7Z3LZ">CFOOD / FFOOD</a></li>
                                      <li><a href="https://www.google.com/url?q=https://quickswap.exchange/%23/swap?inputCurrency%3D0x57d43cfe565a2e6c181662ae73a9f1ec6a830351%26outputCurrency%3D0x2721d859ee8d03599f628522d30f14d516502944&amp;sa=D&amp;source=editors&amp;ust=1659105791512740&amp;usg=AOvVaw0sDKEfaGLw8lqEAg3V2GWI">GFOOD / FFOOD</a></li>
                                  </ul>
                              </td>
                          </tr>
                          <tr>
                              <td>Market Infos</td>
                              <td><a href="https://www.google.com/url?q=https://www.coingecko.com/en/coins/ratalert-fastfood&amp;sa=D&amp;source=editors&amp;ust=1659105791513670&amp;usg=AOvVaw2E4h1yvr2MxGcYdHn6DG7M">Coingecko</a></td>
                          </tr>
                          <tr>
                              <td>Token Contract</td>
                              <td><a href="https://www.google.com/url?q=https://polygonscan.com/token/0x2721d859ee8d03599f628522d30f14d516502944&amp;sa=D&amp;source=editors&amp;ust=1659105791514535&amp;usg=AOvVaw06vjg7odRhzQuyWKTb06IC">PolygonScan</a></td>
                          </tr>
                          <tr>
                              <td>Utility</td>
                              <td>
                                  <ul>
                                      <li>Purchase Gen1 characters</li>
                                      <li>Purchase <a href="/gameplay#thestakehouse">TheStakehouse&copy;</a> kitchens</li>
                                  </ul>
                              </td>
                          </tr>
                      </table>

                      <h4>CasualFood ($CFOOD)</h4>
                      <p>Earned through staking your character(s) at <a href="/gameplay#thestakehouse">TheStakehouse&copy;</a>.</p>
                      <table>
                          <tr>
                              <td>Max supply</td>
                              <td>10,000,000</td>
                          </tr>
                          <tr>
                              <td>Play2earn supply</td>
                              <td>5,000,000 (50%)</td>
                          </tr>
                          <tr>
                              <td>Earning</td>
                              <td>Stake character(s) at <a href="/gameplay#thestakehouse">TheStakehouse&copy;</a></td>
                          </tr>
                          <tr>
                              <td>Trading on QuickSwap</td>
                              <td>
                                  <ul>
                                      <li><a href="https://www.google.com/url?q=https://quickswap.exchange/%23/swap?outputCurrency%3D0x33CC3b1852939Ef8CFd77BB5c3707cF2D3E72490&amp;sa=D&amp;source=editors&amp;ust=1659105791518683&amp;usg=AOvVaw2-c9c4zR6CXcGTbipoeuVc">MATIC / CFOOD</a></li>
                                      <li><a href="https://www.google.com/url?q=https://quickswap.exchange/%23/swap?inputCurrency%3D0x2721d859ee8d03599f628522d30f14d516502944%26outputCurrency%3D0x33cc3b1852939ef8cfd77bb5c3707cf2d3e72490&amp;sa=D&amp;source=editors&amp;ust=1659105791518913&amp;usg=AOvVaw3Tu8u6zUczdjpIMj0a0Nat">FFOOD / CFOOD</a></li>
                                      <li><a href="https://www.google.com/url?q=https://quickswap.exchange/%23/swap?inputCurrency%3D0x57d43cfe565a2e6c181662ae73a9f1ec6a830351%26outputCurrency%3D0x33cc3b1852939ef8cfd77bb5c3707cf2d3e72490&amp;sa=D&amp;source=editors&amp;ust=1659105791519182&amp;usg=AOvVaw06aF-t0AV42z7syxQeV68R">GFOOD / CFOOD</a></li>
                                  </ul>
                              </td>
                          </tr>
                          <tr>
                              <td>Market Infos</td>
                              <td><a href="https://www.google.com/url?q=https://www.coingecko.com/en/coins/ratalert-casual-food&amp;sa=D&amp;source=editors&amp;ust=1659105791519986&amp;usg=AOvVaw0RJ7N1Bg2FK8NUpmuvDQjB">Coingecko</a></td>
                          </tr>
                          <tr>
                              <td>Token Contract</td>
                              <td><a href="https://www.google.com/url?q=https://polygonscan.com/token/0x33CC3b1852939Ef8CFd77BB5c3707cF2D3E72490&amp;sa=D&amp;source=editors&amp;ust=1659105791520810&amp;usg=AOvVaw3pCf3EaS7CdGjMIGWs1szH">PolygonScan</a></td>
                          </tr>
                          <tr>
                              <td>Utility</td>
                              <td>
                                  <ul>
                                      <li>Purchase <a href="/gameplay#lestake">LeStake&copy;</a> kitchens</li>
                                      <li>Purchase <a href="/gameplay#thestakehouse">TheStakehouse&copy;</a> kitchen items (v2)</li>
                                  </ul>
                              </td>
                          </tr>
                      </table>

                      <h4>GourmetFood ($GFOOD)</h4>
                      <p>
                          Earned through staking your character(s) at <a href="/gameplay#lestake">LeStake&copy;</a>. It
                          is also RatAlert’s <a href="https://www.google.com/url?q=https://www.tally.xyz/governance/eip155:137:0xb85F643F9bb94a30c1B95e9dC3bADff771B749A6&amp;sa=D&amp;source=editors&amp;ust=1659105791523009&amp;usg=AOvVaw31hchkoNnDRMQdmLTQ2jtU">DAO token</a> and
                          owners have front row seats in all game decision processes.
                      </p>
                      <table>
                          <tr>
                              <td>Max supply</td>
                              <td>1,000,000</td>
                          </tr>
                          <tr>
                              <td>Play2earn supply</td>
                              <td>500,000 (50%)</td>
                          </tr>
                          <tr>
                              <td>Earning</td>
                              <td>Stake character(s) at <a href="/gameplay#lestake">LeStake&copy;</a></td>
                          </tr>
                          <tr>
                              <td>Trading on QuickSwap</td>
                              <td>
                                  <ul>
                                      <li><a href="https://quickswap.exchange/#/swap?outputCurrency=0x57d43cfe565a2e6c181662ae73a9f1ec6a830351">MATIC / GFOOD</a></li>
                                      <li><a href="https://quickswap.exchange/#/swap?inputCurrency=0x2721d859ee8d03599f628522d30f14d516502944&outputCurrency=0x57d43cfe565a2e6c181662ae73a9f1ec6a830351">FFOOD / GFOOD</a></li>
                                      <li><a href="https://quickswap.exchange/#/swap?inputCurrency=0x33CC3b1852939Ef8CFd77BB5c3707cF2D3E72490&outputCurrency=0x57d43cfe565a2e6c181662ae73a9f1ec6a830351">CFOOD / GFOOD</a></li>
                                  </ul>
                              </td>
                          </tr>
                          <tr>
                              <td>Market Infos</td>
                              <td><a href="https://www.coingecko.com/en/coins/ratalert-gourmet-food">Coingecko</a></td>
                          </tr>
                          <tr>
                              <td>Token Contract</td>
                              <td><a href="https://www.google.com/url?q=https://polygonscan.com/token/0x57d43cfe565a2e6c181662ae73a9f1ec6a830351&amp;sa=D&amp;source=editors&amp;ust=1659105791528432&amp;usg=AOvVaw3zmZuc8rHAkEBsPHFQfHyj">PolygonScan</a></td>
                          </tr>
                          <tr>
                              <td>Utility</td>
                              <td>
                                  <ul>
                                      <li>RatAlert’s <a href="https://www.google.com/url?q=https://www.tally.xyz/governance/eip155:137:0xb85F643F9bb94a30c1B95e9dC3bADff771B749A6&amp;sa=D&amp;source=editors&amp;ust=1659105791529150&amp;usg=AOvVaw3K4vNGRAwr96-8ji8Im3q1">DAO token</a></li>
                                      <li>Purchase <a href="/gameplay#lestake">LeStake&copy;</a> kitchen items (v2)</li>
                                  </ul>
                              </td>
                          </tr>
                      </table>

                      <h3>Allocations and Unlock Schedule</h3>
                      <p>
                          The following allocation table is used for all 3 food tokens. The core team has a clear
                          unlock schedule for their token allocation: 20% upon launch and then 5% each month.
                      </p>
                      <table>
                          <tr>
                              <td>Play2Earn Treasury</td>
                              <td>50%</td>
                              <td>&nbsp;</td>
                          </tr>
                          <tr>
                              <td>Core team</td>
                              <td>20%</td>
                              <td>20% unlocked upon launch, then 5% monthly</td>
                          </tr>
                          <tr>
                              <td>Ecosystem incentives</td>
                              <td>15%</td>
                              <td>&nbsp;</td>
                          </tr>
                          <tr>
                              <td>Staking & LP rewards</td>
                              <td>10%</td>
                              <td>&nbsp;</td>
                          </tr>
                          <tr>
                              <td>Advisors</td>
                              <td>5%</td>
                              <td>25% unlocked upon launch, then 5% monthly</td>
                          </tr>
                      </table>

                      <h3>Token Issuance</h3>
                      <p>
                          <strong>50% of each token’s supply</strong> is issued to players through <strong>play2earn</strong> by&nbsp;
                          <del>working/stealing</del> <strong>staking your characters</strong> in one of the kitchens. Nothing is
                          pre-minted, every play2earn claim is minted <strong>on-demand</strong> to the player’s wallet. This
                          ensures that the circulating supply is always <strong>relative to the active user base</strong>. The more
                          users enter the game, the higher the daily issuance of new tokens.
                      </p>
                      <p>Here’s the daily income in each of the kitchens:</p>
                      <table>
                          <tr>
                              <td><a href="/gameplay#mcstake">McStake&copy;</a></td>
                              <td>50 $FFOOD per chef, rats earn 20%</td>
                          </tr>
                          <tr>
                              <td><a href="/gameplay#thestakehouse">TheStakehouse&copy;</a></td>
                              <td>25 $CFOOD per chef, rats earn 20%</td>
                          </tr>
                          <tr>
                              <td><a href="/gameplay#lestake">LeStake&copy;</a></td>
                              <td>1 $GFOOD per chef, rats earn 20%</td>
                          </tr>
                      </table>

                      <h3>Token Burn</h3>
                      <p>
                          Progressing through the game leaves a <strong>devastating trail of token burn</strong>: Each character,
                          kitchen & kitchen item purchase immediately <strong>burns the entire purchase price</strong>. For a good
                          reason. Not only does this create a <strong>healthy and deflationary economy</strong>. All purchase prices
                          have in fact been calculated such that <strong>100% of the play2earn allocation will be
                          burned</strong> if every character & item is being sold. This supply reduction allows each
                          food token’s price to <strong>appreciate over time</strong>. Additionally, the RatAlert DAO will not
                          miss a single chance to <strong>burn even more</strong> from time to time.
                      </p>

                      <h3>Liquidity & LP Program</h3>
                      <p>
                          The team will always <strong>provide liquidity</strong> on QuickSwap for food token trades. However, we
                          encourage LPs (liquidity providers) to earn additional food token rewards by staking their
                          LP tokens in the RatAlert <a href="https://lp.ratalert.com">liquidity program</a>.
                          10% of each food token’s max supply is allocated for LP rewards.
                      </p>
                      <p>
                          We have published a detailed <a href="https://ratalert.medium.com/becoming-a-lp-liquidity-provider-65ddf404ed2c">
                          Medium article</a> on how this works.
                      </p>


                      <h2 id="dao">RatAlert DAO</h2>
                      <p>
                          From the moment the game’s smart contracts were deployed, RatAlert became a community
                          effort. The code was <strong>open sourced</strong> & all contracts surrendered their ownership to the&nbsp;
                          <a href="https://www.tally.xyz/governance/eip155:137:0xb85F643F9bb94a30c1B95e9dC3bADff771B749A6" target="_blank">RatAlert DAO</a> (via
                          a timelock controller). What this means is that <strong>everyone</strong> is
                          not only able but entitled to <strong>make changes</strong> to the game through
                          a <strong>DAO proposal</strong> without the consent of the core team.
                      </p>
                      <p>
                          DAO proposals are discussed in the <a href="https://discord.com/channels/923481639026294854/982657025530036254">#dao-proposals</a> channel
                          on Discord and the voting is powered
                          by <a href="https://www.tally.xyz/governance/eip155:137:0xb85F643F9bb94a30c1B95e9dC3bADff771B749A6" target="_blank">Tally</a>.
                      </p>


                      <h2 id="lore">Lore</h2>
                      <p>
                          We would love the community to come up with a great lore that revolves around certain key
                          characters in a <strong>lore competition</strong> that is to be announced soon.
                      </p>
                  </main>
              </div>
          </div>
      </div>
    )
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

  renderWhitepaper() {
    const skyAttr = this.getWidth('sky', true, 1440, 1000);
    let height = this.state.height;
    setTimeout(() => {
      this.updateHeight();
    }, 100);

    return (
      <div className="main whitepaper" ref={this.whitepaperRef} style={{borderRadius: 30, border: '1px solid #CCCCCC', background: '#F5F5F5', marginLeft: 20, marginRight: 20, marginBottom: 20}}>
      <div className={this.getGradientClass()} style={{top: skyAttr.height, height: height - skyAttr.height}}>
      </div>
      { this.getWhitePaper() }
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
      return this.renderWhitepaper();
    }
  }
}

export default Whitepaper;
