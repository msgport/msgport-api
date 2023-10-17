import { ethers } from "ethers";
import { getContract } from "../chainsUtils";
import { FeestimiError } from "../errors";
import { IEstimateFee } from "../interfaces/IEstimateFee";

const ormpEndpointAddresses: { [key: number]: string } = {
  421613: "0x0000000000BD9dcFDa5C60697039E2b3B28b079b",
  43: "0x0000000000BD9dcFDa5C60697039E2b3B28b079b",
};
const OrmpEndpointAbi = [
  "function fee(uint256 toChainId, address toUA, bytes calldata encoded, bytes calldata params) external view returns (uint256)"
];

const buildEstimateFee = () => {
  const estimateFee: IEstimateFee = async (
    fromChainId,
    toChainId,
    gasLimit,
    payload,
    fromDappAddress,
    toDappAddress
  ) => {
    const ormpFromEndpointAddress = ormpEndpointAddresses[fromChainId];
    if (!ormpFromEndpointAddress) {
      throw new FeestimiError(`ormpFromEndpointAddress not found`, {
        context: { fromChainId },
      });
    }
    if (!toDappAddress) {
      throw new FeestimiError(`toDappAddress not found`, {
        context: { toChainId },
      });
    }
    console.log(
      `Layerzero estimate fee fromChain: ${fromChainId}, toChain: ${toChainId}`
    );
    console.log(
      `Layerzero estimate fee fromEndpointAddress: ${ormpFromEndpointAddress}`
    );
    console.log(`toDappAddress: ${toDappAddress}`);

    const endpoint = await getContract(
      fromChainId,
      OrmpEndpointAbi,
      ormpFromEndpointAddress
    );

    const paramsStr = params(gasLimit);
    const ormpFee = await endpoint.fee(
      toChainId,
      toDappAddress,
      fullPayload(fromDappAddress, toDappAddress, payload),
      paramsStr
    );
    return [ormpFee.toString(), paramsStr]
  };

  return estimateFee;
};

function fullPayload(fromDappAddress: string, toDappAddress: string, payload: string) {
  // https://github.com/darwinia-network/darwinia-msgport/blob/12278bdbe58c2c464ce550a2cf23c8dc9949f741/contracts/lines/ORMPLine.sol#L33
  // bytes memory encoded = abi.encodeWithSelector(ORMPLine.recv.selector, fromDapp, toDapp, message);
  return "0x394d1bca" + ethers.utils.defaultAbiCoder.encode(
    ["address", "address", "bytes"],
    [fromDappAddress, toDappAddress, payload]
  ).slice(2);
}

function params(gasLimit: number) {
  return ethers.utils.solidityPack(["uint256"], [gasLimit]);
}

export default buildEstimateFee;
