import config from '../config.js';

const CasualFoodLocalhost = require('./abis/localhost/CasualFood.json');
const CharacterLocalhost = require('./abis/localhost/Character.json');
const ClaimLocalhost = require('./abis/localhost/Claim.json');
const FastFoodLocalhost = require('./abis/localhost/FastFood.json');
const GourmetFoodLocalhost = require('./abis/localhost/GourmetFood.json');
const GymLocalhost = require('./abis/localhost/Gym.json');
const KitchenShopLocalhost = require('./abis/localhost/KitchenShop.json');
const LeStakeLocalhost = require('./abis/localhost/LeStake.json');
const McStakeLocalhost = require('./abis/localhost/McStake.json');
const MintLocalhost = require('./abis/localhost/Mint.json');
const TheStakeHouseLocalhost = require('./abis/localhost/TheStakeHouse.json');
const PaywallLocalhost = require('./abis/localhost/Paywall.json');


const CasualFoodMumbai = require('./abis/mumbai/CasualFood.json');
const CharacterMumbai = require('./abis/mumbai/Character.json');
const ClaimMumbai = require('./abis/mumbai/Claim.json');
const FastFoodMumbai = require('./abis/mumbai/FastFood.json');
const GourmetFoodMumbai = require('./abis/mumbai/GourmetFood.json');
const GymMumbai = require('./abis/mumbai/Gym.json');
const KitchenShopMumbai = require('./abis/mumbai/KitchenShop.json');
const LeStakeMumbai = require('./abis/mumbai/LeStake.json');
const McStakeMumbai = require('./abis/mumbai/McStake.json');
const MintMumbai = require('./abis/mumbai/Mint.json');
const TheStakeHouseMumbai = require('./abis/mumbai/TheStakeHouse.json');
const PaywallMumbai = require('./abis/mumbai/Paywall.json');


export const contracts = {
  1337: {
    "localhost": {
      "name": "localhost",
      "chainId": "1337",
      "contracts": {
        "Character": {
          "address": config.localhost.Character,
          "abi": CharacterLocalhost
        },
        "McStake": {
          "address": config.localhost.McStake,
          "abi": McStakeLocalhost,
        },
        "Gym": {
          "address": config.localhost.Gym,
          "abi": GymLocalhost,
        },
        "Mint": {
          "address": config.localhost.Mint,
          "abi": MintLocalhost,
        },
        "Claim": {
          "address": config.localhost.Claim,
          "abi": ClaimLocalhost,
        },
        "Paywall": {
          "address": config.localhost.Paywall,
          "abi": PaywallLocalhost,
        },
        "FastFood": {
          "address": config.localhost.FastFood,
          "abi": FastFoodLocalhost,
        },
        "CasualFood": {
          "address": config.localhost.CasualFood,
          "abi": CasualFoodLocalhost,
        },
        "GourmetFood": {
          "address": config.localhost.GourmetFood,
          "abi": GourmetFoodLocalhost,
        },
        "KitchenShop": {
          "address": config.localhost.KitchenShop,
          "abi": KitchenShopLocalhost,
        },
        "TheStakeHouse": {
          "address": config.localhost.TheStakeHouse,
          "abi": TheStakeHouseLocalhost,
        },
        "LeStake": {
          "address": config.localhost.LeStake,
          "abi": LeStakeLocalhost,
        }
      }
    }
  },
  80001: {
    "mumbai": {
      "name": "mumbai",
      "chainId": "80001",
      "contracts": {
        "Character": {
          "address": config.mumbai.Character,
          "abi": CharacterMumbai,
        },
        "McStake": {
          "address": config.mumbai.McStake,
          "abi": McStakeMumbai,
        },
        "Gym": {
          "address": config.mumbai.Gym,
          "abi": GymMumbai,
        },
        "FastFood": {
          "address": config.mumbai.FastFood,
          "abi": FastFoodMumbai,
        },
        "Mint": {
          "address": config.mumbai.Mint,
          "abi": MintMumbai,
        },
        "Claim": {
          "address": config.mumbai.Claim,
          "abi": ClaimMumbai,
        },
        "Paywall": {
          "address": config.mumbai.Paywall,
          "abi": PaywallMumbai,
        },
        "CasualFood": {
          "address": config.mumbai.CasualFood,
          "abi": CasualFoodMumbai,
        },
        "GourmetFood": {
          "address": config.mumbai.GourmetFood,
          "abi": GourmetFoodMumbai,
        },
        "KitchenShop": {
          "address": config.mumbai.KitchenShop,
          "abi": KitchenShopMumbai,
        },
        "TheStakeHouse": {
          "address": config.mumbai.TheStakeHouse,
          "abi": TheStakeHouseMumbai,
        },
        "LeStake": {
          "address": config.mumbai.LeStake,
          "abi": LeStakeMumbai,
        }
      }
    }
  }
}
