import { Signer } from 'ethers'
import { EntryPoint__factory } from '../typechain'
import { PackedUserOperationStruct } from '../typechain/contracts/core/EntryPoint'

export const localUserOpSender = (
  entryPointAddress: string,
  signer: Signer
): ((op: PackedUserOperationStruct) => Promise<string>) => {
  const entryPoint = EntryPoint__factory.connect(entryPointAddress, signer)

  return async (op: PackedUserOperationStruct) => {
    const tx = await entryPoint.handleOps([op], await signer.getAddress())
    await tx.wait()
    return tx.hash
  }
}
