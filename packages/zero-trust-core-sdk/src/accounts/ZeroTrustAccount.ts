import { Contract, ethers } from "ethers";
import ENTRY_POINT_ABI from "../abis/EntryPoint.json";
import ZERO_TRUST_ACCOUNT_ABI from "../abis/ZeroTrustAccount.json";
import ZERO_TRUST_ACCOUNT_FACTORY_ABI from "../abis/ZeroTrustAccountFactory.json";
import { logger } from "../logger";
import {
	TEntryPoint,
	TZeroTrustAccount,
	TZeroTrustAccountFactory,
} from "../types";
import { getNonceValue } from "../utils";
import { Passkey } from "../passkeys";
import { ISessionAccount } from "../types/ZeroTrustAccount";

export type PasskeyMetaInfo = {
	pubKeyX: string;
	pubKeyY: string;
	salt: number;
	credentialId: string | Uint8Array;
};

export class ZeroTrustAccount {
	private _provider: ethers.Provider;
	private _entryPoint: TEntryPoint;
	private _passkeyMetaInfo: PasskeyMetaInfo;
	private _zeroTrustAccountFactoryAddress: string;
	private _zeroTrustAccountFactory: TZeroTrustAccountFactory;

	/**
	 * @notice Create ZeroTrustAccount instance to interact with
	 * @param provider provider to use
	 */
	constructor(
		provider: ethers.Provider,
		entryPointAddress: string,
		accountFactoryAddress: string,
		passkeyMetaInfo: PasskeyMetaInfo,
	) {
		this._passkeyMetaInfo = passkeyMetaInfo;
		this._zeroTrustAccountFactoryAddress = accountFactoryAddress;
		this._provider = provider;
		this._zeroTrustAccountFactory = new Contract(
			accountFactoryAddress,
			ZERO_TRUST_ACCOUNT_FACTORY_ABI,
			this._provider,
		) as unknown as TZeroTrustAccountFactory;
		this._entryPoint = new Contract(
			entryPointAddress,
			ENTRY_POINT_ABI,
			this._provider,
		) as unknown as TEntryPoint;
	}

	getEntryPointContract():TEntryPoint{
		return this._entryPoint;
	}

	getInitCode(): string {
		const initCode = ethers.concat([
			this._zeroTrustAccountFactoryAddress,
			this._zeroTrustAccountFactory.interface.encodeFunctionData(
				"createAccount",
				[
					this._passkeyMetaInfo.pubKeyX,
					this._passkeyMetaInfo.pubKeyY,
					this._passkeyMetaInfo.salt,
					this._passkeyMetaInfo.credentialId,
				],
			),
		]);
		return initCode;
	}

	async getCounterfactualAccountAddress(): Promise<string | null> {
		try {
			const initCode = this.getInitCode();
			// CALCULATE THE SENDER ADDRESS
			const senderAddress = await this._entryPoint.getSenderAddress
				.staticCall(initCode)
				.then(() => {
					throw new Error("Expected getSenderAddress() to revert");
				})
				.catch((e) => {
					const data = e.data.match(/0x6ca7b806([a-fA-F\d]*)/)?.[1];
					if (!data) {
						return Promise.reject(new Error("Failed to parse revert data"));
					}
					const addr = ethers.getAddress(`0x${data.slice(24, 64)}`);
					return Promise.resolve(addr);
				});

			logger.debug("Calculated sender address:", senderAddress);
			return senderAddress;
		} catch (err) {
			logger.error(err);
		}
		return null;
	}

	getContract(address: string): TZeroTrustAccount {
		return new Contract(
			address,
			ZERO_TRUST_ACCOUNT_ABI,
			this._provider,
		) as unknown as TZeroTrustAccount;
	}

	static getContract(address: string, provider:ethers.JsonRpcProvider): TZeroTrustAccount {
		return new Contract(
			address,
			ZERO_TRUST_ACCOUNT_ABI,
			provider,
		) as unknown as TZeroTrustAccount;
	}

	
	
	async execute(targetContract :string,funCalldata:string,
		bundlerProvider:ethers.JsonRpcProvider,paymasterProvider?:ethers.JsonRpcProvider)
		: Promise<{ error: string | null, response: any | null }>{
		try {
			const address = await this.getCounterfactualAccountAddress();
			const gasPrice = (await this._provider.getFeeData()).gasPrice;
			logger.debug(gasPrice)
			const nonceValue = await getNonceValue(address!,  this._provider);
			logger.debug(`Account Nonce:${nonceValue}`)

			const chainId = await this._provider.getNetwork().then(network => network.chainId);
			logger.debug(`ChainId:${chainId}`)
			logger.debug(`Target Contract Address:${targetContract}`)
			
			const value = ethers.parseEther('0');
			const accountContract = this.getContract(address!);

			const callData = accountContract.interface.encodeFunctionData("execute", [targetContract, value, funCalldata]);
			logger.debug(`calldata :${callData}`)
	
			const userOperation = {
				sender: address!,
				nonce: "0x" + nonceValue.toString(16),
				initCode: nonceValue === 0 ? this.getInitCode() : '0x',
				callData,
				callGasLimit: "0x" + BigInt(2000000).toString(16),
				verificationGasLimit: "0x" + BigInt(2000000).toString(16),
				preVerificationGas: "0x" + BigInt(2000000).toString(16),
				maxFeePerGas: "0x" + gasPrice!.toString(16),
				maxPriorityFeePerGas: "0x" + gasPrice!.toString(16),
				paymasterAndData: "0x",
				signature: "0x"
			};
			const entryPointContractAddress =  this._entryPoint.target;
			logger.debug(`Partial UserOps :${userOperation}`)
			logger.debug(`Getting paymaster sponsorship`)
			
			const sponsorUserOperationResult = await paymasterProvider!.send("pm_sponsorUserOperation", [
				userOperation,
				{
					entryPoint: entryPointContractAddress,
				},
			]);
			const paymasterAndData = sponsorUserOperationResult.paymasterAndData;
			logger.debug(`Paymaster response ${sponsorUserOperationResult}`)

			if (paymasterAndData) {
				userOperation.paymasterAndData = paymasterAndData;
				const userOpHash = await this._entryPoint.getUserOpHash(userOperation);
	
				const allowCredentials: PublicKeyCredentialDescriptor[] = [{
					id: Passkey.parseBase64url(ethers.toUtf8String(this._passkeyMetaInfo.credentialId)),
					type: 'public-key'
				}];
	
				const {
					authenticatorData,
					clientDataJson,
					challengeLocation,
					requireUserVerification,
					responseTypeLocation,
					r,
					s,
					error
				} = await Passkey.getPasskeySignatureData(userOpHash, allowCredentials);
	
				if (!error) {
					const sessionMode = '0x00000000';
					const defaultAbiCoder = ethers.AbiCoder.defaultAbiCoder();
	
					const passKeySignatureStruct = defaultAbiCoder.encode([
						'tuple(uint256,uint256,uint256,uint256,bool,bytes,string)'
					], [
						[challengeLocation,
							responseTypeLocation,
							r,
							s,
							requireUserVerification,
							authenticatorData,
							clientDataJson
						]
					]).substring(2);
	
					const encodedSignature = defaultAbiCoder.encode(['bytes4'], [sessionMode]) + passKeySignatureStruct;
	
					userOperation.signature = encodedSignature;
					const userOperationHash = await bundlerProvider.send("eth_sendUserOperation", [
						userOperation,
						entryPointContractAddress
					]);
	
					let receipt = null;
					while (receipt === null) {
						await new Promise((resolve) => setTimeout(resolve, 1000));
						receipt = await bundlerProvider.send("eth_getUserOperationReceipt", [userOperationHash]);
					}
					logger.debug(receipt)
					return { error: null, response: receipt };
				} else {
					const errorMessage = `Failed to generate passkey signature: ${error}`;
					return { error: errorMessage, response: null };
				}
			} else {
				return { error: 'Invalid PaymasterAndData.', response: null };
			}
		} catch (error) {
			console.error('Error executing the transaction:', error);
			return { error: 'Error executing the transaction', response: null };
		}

	}

	async payableExecute(funCalldata:string,bundlerProvider:ethers.Provider,paymasterProvider?:ethers.Provider){

	}
	
	async createSession(applicationName :string, session :ISessionAccount.SessionStruct,
		bundlerProvider:ethers.JsonRpcProvider,paymasterProvider?:ethers.JsonRpcProvider)
		: Promise<{ error: string | null, response: any | null}> {
			try{	
				const address = await this.getCounterfactualAccountAddress();
				const gasPrice = (await this._provider.getFeeData()).gasPrice;
				logger.debug(gasPrice)
				const nonceValue = await getNonceValue(address!,  this._provider);
				logger.debug(`Account Nonce:${nonceValue}`)

				const chainId = await this._provider.getNetwork().then(network => network.chainId);
				logger.debug(`ChainId:${chainId}`)
				
				const value = ethers.parseEther('0');
				const accountContract = this.getContract(address!);

				// const session :ISessionAccount.SessionStruct= {
				// 		allowedContracts:1,
				// 		allowedInactiveDuration:0,
				// 		extendWithInactiveDuration:false,
				// 		sessionCommitment:'',
				// 		validAfter:'',
				// 		validUntil:''
				// }
				const callData = accountContract.interface.encodeFunctionData("setApplicationSession", [ethers.keccak256(ethers.toUtf8Bytes(applicationName)), session]);
				logger.debug(`calldata :${callData}`)
		
				const userOperation = {
					sender: address!,
					nonce: "0x" + nonceValue.toString(16),
					initCode: nonceValue === 0 ? this.getInitCode() : '0x',
					callData,
					callGasLimit: "0x" + BigInt(2000000).toString(16),
					verificationGasLimit: "0x" + BigInt(2000000).toString(16),
					preVerificationGas: "0x" + BigInt(2000000).toString(16),
					maxFeePerGas: "0x" + gasPrice!.toString(16),
					maxPriorityFeePerGas: "0x" + gasPrice!.toString(16),
					paymasterAndData: "0x",
					signature: "0x"
				};
				const entryPointContractAddress =  this._entryPoint.target;
				logger.debug(`Partial UserOps :${userOperation}`)
				logger.debug(`Getting paymaster sponsorship`)
				
				const sponsorUserOperationResult = await paymasterProvider!.send("pm_sponsorUserOperation", [
					userOperation,
					{
						entryPoint: entryPointContractAddress,
					},
				]);
				const paymasterAndData = sponsorUserOperationResult.paymasterAndData;
				logger.debug(`Paymaster response ${sponsorUserOperationResult}`)

				if (paymasterAndData) {
					userOperation.paymasterAndData = paymasterAndData;
					const userOpHash = await this._entryPoint.getUserOpHash(userOperation);
		
					const allowCredentials: PublicKeyCredentialDescriptor[] = [{
						id: Passkey.parseBase64url(ethers.toUtf8String(this._passkeyMetaInfo.credentialId)),
						type: 'public-key'
					}];
		
					const {
						authenticatorData,
						clientDataJson,
						challengeLocation,
						requireUserVerification,
						responseTypeLocation,
						r,
						s,
						error
					} = await Passkey.getPasskeySignatureData(userOpHash, allowCredentials);
		
					if (!error) {
						const sessionMode = '0x00000000';
						const defaultAbiCoder = ethers.AbiCoder.defaultAbiCoder();
		
						const passKeySignatureStruct = defaultAbiCoder.encode([
							'tuple(uint256,uint256,uint256,uint256,bool,bytes,string)'
						], [
							[challengeLocation,
								responseTypeLocation,
								r,
								s,
								requireUserVerification,
								authenticatorData,
								clientDataJson
							]
						]).substring(2);
		
						const encodedSignature = defaultAbiCoder.encode(['bytes4'], [sessionMode]) + passKeySignatureStruct;
		
						userOperation.signature = encodedSignature;
						const userOperationHash = await bundlerProvider.send("eth_sendUserOperation", [
							userOperation,
							entryPointContractAddress
						]);
		
						let receipt = null;
						while (receipt === null) {
							await new Promise((resolve) => setTimeout(resolve, 1000));
							receipt = await bundlerProvider.send("eth_getUserOperationReceipt", [userOperationHash]);
						}
						logger.debug(receipt)
						return { error: null, response: receipt };
					} else {
						const errorMessage = `Failed to generate passkey signature: ${error}`;
						return { error: errorMessage, response: null };
					}
				} else {
					return { error: 'Invalid PaymasterAndData.', response: null };
				}
			} catch (error) {
				console.error('Error executing the transaction:', error);
				return { error: 'Error executing the transaction', response: null };
			}
		}

	

	login() {}
}
