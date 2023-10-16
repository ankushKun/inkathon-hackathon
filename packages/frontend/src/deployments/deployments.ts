import { env } from '@config/environment'
import { SubstrateDeployment } from '@scio-labs/use-inkathon'
// import * as depl from "@inkathon/contracts/deployments/market/alephzero-testnet"

export enum ContractIds {
  Market = 'market',
}

export const getDeployments = async (): Promise<SubstrateDeployment[]> => {
  const networks = env.supportedChains
  const deployments = networks
    .map(async (network) => [
      {
        contractId: ContractIds.Market,
        networkId: network,
        abi: await import(`@inkathon/contracts/deployments/market/metadata.json`),
        // address: (await import(`@inkathon/contracts/deployments/market/${network}`)).address,
        address: (await import(`@inkathon/contracts/deployments/market/alephzero-testnet`)).address,
      },
    ])
    .reduce(async (acc, curr) => [...(await acc), ...(await curr)], [] as any)

  return deployments
}
