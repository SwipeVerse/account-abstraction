import { ethers, providers } from 'ethers'

export async function getSimpleAccountAddress(
  privateKey: string,
  provider: providers.JsonRpcProvider
): Promise<string> {
  const wallet = new ethers.Wallet(privateKey, provider)

  const owner = await wallet.getAddress()

  return owner
}
