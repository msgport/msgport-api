import { ethers } from "ethers";
import { getContract, estimateGas } from "../chainsUtils";
import { FeestimiError } from "../errors";
import { IEstimateFee } from "../interfaces/IEstimateFee";
import { ormpLineAddresses, ormpAddresses } from "./addresses";

const srcOrmpLineAbi = [
  "function fee(uint256 toChainId, address toDapp, bytes calldata message, bytes calldata params) external view returns (uint256)"
];

const buildEstimateFee = () => {
  const estimateFee: IEstimateFee = async (
    fromChainId,
    toChainId,
    payload,
    fromUAAddress,
    toUAAddress,
    refundAddress,
    gasLimit,
  ) => {
    const srcOrmpLineAddress = ormpLineAddresses[fromChainId];
    if (!srcOrmpLineAddress) {
      throw new FeestimiError(`srcOrmpLineAddress not found`, {
        context: { fromChainId },
      });
    }
    if (!toUAAddress) {
      throw new FeestimiError(`toUAAddress not found`, {
        context: { toChainId },
      });
    }
    console.log(
      `fromChain: ${fromChainId}, toChain: ${toChainId}`
    );
    console.log(
      `srcOrmpLineAddress: ${srcOrmpLineAddress}`
    );
    console.log(`target UA Address: ${toUAAddress}`);

    const fullPayload = buildFullPayload(fromUAAddress, toUAAddress, payload);
    console.log(`fullPayload: ${fullPayload}`);
    if (!gasLimit) {
      const tgtOrmpLineAddress = ormpLineAddresses[toChainId];
      const tgtOrmpAddress = ormpAddresses[toChainId];
      console.log(`tgtOrmpAddress: ${tgtOrmpAddress}`)
      console.log(`tgtOrmpLineAddress: ${tgtOrmpLineAddress}`);
      gasLimit = await estimateGas(toChainId, tgtOrmpAddress, tgtOrmpLineAddress, fullPayload);
      console.log(`fullPayload(tgtOrmpLineAddress.recv)'s gasLimit estimated: ${gasLimit}`)
    }
    const paramsStr = buildParamsStr(gasLimit, refundAddress)

    const ormpLine = await getContract(
      fromChainId,
      srcOrmpLineAbi,
      srcOrmpLineAddress
    );

    const fee = await ormpLine.fee(
      toChainId,
      toUAAddress,
      fullPayload,
      paramsStr
    );
    return [fee.toString(), paramsStr]
  };

  return estimateFee;
};

function buildFullPayload(fromDappAddress: string, toDappAddress: string, payload: string) {
  // https://github.com/darwinia-network/darwinia-msgport/blob/12278bdbe58c2c464ce550a2cf23c8dc9949f741/contracts/lines/ORMPLine.sol#L33
  // bytes memory encoded = abi.encodeWithSelector(ORMPLine.recv.selector, fromDapp, toDapp, message);
  return "0x394d1bca" + ethers.utils.defaultAbiCoder.encode(
    ["address", "address", "bytes"],
    [fromDappAddress, toDappAddress, payload]
  ).slice(2);
}

function buildParamsStr(gasLimit: number, refundAddress: string) {
  return ethers.utils.defaultAbiCoder.encode(["uint256", "address", "bytes"], [gasLimit, refundAddress, "0x"])
  // return ethers.utils.solidityPack(["uint256", "address", "bytes"], [gasLimit, refundAddress, "0x"])
}

export default buildEstimateFee;
