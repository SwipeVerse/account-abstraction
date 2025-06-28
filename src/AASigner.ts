import { TransactionResponse } from '@ethersproject/abstract-provider'
// import { TransactionReceipt } from '@ethersproject/abstract-provider/src.ts/index'
import { BytesLike, hexConcat, hexValue } from '@ethersproject/bytes'
import { Deferrable } from '@ethersproject/properties'
import {
  BaseProvider,
  Provider,
  TransactionRequest
} from '@ethersproject/providers'
import { Bytes, ethers, Signer } from 'ethers'
import { UserOperation } from '../test/UserOperation'
import {
  EntryPoint,
  EntryPoint__factory,
  SimpleAccount,
  SimpleAccountFactory,
  SimpleAccountFactory__factory,
  SimpleAccount__factory
} from '../typechain'

export type SendUserOp = (
  userOp: UserOperation
) => Promise<TransactionResponse | undefined>

export async function getAccountAddress(
  owner: string,
  factory: SimpleAccountFactory,
  salt = 0
): Promise<string> {
  return await factory.getAddress(owner, salt)
}

export function getAccountInitCode(
  owner: string,
  factory: SimpleAccountFactory,
  salt = 0
): BytesLike {
  return hexConcat([
    factory.address,
    factory.interface.encodeFunctionData('createAccount', [owner, salt])
  ])
}

export const debug = process.env.DEBUG != null

/**
 * send a request using rpc.
 *
 * @param provider - rpc provider that supports "eth_sendUserOperation"
 */
export function rpcUserOpSender(
  provider: ethers.providers.JsonRpcProvider,
  entryPointAddress: string
): SendUserOp {
  let chainId: number

  return async function (userOp) {
    if (debug) {
      console.log(
        'sending eth_sendUserOperation',
        {
          ...userOp,
          initCode: (userOp.initCode ?? '').length,
          callData: (userOp.callData ?? '').length
        },
        entryPointAddress
      )
    }
    if (chainId === undefined) {
      chainId = await provider.getNetwork().then((net) => net.chainId)
    }

    const cleanUserOp = Object.keys(userOp)
      .map((key) => {
        let val = (userOp as any)[key]
        if (typeof val !== 'string' || !val.startsWith('0x')) {
          val = hexValue(val)
        }
        return [key, val]
      })
      .reduce((set, [k, v]) => ({ ...set, [k]: v }), {})
    await provider
      .send('eth_sendUserOperation', [cleanUserOp, entryPointAddress])
      .catch((e) => {
        throw e.error ?? e
      })
    return undefined
  }
}

export class AAProvider extends BaseProvider {
  private readonly entryPoint: EntryPoint

  constructor(entryPointAddress: string, provider: Provider) {
    super(provider.getNetwork())
    this.entryPoint = EntryPoint__factory.connect(entryPointAddress, provider)
  }
}

/**
 * a signer that wraps account-abstraction.
 */
export class AASigner extends Signer {
  _account?: SimpleAccount

  private _isPhantom = true
  public entryPoint: EntryPoint
  public accountFactory: SimpleAccountFactory

  private _chainId: Promise<number> | undefined

  /**
   * create account abstraction signer
   * @param signer - the underlying signer. has no funds (=can't send TXs)
   * @param entryPoint the entryPoint contract. used for read-only operations
   * @param sendUserOp function to actually send the UserOp to the entryPoint.
   * @param index - index of this account for this signer.
   */
  constructor(
    readonly signer: Signer,
    readonly entryPointAddress: string,
    readonly sendUserOp: SendUserOp,
    readonly accountFactoryAddress: string,
    readonly index = 0,
    readonly provider = signer.provider
  ) {
    super()
    this.entryPoint = EntryPoint__factory.connect(entryPointAddress, signer)
    this.accountFactory = SimpleAccountFactory__factory.connect(
      accountFactoryAddress,
      signer
    )
  }

  // connect to a specific pre-deployed address
  // (note: in order to send transactions, the underlying signer address must be valid signer for this account (its owner)
  async connectAccountAddress(address: string): Promise<void> {
    if (this._account != null) {
      throw Error('already connected to account')
    }
    if (
      (await this.provider!.getCode(address).then((code) => code.length)) <= 2
    ) {
      throw new Error('cannot connect to non-existing contract')
    }
    this._account = SimpleAccount__factory.connect(address, this.signer)
    this._isPhantom = false
  }

  connect(provider: Provider): Signer {
    throw new Error('connect not implemented')
  }

  async getAddress(): Promise<string> {
    await this.syncAccount()
    return this._account!.address
  }

  async signMessage(message: Bytes | string): Promise<string> {
    throw new Error('signMessage: unsupported by AA')
  }

  async signTransaction(
    transaction: Deferrable<TransactionRequest>
  ): Promise<string> {
    throw new Error('signMessage: unsupported by AA')
  }

  async getAccount(): Promise<SimpleAccount> {
    await this.syncAccount()
    return this._account!
  }

  async syncAccount(): Promise<void> {
    if (this._account == null) {
      const address = await getAccountAddress(
        await this.signer.getAddress(),
        this.accountFactory
      )
      this._account = SimpleAccount__factory.connect(address, this.signer)
    }

    this._chainId = this.provider?.getNetwork().then((net) => net.chainId)
    // once an account is deployed, it can no longer be a phantom.
    // but until then, we need to re-check
    if (this._isPhantom) {
      const size = await this.signer.provider
        ?.getCode(this._account.address)
        .then((x) => x.length)
      // console.log(`== __isPhantom. addr=${this._account.address} re-checking code size. result = `, size)
      this._isPhantom = size === 2
      // !await this.entryPoint.isContractDeployed(await this.getAddress());
    }
  }

  // return true if account not yet created.
  async isPhantom(): Promise<boolean> {
    await this.syncAccount()
    return this._isPhantom
  }
}
