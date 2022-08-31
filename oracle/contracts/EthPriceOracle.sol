pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./CallerContractInterface.sol";
contract EthPriceOracle is AccessControl{

  // Create a new role identifier for the OWNERS role
  bytes32 public constant OWNERS = keccak256("OWNERS");

  // Create a new role identifier for the ORACLES role
  bytes32 public constant ORACLES = keccak256("ORACLES");

  uint private randNonce = 0;
  uint private modulus = 1000;
  uint private numOracles = 0;

  struct Response {
    address oracleAddress;
    address callerAddress;
    uint ethPrice;
  }

  mapping(uint256 => bool) pendingRequests;
  mapping(uint256 => Response[]) requestIdToResponse; // associate each request id to an array of structs containing oracleAddress, callerAddress, and ethPrice variables.

  event GetLatestEthPriceEvent(address callerAddress, uint id);
  event SetLatestEthPriceEvent(uint256 ethPrice, address callerAddress);
  event AddOracleEvent(address oracleAddress);
  event RemoveOracleEvent(address oracleAddress);

  constructor() {
    // Set the contract's creator as the Admin of all the Roles
    _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  // Only ADMIN can grant the ORACLES role to an address
  function addOracle(address _oracle) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(hasRole(ORACLES, _oracle), "Alrady an Oracle!");
    grantRole(ORACLES, _oracle);
    numOracles++;
    emit AddOracleEvent(_oracle);
  }
  // Only ADMIN can revoke the ORACLES role from an address
  function removeOracle(address _oracle) public onlyRole(DEFAULT_ADMIN_ROLE) {
    require(!hasRole(ORACLES, _oracle), "Not an Oracle");
    require(numOracles > 1, "Do not remove the last Oracle");
    revokeRole(ORACLES, _oracle);
    numOracles--;
    emit RemoveOracleEvent(_oracle);
  }
  function getLatestEthPrice() public returns (uint256) {
    randNonce++;
    uint id = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, randNonce))) % modulus;
    pendingRequests[id] = true;
    emit GetLatestEthPriceEvent(msg.sender, id);
    return id;
  }
  // Only addresses granted with the ORACLES role can update the ETH price
  function setLatestEthPrice(uint256 _ethPrice, address _callerAddress, uint256 _id) public onlyRole(ORACLES) {
    require(pendingRequests[_id], "This request is not in my pending list.");
    Response memory resp; // Declare a new instance of the Response struct. will be filled in thex next step and later will be stored permanently in the Response[] for the specific _id in the requestIdToResponse mapping
    resp = Response(msg.sender,_callerAddress,_ethPrice); // Initialize the Response instance with the corresponding information for this oracle's response
    requestIdToResponse[_id].push(resp);  // Push resp to the array stored at requestIdToResponse[_id].
    delete pendingRequests[_id];
    CallerContractInterface callerContractInstance;
    callerContractInstance = CallerContractInterface(_callerAddress);
    callerContractInstance.callback(_ethPrice,_id);
    emit SetLatestEthPriceEvent(_ethPrice, _callerAddress);
  }
}
