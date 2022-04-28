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
                      <h1>Whitepaper v1</h1>
                      <h2 id="toc">Table Of Contents</h2>
                      <ul id="tableofcontents">
                          <li><a href="#story">The Story</a></li>
                          <li><a href="#mechanics">The Mechanics</a></li>
                          <li>
                              <a href="#venues">The Venues</a>
                              <ul className="whitepaper-ul">
                                  <li><a href="#mcstake">FastFood Kitchen McStake©</a></li>
                                  <li><a href="#thestakehouse">CasualFood Kitchen TheStakeHouse©</a></li>
                                  <li><a href="#lestake">GourmetFood Kitchen LeStake©</a></li>
                                  <li><a href="#gym">Gym</a></li>
                              </ul>
                          </li>
                          <li>
                              <a href="#tokens">The Tokens</a>
                              <ul className="whitepaper-ul">
                                  <li><a href="#ffood">FastFood ($FFOOD)</a></li>
                                  <li><a href="#cfood">CasualFood ($CFOOD)</a></li>
                                  <li><a href="#gfood">GourmetFood ($GFOOD)</a></li>
                              </ul>
                          </li>
                          <li>
                              <a href="#cast">The Cast</a>
                              <ul className="whitepaper-ul">
                                  <li><a href="#chefs">Chefs</a></li>
                                  <li><a href="#rats">Rats</a></li>
                                  <li><a href="#cats">Cats</a></li>
                              </ul>
                          </li>
                          <li><a href="#contracts">Contract Addresses</a></li>
                      </ul>

                      <h2 id="story">The Story</h2>
                      <img style={{width: 500}} src="../assets/images/image23.png" width="100%" alt="alt_text" title="image_tooltip" />

                      <p>
                          Paris - it’s the city where aspiring entrepreneurial <a href="#chefs">chefs</a> make their way to the top. Only the crème de la crème will get to <del>open</del> mint their own GourmetFood kitchen such as
                          <a href="#lestake"><em>LeStake©</em></a>, the famous 3-star restaurant in the metaverse. Slip into the role of an entrepreneurial chef and <del>recruit</del> mint your kitchen team!
                      </p>
                      <p>
                          Of course, you know that expertise requires a lot of practice and so your <a href="#chefs">chefs’</a> first (staking) position takes them to <a href="#mcstake"><em>McStake©</em></a>, the metaverse’s FastFood joint
                          run by <em>Michael McSaylor</em>. Quickly, their skill level will outgrow the <a href="#ffood">$FFOOD</a> business and they will yearn for more. Knowing that you have already put your earned tokens to good use, your
                          new CasualFood kitchen <a href="#thestakehouse"><em>TheStakeHouse©</em></a> allows your chefs to produce the delicious <a href="#cfood">$CFOOD</a>. You can already smell the sweet scent of success, when finally, your
                          chefs become the rare elite and produce the low supply <a href="#gfood">$GFOOD</a> in your brand new GourmetFood kitchen <a href="#lestake"><em>LeStake©</em></a>. At the same time, your chefs are put to the ultimate
                          test. Working at the top means a lot of stress. You will certainly regret it if you let them get burned out or be punished by the food inspector!
                      </p>
                      <p>The three <a href="#tokens">food tokens</a> not only buy you more elaborate <a href="#venues">kitchens</a>, but also more chefs to scale your endeavour. Or does it…?</p>
                      <p>
                          It does not. It might as well buy you starving sewer <a href="#rats">rats</a> that love nothing more than <a href="#ffood">$FFOOD</a> and they will do anything to steal it <em>for you</em> from all over the city.
                          They are quick learners, and you’ll get to make them steal <a href="#cfood">$CFOOD</a> and eventually the fine <a href="#gfood">$GFOOD</a> once their intelligence quotient allows. But beware: Rat traps and cunning
                          &nbsp;<a href="#cats">cats</a> are all over the place. Don’t let your rats get caught, or suffer the consequences!
                      </p>

                      <h2 id="mechanics">The Mechanics</h2>

                      <ul className="whitepaper-ul">
                          <li>Play to earn different ERC20 tokens by staking your ERC721 characters in one of three available <del>kitchens</del> contracts</li>
                          <li>For the first time, you can “train” and “recover” your ERC721 characters through clever staking in different contracts to make them extra valuable</li>
                          <li>The rules of the game are entirely on-chain</li>
                          <li>Most importantly: Always look after your characters - they are fragile like Tamagotchi!</li>
                          <li>The Game is implemented on Polygon (MATIC) for 2 obvious reasons: Gas costs & OpenSea support</li>
                      </ul>

                      <h2 id="venues">The Venues</h2>

                      <h3 id="mcstake">FastFood Kitchen McStake©</h3>

                      <p><img style={{width: 500}} src="../assets/images/image16.png" width="100%" alt="alt_text" title="image_tooltip" /></p>
                      <p>
                          <em>Michael McSaylor’s</em> <em>McStake©</em> is “virtually” all over town. Here, <a href="#chefs">chefs</a> start their career as an employee producing <a href="#ffood">$FFOOD</a> which <a href="#rats">rats</a> love
                          for its “simplicity”.
                      </p>

                      <h4>Events</h4>

                      <table>
                          <tr>
                              <th><strong>Event</strong></th>
                              <th><strong>Chefs</strong></th>
                              <th><strong>Rats</strong></th>
                          </tr>
                          <tr>
                              <td>Enter kitchen (stake)</td>
                              <td>No requirements</td>
                              <td>No requirements</td>
                          </tr>
                          <tr>
                              <td rowspan="3">Payout (claim)</td>
                              <td>
                                  Achievements:
                                  <ul className="whitepaper-ul">
                                      <li>2% skill per day</li>
                                      <li>4% freak per day</li>
                                      <p>(all prorated to the second)</p>

                                  </ul>
                              </td>
                              <td>
                                  Achievements:
                                  <ul className="whitepaper-ul">
                                      <li>2% intelligence per day</li>
                                      <li>8% body mass per day</li>
                                      <p>(all prorated to the second)</p>

                                  </ul>
                              </td>
                          </tr>
                          <tr>
                              <td>Reward: minimum 250 $FFOOD per day (prorated to the second), receive 80% on claim</td>
                              <td>Reward: Steal a guaranteed 20% cut of produced $FFOOD</td>
                          </tr>
                          <tr>
                              <td>Risk: None so far, coming up in v2</td>
                              <td>Risk: None so far, coming up in v2</td>
                          </tr>
                          <tr>
                              <td rowspan="2">Leave kitchen (unstake)</td>
                              <td>Cannot unstake within 24h</td>
                              <td>Cannot unstake within 24h</td>
                          </tr>
                          <tr>
                              <td>Risk: None so far, coming up in v2</td>
                              <td>Risk: None so far, coming up in v2</td>
                          </tr>
                      </table>

                      <h3 id="thestakehouse">CasualFood Kitchen TheStakeHouse©</h3>

                      <p>
                          <img style={{width: 500}} src="../assets/images/image19.png" width="100%" alt="alt_text" title="image_tooltip" />
                      </p>
                      <p>
                          A wise man once said: “There is no second best”. He was of course talking about the steaks at <em>TheStakeHouse©</em>. These CasualFood kitchens allow your <a href="#chefs">chefs</a> to produce
                          <a href="#cfood">$CFOOD</a> and they are the venue where the wheat gets separated from the chaff. With a total supply of only 5,000 kitchens, you need to be quick to get in the game.
                      </p>
                      <h4>Minting cost</h4>

                      <table>
                          <tr>
                              <td class="right">1 - 1,000</td>
                              <td>2,000 $FFOOD</td>
                          </tr>
                          <tr>
                              <td class="right">1,001 - 2,000</td>
                              <td>3,000 $FFOOD</td>
                          </tr>
                          <tr>
                              <td class="right">2,001 - 3,000</td>
                              <td>4,000 $FFOOD</td>
                          </tr>
                          <tr>
                              <td class="right">3,001 - 4,000</td>
                              <td>5,000 $FFOOD</td>
                          </tr>
                          <tr>
                              <td class="right">4,001 - 5,000</td>
                              <td>6,000 $FFOOD</td>
                          </tr>
                      </table>

                      <h4>Events</h4>

                      <table>
                          <tr>
                              <th><strong>Event</strong></th>
                              <th><strong>Chefs</strong></th>
                              <th><strong>Rats</strong></th>
                          </tr>
                          <tr>
                              <td>Enter kitchen (stake)</td>
                              <td>Minimum requirement: 28% skill</td>
                              <td>Minimum requirement: 28% intelligence</td>
                          </tr>
                          <tr>
                              <td rowspan="3">Payout (claim)</td>
                              <td>
                                  Achievements:
                                  <ul className="whitepaper-ul">
                                      <li>4% skill per day</li>
                                      <li>6% freak per day</li>
                                      <p>(all prorated to the second)</p>

                                  </ul>
                              </td>
                              <td>
                                  Achievements:
                                  <ul className="whitepaper-ul">
                                      <li>4% intelligence per day</li>
                                      <li>6% body mass per day</li>
                                      <p>(all prorated to the second)</p>

                                  </ul>
                              </td>
                          </tr>
                          <tr>
                              <td>Reward: minimum 250 $CFOOD per day (prorated to the second), receive 80% on claim</td>
                              <td>Reward: Steal a guaranteed 20% cut of produced $CFOOD</td>
                          </tr>
                          <tr>
                              <td>Risk: None so far coming up in v2</td>
                              <td>Risk: None so far coming up in v2</td>
                          </tr>
                          <tr>
                              <td rowspan="2">Leave kitchen (unstake)</td>
                              <td>Cannot unstake within 24h</td>
                              <td>Cannot unstake within 24h</td>
                          </tr>
                          <tr>
                              <td>Risk: None so far, coming up in v2</td>
                              <td>Risk: None so far, coming up in v2</td>
                          </tr>
                      </table>

                      <h3 id="lestake">GourmetFood Kitchen LeStake©</h3>

                      <p>
                          <img style={{width: 500}} src="../assets/images/image33.png" width="100%" alt="alt_text" title="image_tooltip" />
                      </p>
                      <p>
                          <em>LeStake©</em>. No other restaurant in the metaverse can hold the candle to this famous 3-star kitchen, and it can only be purchased with <a href="#cfood">$CFOOD</a>. These GourmetFood kitchens are where the fine
                          dining <a href="#gfood">$GFOOD</a> is made and where heroes become legends. With a total supply of 500 kitchens, only the crème de la crème will get to call themselves proud owners. But it doesn’t stop there. Since
                          $GFOOD is RatAlert’s DAO token, all <a href="#chefs">chefs</a> & <a href="#rats">rats</a> operating in this kitchen will have the first seats in all game decision processes.
                      </p>

                      <h4>Minting cost</h4>

                      <table>
                          <tr>
                              <td class="right">1 - 100</td>
                              <td>2,000 $CFOOD</td>
                          </tr>
                          <tr>
                              <td class="right">101 - 200</td>
                              <td>3,000 $CFOOD</td>
                          </tr>
                          <tr>
                              <td class="right">201 - 300</td>
                              <td>4,000 $CFOOD</td>
                          </tr>
                          <tr>
                              <td class="right">301 - 400</td>
                              <td>5,000 $CFOOD</td>
                          </tr>
                          <tr>
                              <td class="right">401 - 500</td>
                              <td>6,000 $CFOOD</td>
                          </tr>
                      </table>

                      <h4>Events</h4>

                      <table>
                          <tr>
                              <th><strong>Event</strong></th>
                              <th><strong>Chefs</strong></th>
                              <th><strong>Rats</strong></th>
                          </tr>
                          <tr>
                              <td>Enter kitchen (stake)</td>
                              <td>Minimum requirement: 72% skill</td>
                              <td>Minimum requirement: 72% intelligence</td>
                          </tr>
                          <tr>
                              <td rowspan="3">Payout (claim)</td>
                              <td>
                                  Achievements:
                                  <ul className="whitepaper-ul">
                                      <li>6% skill per day</li>
                                      <li>
                                          8% freak per day
                                          <p>(all prorated to the second)</p>
                                      </li>
                                  </ul>
                              </td>
                              <td>
                                  Achievements:
                                  <ul className="whitepaper-ul">
                                      <li>6% intelligence per day</li>
                                      <li>
                                          4% body mass per day
                                          <p>(all prorated to the second)</p>
                                      </li>
                                  </ul>
                              </td>
                          </tr>
                          <tr>
                              <td>Reward: minimum 250 $GFOOD per day (prorated to the second), receive 80% on claim</td>
                              <td>Reward: Steal a guaranteed 20% cut of produced $GFOOD</td>
                          </tr>
                          <tr>
                              <td>Risk: None so far coming up in v2</td>
                              <td>Risk: None so far coming up in v2</td>
                          </tr>
                          <tr>
                              <td rowspan="2">Leave kitchen (unstake)</td>
                              <td>Cannot unstake within 24h</td>
                              <td>Cannot unstake within 24h</td>
                          </tr>
                          <tr>
                              <td>Risk: None so far, coming up in v2</td>
                              <td>Risk: None so far, coming up in v2</td>
                          </tr>
                      </table>

                      <h3 id="gym">Gym</h3>

                      <p>
                          <img style={{width: 500}} src="../assets/images/venue_gym.png" width="100%" alt="Gym" title="Gym" />
                      </p>
                      <p>
                          There are only a few jobs more stressful than that of a <a href="#chefs">chef</a>. Time is key, language is rough, stakes are high and so is the risk of burnout. <a href="#rats">Rats</a> on the other hand face the
                          risk of getting overweight and becoming easy prey for <a href="#cats">cats</a>, especially in <a href="#mcstake">FastFood kitchens</a>.
                      </p>
                      <p>
                          Do not let that happen, be sure to send your characters to the gym where they can blow off steam, relax and lose weight.
                      </p>

                      <h4>Events</h4>

                      <table>
                          <tr>
                              <th><strong>Event</strong></th>
                              <th><strong>Chefs</strong></th>
                              <th><strong>Rats</strong></th>
                          </tr>
                          <tr>
                              <td rowspan="2">Enter gym (stake)</td>
                              <td>No requirements</td>
                              <td>No requirements</td>
                          </tr>
                          <tr>
                              <td>
                                  Achievement: -12% freak per day<br />
                                  (prorated to the second)
                              </td>
                              <td>
                                  Achievement: -8% body mass per day<br />
                                  (prorated to the second)
                              </td>
                          </tr>
                          <tr>
                              <td rowspan="2">Leave gym (unstake)</td>
                              <td>Cannot unstake within 2h</td>
                              <td>Cannot unstake within 2h</td>
                          </tr>
                          <tr>
                              <td>No risk</td>
                              <td>No risk</td>
                          </tr>
                      </table>

                      <h2 id="tokens">The Tokens</h2>

                      <p>
                          The Game introduces 3 different “food” tokens with decreasing total supply. Together, they are referred to as $xFOOD. During your progress through the game, you will produce these tokens and need them to purchase
                          items. Liquidity will be provided by the team, but everyone is encouraged to provide liquidity and earn their own LP staking rewards.
                      </p>
                      <h3 id="ffood">FastFood ($FFOOD)</h3>

                      <p>
                          The ERC20 token earned for <del>working/stealing</del> staking at <a href="#mcstake"><em>McStake©</em></a>. It comes with a max supply of 100.000.000.
                      </p>

                      <h4>Allocations and Unlock schedule</h4>

                      <table>
                          <tr>
                              <td>Play2Earn Treasury</td>
                              <td class="right">50%</td>
                              <td></td>
                          </tr>
                          <tr>
                              <td>Core team</td>
                              <td class="right">20%</td>
                              <td>20% unlocked at launch, then 5% monthly</td>
                          </tr>
                          <tr>
                              <td>Ecosystem incentives</td>
                              <td class="right">15%</td>
                              <td></td>
                          </tr>
                          <tr>
                              <td>Staking & LP rewards</td>
                              <td class="right">10%</td>
                              <td></td>
                          </tr>
                          <tr>
                              <td>Advisors</td>
                              <td class="right">5%</td>
                              <td>25% unlocked at launch, then 5% monthly</td>
                          </tr>
                      </table>

                      <h3 id="cfood">CasualFood ($CFOOD)</h3>

                      <p>The ERC20 token earned for <del>working/stealing</del> staking at <a href="#thestakehouse"><em>TheStakeHouse©</em></a>. It comes with a max supply of 10.000.000.</p>

                      <h4>Allocations and Unlock schedule</h4>

                      <table>
                          <tr>
                              <td>Play2Earn Treasury</td>
                              <td class="right">50%</td>
                              <td></td>
                          </tr>
                          <tr>
                              <td>Core team</td>
                              <td class="right">20%</td>
                              <td>20% unlocked at launch, then 5% monthly</td>
                          </tr>
                          <tr>
                              <td>Ecosystem incentives</td>
                              <td class="right">15%</td>
                              <td></td>
                          </tr>
                          <tr>
                              <td>Staking & LP rewards</td>
                              <td class="right">10%</td>
                              <td></td>
                          </tr>
                          <tr>
                              <td>Advisors</td>
                              <td class="right">5%</td>
                              <td>25% unlocked at launch, then 5% monthly</td>
                          </tr>
                      </table>

                      <h3 id="gfood">GourmetFood ($GFOOD)</h3>

                      <p>
                          The ERC20 token earned for <del>working/stealing</del> staking at <a href="#lestake"><em>LeStake©</em></a>. It comes with a max supply of 1.000.000 and is RatAlert’s DAO token. Owners have front row seats in all game
                          decision processes.
                      </p>
                      <h4>Allocations and Unlock schedule</h4>

                      <table>
                          <tr>
                              <td>Play2Earn Treasury</td>
                              <td class="right">50%</td>
                              <td></td>
                          </tr>
                          <tr>
                              <td>Core team</td>
                              <td class="right">20%</td>
                              <td>20% unlocked at launch, then 5% monthly</td>
                          </tr>
                          <tr>
                              <td>Ecosystem incentives</td>
                              <td class="right">15%</td>
                              <td></td>
                          </tr>
                          <tr>
                              <td>Staking & LP rewards</td>
                              <td class="right">10%</td>
                              <td></td>
                          </tr>
                          <tr>
                              <td>Advisors</td>
                              <td class="right">5%</td>
                              <td>25% unlocked at launch, then 5% monthly</td>
                          </tr>
                      </table>

                      <h2 id="cast">The Cast</h2>

                      <h3 id="cast_general">General</h3>

                      <p>RatAlert has 3 main characters: <a href="#chefs">chefs</a>, <a href="#rats">rats</a> and <a href="#cats">cats</a>. Chefs <del>cook</del> mint food tokens, rats steal them and cats kidnap rats.</p>
                      <p>
                          Every minted character is unique and has the ability to be trained by the player. Each NFT has 2 attributes that change upon unstaking or claiming. Attributes affect the appearance (image) of the NFT, visible both in
                          the game and on OpenSea. The pixel size is 100x100, 3 times the size of other Play2Earn games, like Wolf Game.
                      </p>
                      <p>The mining cost for one Generation 0 NFT is <strong>74 MATIC</strong>.</p>
                      <p>Users that are eligible for the whitelist are able to mint their NFTs up to <strong>24 hours</strong> before the official launch, and receive a discount of 10%, resulting in a price of <strong>66 MATIC</strong>.</p>
                      <p>
                          After 10,000 Generation 0 NFTs have sold out, Generation 1 NFTs can be purchased with the first of our game tokens, $FFOOD (FastFood):
                      </p>

                      <table>
                          <tr>
                              <td class="right">10,001 - 20,000</td>
                              <td>1,000 $FFOOD</td>
                          </tr>
                          <tr>
                              <td class="right">20,001 - 30,000</td>
                              <td>1,500 $FFOOD</td>
                          </tr>
                          <tr>
                              <td class="right">30,001 - 40,000</td>
                              <td>2,000 $FFOOD</td>
                          </tr>
                          <tr>
                              <td class="right">40,001 - 60,000</td>
                              <td>3,000 $FFOOD</td>
                          </tr>
                      </table>

                      <h3 id="chefs">Chefs</h3>

                      <p>Chefs are the main character in the game and come with 5 different trait types:</p>
                      <ul className="whitepaper-ul">
                          <li>Eyes: includes sunglasses or laser eyes</li>

                          <li>Hat: includes various hats, like the famous red cap from <em>McStake©</em></li>

                          <li>Neck: various neck items, like butterfly ties</li>

                          <li>Mouth: includes various beards, like a braided beard</li>

                          <li>Hand: includes different accessories, like pastry rollers or knives</li>
                      </ul>
                      <p><strong>90%</strong> of all mints are chefs.</p>
                      <p>Chefs come with two attributes: <strong>skill</strong> and <strong>freak</strong>.</p>
                      <p>
                          <strong>Skill</strong> is an exclusively positive attribute and describes your chef’s ability to learn new things and gain experience. The <strong>skill</strong> level also affects the amount of
                          &nbsp;<a href="#tokens">$xFOOD</a> your chef can produce per day. The smarter your chef gets, the more he will cook.
                      </p>
                      <p>
                          <strong>Freak </strong>is a two-edged sword: In the beginning, your chef’s freak attribute is harmless as he just started cooking at the famous <a href="#mcstake"><em>McStake©</em></a> FastFood chain. He’s
                          bored and eager to learn more. Later in his career, your chef starts cooking in his own <a href="#thestakehouse">kitchens</a> and is growing very fond of himself, up to a point where he can simply become
                          <strong>insane.</strong> Being <strong>insane</strong> comes with a high risk of burnout, effectively ending your chef’s career and returning to square one.
                      </p>
                      {
                        /*
                      <p>
                          However, fortune favors the bold. If you’re keen enough on taking the risk of having your staked chef go insane, you get the chance of minting one of 100 <a href="#cats">cats</a> for free which will deal with rats in
                          its own special way.
                      </p>
                      */
                      }
                      {
                        /*
                      <p>Even if you’re not able to mint one of the 100 <a href="#cats">cats</a>, you might still get one by just keeping your chef <strong>insane</strong> (or the rat <strong>obese</strong>)</p>
                      */
                      }
                      <p>
                          The chef’s <strong>skill</strong> level is represented by the <strong>body</strong> while the chef’s <strong>freak</strong> level is represented by his <strong>head</strong>. Both attributes are displayed on a
                          scale from 0% to 100%.
                      </p>

                      <h4>List of Freak levels</h4>

                      <table>
                          <tr>
                              <th>Image</th>
                              <th>Description</th>
                              <th>Numeric Value</th>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image31.png" width="" alt="alt_text" title="image_tooltip" /></td>
                              <td>bored</td>
                              <td>0%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image30.png" width="" alt="alt_text" title="image_tooltip" /></td>
                              <td>unconventional</td>
                              <td>15%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image20.png" width="" alt="alt_text" title="image_tooltip" /></td>
                              <td>fancy</td>
                              <td>28%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image13.png" width="" alt="alt_text" title="image_tooltip" /></td>
                              <td>brilliant</td>
                              <td>42%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image27.png" width="" alt="alt_text" title="image_tooltip" /></td>
                              <td>creative genius</td>
                              <td>58%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image10.png" width="" alt="alt_text" title="image_tooltip" /></td>
                              <td>guru</td>
                              <td>72%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image17.png" width="" alt="alt_text" title="image_tooltip" /></td>
                              <td>insane</td>
                              <td>86%</td>
                          </tr>
                      </table>

                      <h4>List of skill levels</h4>

                      <p>All bodies include the “guru” head for artistic sake:</p>

                      <table>
                          <tr>
                              <th>Image</th>
                              <th>Description</th>
                              <th>Numeric Value</th>
                              <th>$xFOOD Earnings</th>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image21.png" width="50" alt="alt_text" title="image_tooltip" /></td>
                              <td>Kitchen Scullion</td>
                              <td>0%</td>
                              <td>100%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image8.png" width="50" alt="alt_text" title="image_tooltip" /></td>
                              <td>Vegetable Slicer</td>
                              <td>15%</td>
                              <td>125%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image28.png" width="50" alt="alt_text" title="image_tooltip" /></td>
                              <td>Ingredient Taster</td>
                              <td>28%</td>
                              <td>150%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image7.png" width="50" alt="alt_text" title="image_tooltip" /></td>
                              <td>Pastry chef</td>
                              <td>42%</td>
                              <td>175%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image14.png" width="50" alt="alt_text" title="image_tooltip" /></td>
                              <td>Chef de Partie</td>
                              <td>58%</td>
                              <td>200%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image9.png" width="50" alt="alt_text" title="image_tooltip" /></td>
                              <td>Sous Chef</td>
                              <td>72%</td>
                              <td>225%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image12.png" width="50" alt="alt_text" title="image_tooltip" /></td>
                              <td>Three star chef</td>
                              <td>86%</td>
                              <td>250%</td>
                          </tr>
                      </table>

                      <h4>Chef events</h4>

                      <h5>Food inspector event</h5>

                      <p>
                          Since your chefs are “collaborating” with the <a href="#rats">rats</a>, they might be visited by the food inspector. He’ll prohibit your chef from cooking for 24 hours, this results in reduced
                          <strong>&nbsp;skill</strong> and <strong>freak</strong>.
                      </p>
                      <p>The more skilled your chef gets, the less likely he is to deal with the food inspector.</p>
                      <p>Events occur when you claim or unstake your chefs.</p>

                      <table>
                          <tr>
                              <td>Minimum skill level required</td>
                              <td>>15% (vegetable slicer)</td>
                          </tr>
                          <tr>
                              <td>Probability of occurrence</td>
                              <td>2-12% every unstake or claim, depending on skill level</td>
                          </tr>
                          <tr>
                              <td>Formula of occurrence:</td>
                              <td>((skill-100)/-1000)+0.02</td>
                          </tr>
                          <tr>
                              <td>Outcome 1</td>
                              <td>skill: 10% subtracted</td>
                          </tr>
                          <tr>
                              <td>Outcome 2</td>
                              <td>freak: 25% subtracted</td>
                          </tr>
                      </table>

                      <div>Probability of occurrence:</div>

                      <table>
                          <tr>
                              <th>Skill level</th>
                              <th>Risk of being visited by the food inspector</th>
                          </tr>
                          <tr>
                              <td>0%</td>
                              <td><del>12%</del> 0% (ignored below 15%)</td>
                          </tr>
                          <tr>
                              <td>10%</td>
                              <td>11%</td>
                          </tr>
                          <tr>
                              <td>20%</td>
                              <td>10%</td>
                          </tr>
                          <tr>
                              <td>30%</td>
                              <td>9%</td>
                          </tr>
                          <tr>
                              <td>40%</td>
                              <td>8%</td>
                          </tr>
                          <tr>
                              <td>50%</td>
                              <td>7%</td>
                          </tr>
                          <tr>
                              <td>60%</td>
                              <td>6%</td>
                          </tr>
                          <tr>
                              <td>70%</td>
                              <td>5%</td>
                          </tr>
                          <tr>
                              <td>80%</td>
                              <td>4%</td>
                          </tr>
                          <tr>
                              <td>90%</td>
                              <td>3%</td>
                          </tr>
                          <tr>
                              <td>100%</td>
                              <td>2%</td>
                          </tr>
                      </table>

                      <h5>Burnout event</h5>

                      <p>
                          Overworking usually leads to exhaustion, fatigue and health problems. Chefs that are <strong>insane </strong>have a very high risk of suffering from burnout. Chefs with a higher <strong>skill</strong> level are
                          significantly more likely to avoid burnout.
                      </p>
                      <p>Letting your chef work too long while he’s <strong>insane</strong> bears the risk of him quitting his workplace and re-starting with<strong> 0 skill points</strong> as well as <strong>0 freak</strong> points.</p>
                      <p>Do not let that happen, be sure to send your Chefs to the <a href="#gym">Gym</a> to blow off steam and relax.</p>
                      <p>Events occur when you claim or unstake your chefs.</p>

                      <table>
                          <tr>
                              <td>Minimum freak level required</td>
                              <td>>86% (insane)</td>
                          </tr>
                          <tr>
                              <td>Probability of occurrence</td>
                              <td>27-2% every unstake or claim, depending on skill level</td>
                          </tr>
                          <tr>
                              <td>Formula of occurrence:</td>
                              <td>((skill-100)/-400)+0.02</td>
                          </tr>
                          <tr>
                              <td>Outcome 1</td>
                              <td>skill reduced to 0%</td>
                          </tr>
                          <tr>
                              <td>Outcome 2</td>
                              <td>freak reduced to 0%</td>
                          </tr>
                      </table>

                      <div>
                          Probability of occurrence:
                      </div>

                      <table>
                          <tr>
                              <th>Skill level</th>
                              <th>Risk of suffering from burnout</th>
                          </tr>
                          <tr>
                              <td>0%</td>
                              <td>27.00%</td>
                          </tr>
                          <tr>
                              <td>10%</td>
                              <td>24.50%</td>
                          </tr>
                          <tr>
                              <td>20%</td>
                              <td>22.00%</td>
                          </tr>
                          <tr>
                              <td>30%</td>
                              <td>19.50%</td>
                          </tr>
                          <tr>
                              <td>40%</td>
                              <td>17.00%</td>
                          </tr>
                          <tr>
                              <td>50%</td>
                              <td>14.50%</td>
                          </tr>
                          <tr>
                              <td>60%</td>
                              <td>12.00%</td>
                          </tr>
                          <tr>
                              <td>70%</td>
                              <td>9.50%</td>
                          </tr>
                          <tr>
                              <td>80%</td>
                              <td>7.00%</td>
                          </tr>
                          <tr>
                              <td>90%</td>
                              <td>4.50%</td>
                          </tr>
                          <tr>
                              <td>100%</td>
                              <td>2.00%</td>
                          </tr>
                      </table>

                      <h3 id="rats">Rats</h3>

                      <p>Rats are the villain characters in the game and can come with 5 different trait types:</p>
                      <ul className="whitepaper-ul">
                          <li>Tail: includes tail decorations or injured tails</li>
                          <li>Eyes: includes various sunglasses or laser eyes</li>
                          <li>Piercings: includes various head piercings, like nose and ear piercings</li>
                          <li>Hats: includes various headgear, like nightcaps or winter hats</li>
                          <li>Neck: includes different neck accessories,like ties or scarfs</li>
                      </ul>
                      <p><strong>10%</strong> of all mints are rats.</p>
                      <p>Rats eat and steal <strong>20%</strong> of the <a href="#chefs">Chefs</a> <a href="#tokens">$xFOOD</a> for their rat pack.</p>
                      <p>Rats come with two attributes, <strong>intelligence</strong> and <strong>body mass</strong>.</p>
                      <p><strong>Intelligence</strong> is an exclusively positive attribute, and describes your rats' ability to avoid rat traps from the <a href="#chefs">chef</a> with more confidence.</p>
                      <p>
                          Similar to the <a href="#chefs">chef</a>’s freak, <strong>body mass </strong>can either be a good or bad attribute: Rats start as <strong>anorexic </strong>and need to gain <strong>body mass</strong> in order to
                          eat and steal more <a href="#tokens">$xFOOD</a> for their pack. After some time, they’ll become <strong>athletic, </strong>which is the most perfect state for a rat. Athletic rats can steal the optimum of
                          <a href="#tokens">$xFOOD</a> per day from the <a href="#chefs">Chefs</a>. Rats that are thinner or heavier than <strong>athletic, </strong>are not as efficient when it comes to stealing from the
                          <a href="#chefs">chefs</a>.
                      </p>
                      <p>
                          Rats that are getting fat have several disadvantages: they are more sluggish and weak than their thinner fellow rats, thus they’re able to carry less food when staked into a <a href="#venues">kitchen</a>. Obese rats
                          have one distinct disadvantage. They are an easy target for the Chef’s <a href="#cats">cat</a>. Cats really love obese rats and won’t hesitate to kidnap them when they spot them.
                          <strong>A kidnapped rat will re-start with 0 intelligence points and 0 body mass points.</strong>
                      </p>
                      {
                        /*
                      <p>
                          As long as you have at least one obese rat staked and own at least one <a href="#chefs">chef</a>, you will be able to randomly receive one of the minted <a href="#cats">cats</a>, enabling you to use it to your
                          advantage.
                      </p>
                      */
                      }
                      <p>The rat's <strong>intelligence</strong> level is represented by the <strong>head</strong> while the <strong>body mass</strong> level is represented by the <strong>body</strong>.</p>
                      <p>Both attributes are displayed on a scale from 0 to 100%.</p>

                      <h4>List of intelligence levels</h4>

                      <table>
                          <tr>
                              <th>Image</th>
                              <th>Description</th>
                              <th>Numeric Value</th>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image3.png" width="" alt="alt_text" title="image_tooltip" /></td>
                              <td>braindead</td>
                              <td>0%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image1.png" width="" alt="alt_text" title="image_tooltip" /></td>
                              <td>stupid</td>
                              <td>15%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image18.png" width="" alt="alt_text" title="image_tooltip" /></td>
                              <td>foolish</td>
                              <td>28%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image26.png" width="" alt="alt_text" title="image_tooltip" /></td>
                              <td>average</td>
                              <td>42%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image6.png" width="" alt="alt_text" title="image_tooltip" /></td>
                              <td>bright</td>
                              <td>58%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image5.png" width="" alt="alt_text" title="image_tooltip" /></td>
                              <td>smart</td>
                              <td>72%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image15.png" width="" alt="alt_text" title="image_tooltip" /></td>
                              <td>genius</td>
                              <td>86%</td>
                          </tr>
                      </table>

                      <h4>List of body fat levels</h4>

                      <p>All bodies include the “smart” head for artistic sake:</p>

                      <table>
                          <tr>
                              <th>Image</th>
                              <th>Description</th>
                              <th>Numeric Value</th>
                              <th>$xFOOD earnings</th>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image22.png" width="100" alt="alt_text" title="image_tooltip" /></td>
                              <td>anorexic</td>
                              <td>0%</td>
                              <td>55%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image25.png" width="100" alt="alt_text" title="image_tooltip" /></td>
                              <td>skinny</td>
                              <td>15%</td>
                              <td>70%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image11.png" width="100" alt="alt_text" title="image_tooltip" /></td>
                              <td>lean</td>
                              <td>28%</td>
                              <td>85%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image32.png" width="100" alt="alt_text" title="image_tooltip" /></td>
                              <td>athletic</td>
                              <td>42%</td>
                              <td>100%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image24.png" width="100" alt="alt_text" title="image_tooltip" /></td>
                              <td>chubby</td>
                              <td>58%</td>
                              <td>90%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image29.png" width="100" alt="alt_text" title="image_tooltip" /></td>
                              <td>fat</td>
                              <td>72%</td>
                              <td>80%</td>
                          </tr>
                          <tr>
                              <td><img src="../assets/images/image2.png" width="100" alt="alt_text" title="image_tooltip" /></td>
                              <td>obese</td>
                              <td>86%</td>
                              <td>70%</td>
                          </tr>
                      </table>

                      <h4>Rat events</h4>

                      <h5>Rat trap event</h5>

                      <p>
                          Not all <a href="#chefs">chefs</a> like the fact that there has been a deal to give away 20% of all <a href="#tokens">$xFOOD</a> produced, so some of them set up rat traps. Getting stuck in a trap is very stressful
                          for rats so they’re losing both <strong>body mass</strong> and <strong>intelligence</strong> points while being trapped. Smarter rats are able to avoid rat traps more often.
                      </p>
                      <p>Events occur when you claim or unstake your rats.</p>

                      <table>
                          <tr>
                              <td>Minimum intelligence level required</td>
                              <td>>15% (skinny)</td>
                          </tr>
                          <tr>
                              <td>Probability of occurrence</td>
                              <td>2-12% every unstake or claim, depending on intelligence level</td>
                          </tr>
                          <tr>
                              <td>Formula of occurrence:</td>
                              <td>((intelligence-100)/-1000)+0.02</td>
                          </tr>
                          <tr>
                              <td>Outcome 1</td>
                              <td>body mass: 50% subtracted</td>
                          </tr>
                          <tr>
                              <td>Outcome 2</td>
                              <td>intelligence: 10% subtracted</td>
                          </tr>
                      </table>

                      <div>Probability of occurrence:</div>

                      <table>
                          <tr>
                              <th>Intelligence level</th>
                              <th>Risk of being caught in a rat trap</th>
                          </tr>
                          <tr>
                              <td>0%</td>
                              <td><del>12%</del> 0% (ignored below 15%)</td>
                          </tr>
                          <tr>
                              <td>10%</td>
                              <td>11%</td>
                          </tr>
                          <tr>
                              <td>20%</td>
                              <td>10%</td>
                          </tr>
                          <tr>
                              <td>30%</td>
                              <td>9%</td>
                          </tr>
                          <tr>
                              <td>40%</td>
                              <td>8%</td>
                          </tr>
                          <tr>
                              <td>50%</td>
                              <td>7%</td>
                          </tr>
                          <tr>
                              <td>60%</td>
                              <td>6%</td>
                          </tr>
                          <tr>
                              <td>70%</td>
                              <td>5%</td>
                          </tr>
                          <tr>
                              <td>80%</td>
                              <td>4%</td>
                          </tr>
                          <tr>
                              <td>90%</td>
                              <td>3%</td>
                          </tr>
                          <tr>
                              <td>100%</td>
                              <td>2%</td>
                          </tr>
                      </table>

                      <p></p>
                      <h5>Being caught by a cat event</h5>

                      <p>
                          Overweight and obese rats are very sluggish and weak. They move very slowly and it’s hard for them to avoid their natural enemies - <a href="#cats">cats</a>. Cats really love obese rats because they’re an easy
                          target. Smarter rats have a lower chance of getting spotted by cats.
                      </p>
                      <p>An obese rat caught by a cat suffers from total loss of <strong>intelligence</strong> and <strong>body mass</strong>.</p>
                      <p>Do not let that happen, be sure to send your rats to the <a href="#gym">Gym</a> where they can lose some fat!</p>
                      <p>Events occur when you claim or unstake your rats.</p>

                      <table>
                          <tr>
                              <td>Minimum body mass level required</td>
                              <td>>86% (obese)</td>
                          </tr>
                          <tr>
                              <td>Probability of occurrence</td>
                              <td>27-2% every unstake or claim, depending on skill level</td>
                          </tr>
                          <tr>
                              <td>Formula of occurrence:</td>
                              <td>((intelligence-100)/-400)+0.02</td>
                          </tr>
                          <tr>
                              <td>Outcome 1</td>
                              <td>intelligence reduced to 0%</td>
                          </tr>
                          <tr>
                              <td>Outcome 2</td>
                              <td>body mass reduced to 0%</td>
                          </tr>
                      </table>

                      <div>Probability of occurrence:</div>

                      <table>
                          <tr>
                              <th>Intelligence level</th>
                              <th>Risk of being caught by a cat</th>
                          </tr>
                          <tr>
                              <td>0%</td>
                              <td>27.00%</td>
                          </tr>
                          <tr>
                              <td>10%</td>
                              <td>24.50%</td>
                          </tr>
                          <tr>
                              <td>20%</td>
                              <td>22.00%</td>
                          </tr>
                          <tr>
                              <td>30%</td>
                              <td>19.50%</td>
                          </tr>
                          <tr>
                              <td>40%</td>
                              <td>17.00%</td>
                          </tr>
                          <tr>
                              <td>50%</td>
                              <td>14.50%</td>
                          </tr>
                          <tr>
                              <td>60%</td>
                              <td>12.00%</td>
                          </tr>
                          <tr>
                              <td>70%</td>
                              <td>9.50%</td>
                          </tr>
                          <tr>
                              <td>80%</td>
                              <td>7.00%</td>
                          </tr>
                          <tr>
                              <td>90%</td>
                              <td>4.50%</td>
                          </tr>
                          <tr>
                              <td>100%</td>
                              <td>2.00%</td>
                          </tr>
                      </table>

                      <h3 id="cats">Cats</h3>
                      <p>Cats will be added as playable characters in V2.</p>
                      {
                        /*
                      <p>
                          The third playable character is the cat. There are only 100 cats in the game and they can be minted for free only by insane <a href="#chefs">chefs</a>. A cat allows you to steal the loot from 5 random obese
                          &nbsp;<a href="#rats">rats</a> per day. After 10 days, the cat will seek a new home either at another random insane chef owner or to an obese rat owner with at least one chef (the freak level of the ‘add-on chef’ does
                          not matter in this case).
                      </p>
                      <p>The cat is designed to be the risk reward when playing bold by staking:</p>
                      <ul className="whitepaper-ul">
                          <li><strong>insane <a href="#chefs">chefs</a></strong> that can randomly suffer from burnout</li>
                          <li><strong>obese <a href="#rats">rats</a></strong> that can be randomly killed by a cat</li>
                      </ul>
                      <p>There are no events, attributes or traits for cats.</p>
                      */
                      }
                      <h2 id="contracts">Contract Addresses</h2>

                      { this.props.readContracts && this.props.readContracts.Character ? <table>
                          <tr>
                              <td><a href="#chefs">Chefs</a> / <a href="#rats">Rats</a> (Characters)</td>
                              <td>
                              { this.props.readContracts.Character ? this.props.readContracts.Character.address : null}
                              </td>
                          </tr>
                          <tr>
                              <td><a href="#mcstake">McStake</a></td>
                              <td>
                                { this.props.readContracts.McStake ? this.props.readContracts.McStake.address : null}
                              </td>
                          </tr>
                          <tr>
                              <td><a href="#thestakehouse">TheStakeHouse</a></td>
                              <td>
                                { this.props.readContracts.TheStakeHouse ? this.props.readContracts.TheStakeHouse.address : null}
                              </td>
                          </tr>
                          <tr>
                              <td><a href="#lestake">LeStake</a></td>
                              <td>
                              { this.props.readContracts.LeStake ? this.props.readContracts.LeStake.address : null}
                              </td>
                          </tr>
                          <tr>
                              <td><a href="#gym">Gym</a></td>
                              <td>
                                { this.props.readContracts.Gym ? this.props.readContracts.Gym.address : null}
                              </td>
                          </tr>
                          <tr>
                              <td><a href="#ffood">$FFOOD</a></td>
                              <td>
                                { this.props.readContracts.FastFood ? this.props.readContracts.FastFood.address : null}
                              </td>
                          </tr>
                          <tr>
                              <td><a href="#cfood">$CFOOD</a></td>
                              <td>
                              { this.props.readContracts.CasualFood ? this.props.readContracts.CasualFood.address : null}
                              </td>
                          </tr>
                          <tr>
                              <td><a href="#gfood">$GFOOD</a></td>
                              <td>
                              { this.props.readContracts.GourmetFood ? this.props.readContracts.GourmetFood.address : null}

                              </td>
                          </tr>
                          <tr>
                              <td><a href="#gfood">KitchenShop</a></td>
                              <td>
                              { this.props.readContracts.KitchenShop ? this.props.readContracts.KitchenShop.address : null}

                              </td>
                          </tr>
                      </table> : <p>TBD</p>}
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
