import { ethers, providers } from 'ethers'
import { AASigner, rpcUserOpSender } from './AASigner'

export async function getSimpleAccountAddress(
  privateKey: string,
  provider: providers.JsonRpcProvider,
  entryPointAddress: string,
  accountFactoryAddress: string
): Promise<string> {
  const wallet = new ethers.Wallet(privateKey, provider)
  const ethersSigner = wallet.connect(provider)

  const sendUserOp = rpcUserOpSender(provider, entryPointAddress)
  const index = parseInt(process.env.AA_INDEX ?? '0')
  const aaSigner = new AASigner(
    ethersSigner,
    entryPointAddress,
    sendUserOp,
    accountFactoryAddress,
    index
  )

  const smartAccountAddress = await aaSigner.getAddress()
  return smartAccountAddress
}
