const contractListPromise = import("../contracts/hardhat_contracts.json");

const contracts = require("../contracts/contracts.js");
// @ts-ignore
const externalContractsPromise = import("../contracts/external_contracts");

export const loadAppContracts = async () => {
  const config = {};
  config.deployedContracts = contracts.contracts ?? {};
  config.externalContracts = (await externalContractsPromise).default ?? {};
  return config;
};
