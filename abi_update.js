const fs = require('fs');
const network = 'matic';
(async () => {
  const contracts = ['Character', 'McStake', 'TheStakeHouse', 'LeStake',
  'Gym', 'Mint', 'Claim', 'FastFood', 'CasualFood', 'GourmetFood', 'KitchenShop', 'PayWall', 'KitchenUsage', 'Config'];

  const copyAbi = (contract) => {
    const path = `../ratalert-contracts/build/contracts/${contract}.json`;
    if (fs.existsSync(path)) {
      let file = fs.readFileSync(path).toString();
      file = JSON.parse(file);
      if (file.abi) {
        const abi = file.abi;
        const destination = `./src/contracts/abis/${network}/${contract}.json`;
        console.log(`Writing ABI for ${destination}`);
        fs.writeFileSync(destination, JSON.stringify(abi), "utf8");
      }
    } else {
      console.log(`Could not read ${path}`);
    }
  }

  contracts.map(async(c) => {
    await copyAbi(c);
  })
})();
