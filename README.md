# feestimi

issue for the [spec](https://github.com/darwinia-network/darwinia-msgport/issues/66).

## Run for dev

0. clone this repo to your local.
1. `npm install`
2. `npm run start:dev`

```bash
curl 'http://localhost:3001/layerzero/estimate_fee?from_chain_id=97&to_chain_id=1287&gas_limit=300000&payload=0x12345678'
curl 'http://localhost:3001/axelar/estimate_fee?from_chain_id=97&to_chain_id=1287&gas_limit=300000'
```