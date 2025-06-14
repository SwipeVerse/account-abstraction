import { providers, BigNumberish, BytesLike, Signer } from 'ethers';

declare const createAccount: (accountFactoryAddress: string, entryPointAddress: string, privateKey: string) => Promise<string>;

declare function getSimpleAccountAddress(privateKey: string, provider: providers.JsonRpcProvider, entryPointAddress: string, accountFactoryAddress: string): Promise<string>;

type PromiseOrValue<T> = T | Promise<T>;

type PackedUserOperationStruct = {
    sender: PromiseOrValue<string>;
    nonce: PromiseOrValue<BigNumberish>;
    initCode: PromiseOrValue<BytesLike>;
    callData: PromiseOrValue<BytesLike>;
    accountGasLimits: PromiseOrValue<BytesLike>;
    preVerificationGas: PromiseOrValue<BigNumberish>;
    gasFees: PromiseOrValue<BytesLike>;
    paymasterAndData: PromiseOrValue<BytesLike>;
    signature: PromiseOrValue<BytesLike>;
};

declare const localUserOpSender: (entryPointAddress: string, signer: Signer) => (op: PackedUserOperationStruct) => Promise<string>;

export { createAccount, getSimpleAccountAddress, localUserOpSender };
