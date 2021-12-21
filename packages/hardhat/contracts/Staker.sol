pragma solidity >=0.6.0 <0.7.0;

import "hardhat/console.sol";
import "./ExampleExternalContract.sol";

contract Staker {

  // External contract that will old stacked funds
  ExampleExternalContract public exampleExternalContract;

  // Balances of the user's stacked funds
  mapping(address => uint256) public balances;

  // Staking threshold
  uint256 public constant threshold = 1 ether;

  // Contract's Events
  event Stake(address indexed sender, uint256 amount);

  /**
  * @notice Contract Constructor
  * @param exampleExternalContractAddress Address of the external contract that will hold stacked funds
  */
  constructor(address exampleExternalContractAddress) public {
    exampleExternalContract = ExampleExternalContract(exampleExternalContractAddress);
  }

  /**
  * @notice Stake method that update the user's balance
  */
  function stake() public payable {
    // update the user's balance
    balances[msg.sender] += msg.value;

    // emit the event to notify the blockchain that we have correctly Staked some fund for the user
    emit Stake(msg.sender, msg.value);
  }

}
