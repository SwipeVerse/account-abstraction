import { ethers } from 'ethers'
import { SimpleAccountFactory__factory } from '../typechain'

export async function getSimpleAccountAddress(
  factoryAddress: string,
  owner: string,
  provider: ethers.providers.Provider,
  index: number = 0
): Promise<string> {
  const factory = SimpleAccountFactory__factory.connect(
    factoryAddress,
    provider
  )
  const address = await factory.getAddress(owner, index)
  return address
}
