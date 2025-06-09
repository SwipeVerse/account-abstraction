import { ethers } from 'hardhat'
import { AASigner, localUserOpSender } from './AASigner'
import { EntryPoint__factory } from '../typechain'
import '../test/aa.init'
import { parseEther } from 'ethers/lib/utils'

const createAccount = async (
  accountFactoryAddress: string,
  entryPointAddress: string,
  privateKey: string
): Promise<string> => {
  const provider = ethers.provider

  const wallet = new ethers.Wallet(privateKey, provider)
  const ethersSigner = wallet.connect(provider)

  const sendUserOp = localUserOpSender(entryPointAddress, ethersSigner)
  const index = parseInt(process.env.AA_INDEX ?? '0')
  const aaSigner = new AASigner(
    ethersSigner,
    entryPointAddress,
    sendUserOp,
    accountFactoryAddress,
    index
  )

  const smartAccountAddress = await aaSigner.getAddress()
  console.log('Predicted Smart Account Address:', smartAccountAddress)

  const balance = await provider.getBalance(smartAccountAddress)
  if (balance.lt(parseEther('0.01'))) {
    console.log('Prefunding smart account...')
    await ethersSigner.sendTransaction({
      to: smartAccountAddress,
      value: parseEther('0.01')
    })
  }

  const entryPoint = EntryPoint__factory.connect(
    entryPointAddress,
    ethersSigner
  )
  let deposit = await entryPoint.balanceOf(smartAccountAddress)
  if (deposit.lt(parseEther('0.005'))) {
    console.log('Depositing to EntryPoint...')
    await entryPoint.depositTo(smartAccountAddress, {
      value: parseEther('0.001')
    })
    deposit = await entryPoint.balanceOf(smartAccountAddress)
  }

  console.log('Smart Account ready at:', smartAccountAddress)
  console.log(
    'Balance:',
    (await provider.getBalance(smartAccountAddress)).toString()
  )
  console.log('EntryPoint deposit:', deposit.toString())

  return smartAccountAddress
}

export { createAccount }
