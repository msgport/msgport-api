// https://khalilstemmler.com/blogs/typescript/node-starter-project/
import express, { Express, Request, Response } from 'express';
import chainIds from './chainIds';
import layerzeroBuildEstimateFee from "./layerzero/estimateFee";
import axelarBuildEstimateFee from "./axelar/estimateFee";

import { Environment } from "@axelar-network/axelarjs-sdk";

const axEstimateFee = axelarBuildEstimateFee(Environment.TESTNET);
const lzEstimateFee = layerzeroBuildEstimateFee()

const app: Express = express();
const port = 3001;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, Darwinia');
});

app.get('/chains', (req: Request, res: Response) => {
  res.send(chainIds);
});

/**
  * from_chain_id: string
  * to_chain_id: string
  * gas_limit: string
  * payload: string
  * from_address: string
  * to_address: string
  */
app.get('/:platform/estimate_fee', (req: Request, res: Response) => {
  const platform = req.params.platform;

  ///////////////////////////////////
  // Request Params
  ///////////////////////////////////
  const fromChainId = req.query.from_chain_id as string
  const toChainId = req.query.to_chain_id as string
  const gasLimit = req.query.gas_limit as string
  console.log(`fromChain: ${fromChainId}, toChain: ${toChainId}, gasLimit: ${gasLimit})`)
  if (!fromChainId || !toChainId || !gasLimit) {
    error(res, 400, `from_chain_id, to_chain_id and gas_limit are required`)
    return;
  }

  const payload: string = req.query.payload as string;
  const fromAddress: string = req.query.from_address as string;
  const toAddress: string = req.query.to_address as string;
  console.log(`payload: ${payload}, fromAddress: ${fromAddress}, toAddress: ${toAddress})`)
  if (platform == 'layerzero') {
    if (!payload) {
      error(res, 400, `payload is required for layerzero`)
      return;
    }
  }

  ///////////////////////////////////
  // Estimate Fees
  ///////////////////////////////////
  const fromChainIdInt = parseInt(fromChainId)
  const toChainIdInt = parseInt(toChainId)
  const gasLimitInt = parseInt(gasLimit)

  if (platform == 'layerzero') {
    lzEstimateFee(
      fromChainIdInt,
      toChainIdInt,
      gasLimitInt,
      payload,
      fromAddress
    ).then((result) => {
      ok(res, result)
    })
  } else if (platform == 'axelar') {
    axEstimateFee(
      fromChainIdInt,
      toChainIdInt,
      gasLimitInt
    ).then((result) => {
      ok(res, result)
    })
  } else {
    error(res, 400, 'Unsupported platform')
  }
  // const promises = []
  // promises.push(
  // )
  // Promise.all(promises).then((values) => {
  //   const result = values.reduce(
  //     (acc, v) => {
  //       return {
  //         ...acc,
  //         ...v
  //       }
  //     },
  //     {}
  //   )
  //   res.send(result)
  // });
});

function ok(res: Response, result: any) {
  res.send({
    code: 0,
    data: result
  })
}

function error(res: Response, status: number, message: string) {
  res.status(status).send(
    {
      code: 1,
      message: message
    }
  )
}

app.listen(port, () => {
  console.log(`[Server]: I am running at https://localhost:${port}`);
});
