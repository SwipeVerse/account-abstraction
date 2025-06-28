import { Signer, ethers } from 'ethers'
import { EntryPoint__factory } from '../typechain'
import { PackedUserOperationStruct } from '../typechain/contracts/core/EntryPoint'

export const localUserOpSender = (
  entryPointAddress: string,
  signer: Signer
): ((op: PackedUserOperationStruct) => Promise<string>) => {
  const entryPoint = new ethers.Contract(
    entryPointAddress,
    EntryPoint__factory.abi,
    signer
  )

  return async (op: PackedUserOperationStruct) => {
    const tx = await entryPoint.handleOps([op], await signer.getAddress())
    await tx.wait()
    return tx.hash
  }
}
