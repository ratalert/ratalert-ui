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
const KitchenUsageLocalhost = require('./abis/localhost/KitchenUsage.json');
const ConfigLocalhost = require('./abis/localhost/Config.json');
const TripleFiveClubLocalhost = require('./abis/matic/TripleFiveClub.json');


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
const KitchenUsageMumbai = require('./abis/mumbai/KitchenUsage.json');
const ConfigMumbai = require('./abis/mumbai/Config.json');

const CasualFoodBeta = require('./abis/beta/CasualFood.json');
const CharacterBeta = require('./abis/beta/Character.json');
const ClaimBeta = require('./abis/beta/Claim.json');
const FastFoodBeta = require('./abis/beta/FastFood.json');
const GourmetFoodBeta = require('./abis/beta/GourmetFood.json');
const GymBeta = require('./abis/beta/Gym.json');
const KitchenShopBeta = require('./abis/beta/KitchenShop.json');
const LeStakeBeta = require('./abis/beta/LeStake.json');
const McStakeBeta = require('./abis/beta/McStake.json');
const MintBeta = require('./abis/beta/Mint.json');
const TheStakeHouseBeta = require('./abis/beta/TheStakeHouse.json');
const PaywallBeta = require('./abis/beta/Paywall.json');
const KitchenUsageBeta = require('./abis/beta/KitchenUsage.json');
const ConfigBeta = require('./abis/beta/Config.json');


const CasualFoodMatic = require('./abis/matic/CasualFood.json');
const CharacterMatic = require('./abis/matic/Character.json');
const ClaimMatic = require('./abis/matic/Claim.json');
const FastFoodMatic = require('./abis/matic/FastFood.json');
const GourmetFoodMatic = require('./abis/matic/GourmetFood.json');
const GymMatic = require('./abis/matic/Gym.json');
const KitchenShopMatic = require('./abis/matic/KitchenShop.json');
const LeStakeMatic = require('./abis/matic/LeStake.json');
const McStakeMatic = require('./abis/matic/McStake.json');
const MintMatic = require('./abis/matic/Mint.json');
const TheStakeHouseMatic = require('./abis/matic/TheStakeHouse.json');
const PaywallMatic = require('./abis/matic/Paywall.json');
const KitchenUsageMatic = require('./abis/matic/KitchenUsage.json');
const ConfigMatic = require('./abis/matic/Config.json');
const TripleFiveClubMatic = require('./abis/matic/TripleFiveClub.json');


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
        },
        "KitchenUsage": {
          "address": config.localhost.KitchenUsage,
          "abi": KitchenUsageLocalhost,
        },
        "Config": {
          "address": config.localhost.Config,
          "abi": ConfigLocalhost,
        },
        "TripleFiveClub": {
          "address": config.localhost.TripleFiveClub,
          "abi": TripleFiveClubLocalhost,
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
        },
        "KitchenUsage": {
          "address": config.mumbai.KitchenUsage,
          "abi": KitchenUsageMumbai,
        },
        "Config": {
          "address": config.localhost.Config,
          "abi": ConfigMumbai,
        }
      }
    },
    /*
    "betaOld": {
      "name": "Beta",
      "chainId": "80001",
      "contracts": {
        "Character": {
          "address": config.beta.Character,
          "abi": CharacterBeta,
        },
        "McStake": {
          "address": config.beta.McStake,
          "abi": McStakeBeta,
        },
        "Gym": {
          "address": config.beta.Gym,
          "abi": GymBeta,
        },
        "FastFood": {
          "address": config.beta.FastFood,
          "abi": FastFoodBeta,
        },
        "Mint": {
          "address": config.beta.Mint,
          "abi": MintBeta,
        },
        "Claim": {
          "address": config.beta.Claim,
          "abi": ClaimBeta,
        },
        "Paywall": {
          "address": config.beta.Paywall,
          "abi": PaywallBeta,
        },
        "CasualFood": {
          "address": config.beta.CasualFood,
          "abi": CasualFoodBeta,
        },
        "GourmetFood": {
          "address": config.beta.GourmetFood,
          "abi": GourmetFoodBeta,
        },
        "KitchenShop": {
          "address": config.beta.KitchenShop,
          "abi": KitchenShopBeta,
        },
        "TheStakeHouse": {
          "address": config.beta.TheStakeHouse,
          "abi": TheStakeHouseBeta,
        },
        "LeStake": {
          "address": config.beta.LeStake,
          "abi": LeStakeBeta,
        },
        "KitchenUsage": {
          "address": config.beta.KitchenUsage,
          "abi": KitchenUsageBeta,
        },
        "Config": {
          "address": config.localhost.Config,
          "abi": ConfigBeta,
        }
      }
    },
    */
  },
  137: {
    "matic": {
      "name": "matci",
      "chainId": "138",
      "contracts": {
        "Character": {
          "address": config.matic.Character,
          "abi": CharacterMatic,
        },
        "McStake": {
          "address": config.matic.McStake,
          "abi": McStakeMatic,
        },
        "Gym": {
          "address": config.matic.Gym,
          "abi": GymMatic,
        },
        "FastFood": {
          "address": config.matic.FastFood,
          "abi": FastFoodMatic,
        },
        "Mint": {
          "address": config.matic.Mint,
          "abi": MintMatic,
        },
        "Claim": {
          "address": config.matic.Claim,
          "abi": ClaimMatic,
        },
        "Paywall": {
          "address": config.matic.Paywall,
          "abi": PaywallMatic,
        },
        "CasualFood": {
          "address": config.matic.CasualFood,
          "abi": CasualFoodMatic,
        },
        "GourmetFood": {
          "address": config.matic.GourmetFood,
          "abi": GourmetFoodMatic,
        },
        "KitchenShop": {
          "address": config.matic.KitchenShop,
          "abi": KitchenShopMatic,
        },
        "TheStakeHouse": {
          "address": config.matic.TheStakeHouse,
          "abi": TheStakeHouseMatic,
        },
        "LeStake": {
          "address": config.matic.LeStake,
          "abi": LeStakeMatic,
        },
        "KitchenUsage": {
          "address": config.matic.KitchenUsage,
          "abi": KitchenUsageMatic,
        },
        "Config": {
          "address": config.matic.Config,
          "abi": ConfigMatic,
        },
        "TripleFiveClub": {
          "address": config.matic.TripleFiveClub,
          "abi": TripleFiveClubMatic,
        }
      }
    },
  }
}
