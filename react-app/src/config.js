let config;
export default config = {
  localhost: {
    ChefRat: '0xB37518b874F606bbcbfC3049fe2Efe0f81129c07',
    KitchenPack: '0xC6aE929bCA4c8914738E3675eEd998be8fB2b4aF',
    FastFood: '0xB09F74A9969e8AAFECe79558Cf02bCB7f8398de1',
    graph: `${process.env.REACT_APP_GRAPH_URI}/subgraphs/name/ChefRat`,
  },
  mainnet: {
    ChefRat: '0xB37518b874F606bbcbfC3049fe2Efe0f81129c07',
    KitchenPack: '0xC6aE929bCA4c8914738E3675eEd998be8fB2b4aF',
    FastFood: '0xB09F74A9969e8AAFECe79558Cf02bCB7f8398de1',
    graph: `${process.env.REACT_APP_GRAPH_URI}/subgraphs/name/ChefRat`,
  },
  rinkeby: {
    ChefRat: '0xB37518b874F606bbcbfC3049fe2Efe0f81129c07',
    KitchenPack: '0xC6aE929bCA4c8914738E3675eEd998be8fB2b4aF',
    FastFood: '0xB09F74A9969e8AAFECe79558Cf02bCB7f8398de1',
    graph: `${process.env.REACT_APP_GRAPH_URI}/subgraphs/name/ChefRat`,
  }
}
