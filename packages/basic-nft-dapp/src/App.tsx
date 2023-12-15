import {  useEffect, useState } from 'react';
import {  Avatar, AvatarGroup, Box, Button, Container, Divider, Flex, HStack, Heading,Icon, Image, Link,Spacer, Spinner, Stack, Text,  Tooltip,  VStack,  useClipboard,    useDisclosure,  useToast  } from '@chakra-ui/react'
import { ChatIcon, CloseIcon,  } from "@chakra-ui/icons";
import { useSignInWithZeroTrustAccount, useZeroTrustAccountSession } from './hooks';
import { formatAddress, formatTime, getNonceValue } from './utils';
import { logger } from './config/logger';
import { getBlockExplorerURLByChainId, getDemoNFTContractAddressByChainId, getEntryPointContractAddressByChainId, getPimlicoChainNameByChainId } from './config';
import { Contract, ethers } from 'ethers';
import { getDemoNFTContract, getEntryPointContract } from './appContracts';
import { BiLinkExternal, BiWalletAlt } from 'react-icons/bi';
import { ZeroTrustAccount, ZeroTrustSession } from 'zero-trust-core-sdk';
import { generateProof } from './appContracts/zkSessionAccountProof';
import { FaClock, FaCopy, FaPowerOff, FaShare } from 'react-icons/fa';

function padArrayWithZeros(array: bigint[]): bigint[] {
  const paddedArray = [...array];
  while (paddedArray.length < 16) {
    paddedArray.push(BigInt(0));
  }
  return paddedArray;
}

export default function App() {
  const dappId = 'demoNFTMinter'
  const toast = useToast();
  const [isMintLoading,setMintLoading] = useState(false)
  const [txLink,setTxLink] = useState<string>()
  const { onCopy, setValue:setWalletAddress, hasCopied } = useClipboard("");
  const {session,timeRemaining,identity,userAddress,authorizedScopes} = useZeroTrustAccountSession()
  const {isOpen:isWalletDrawerOpen,onOpen:onWalletDrawerOpen,onClose:onWalletDrawerClose} = useDisclosure()
  
  const handleCopyWalletAddress = () => {
    setWalletAddress(userAddress)
    onCopy()
  }

  const handleMint = async () => {
    if(!session){
      onWalletDrawerOpen()
      return;
    }
    setMintLoading(true)
    try{
      const provider = new ethers.JsonRpcProvider('https://goerli.base.org');
      const metadataFile = 'bafybeifyl3g3wr24zqlxplb37zzxykk6crcl6wbvn7fcpi3rwnnerqzjpm'

      const chainId = '0x14a33' //"0x"+BigInt((await provider.getNetwork()).chainId).toString(16)
      logger.debug("smart contract account userAddress: ",userAddress)
    
      const zeroTrustAccount = ZeroTrustAccount.getContract(userAddress,provider)
      
      const nftContractAddress = getDemoNFTContractAddressByChainId(chainId);
      // Prepare calldata to mint NFT
      const to =  nftContractAddress!;
      const value = ethers.parseEther('0')
      const demoNFTContracts = getDemoNFTContract(nftContractAddress!,provider) 
      const mintingCall = demoNFTContracts.interface.encodeFunctionData("mintNFT",[userAddress,metadataFile])
      const data = mintingCall
      let callData = zeroTrustAccount.interface.encodeFunctionData("executeOnSession", [to, value,data])
      logger.debug("Generated callData:", callData)
      const gasPrice = (await provider.getFeeData()).gasPrice
      logger.debug("Gas Price",gasPrice)

      
      if (provider == null) throw new Error('must have entryPoint to autofill nonce')
      const c = new Contract(userAddress, [`function getNonce() view returns(uint256)`], provider)
      const nonceValue = await getNonceValue(c)
      const chain = getPimlicoChainNameByChainId(chainId) // find the list of chain names on the Pimlico verifying paymaster reference page
      const apiKey = process.env.REACT_APP_PIMLICO_API_KEY
      const pimlicoEndpoint = `https://api.pimlico.io/v1/${chain}/rpc?apikey=${apiKey}`
      const pimlicoProvider = new ethers.JsonRpcProvider(pimlicoEndpoint,null,{staticNetwork:await provider.getNetwork()})
      const entryPointContractAddress = getEntryPointContractAddressByChainId(chainId)!// '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
      const userOperation = {
        sender: userAddress,
        nonce:"0x"+nonceValue.toString(16),
        initCode:'0x',
        callData,
        callGasLimit: "0x"+BigInt(2000000).toString(16), // hardcode it for now at a high value
        verificationGasLimit: "0x"+BigInt(2000000).toString(16), // hardcode it for now at a high value
        preVerificationGas: "0x"+BigInt(2000000).toString(16), // hardcode it for now at a high value
        maxFeePerGas: "0x"+gasPrice.toString(16),
        maxPriorityFeePerGas: "0x"+gasPrice.toString(16),
        paymasterAndData: "0x",
        signature: "0x"
      }
      const sponsorUserOperationResult = await pimlicoProvider.send("pm_sponsorUserOperation", [
        userOperation,
        {
          entryPoint: entryPointContractAddress,
        },
      ])
         
      const paymasterAndData = sponsorUserOperationResult.paymasterAndData
      logger.debug(`PaymasterAndData: ${paymasterAndData}`)
      if (paymasterAndData && session.sessionCommitment){
        console.log('Stored Session')
        console.log(session)
        const zeroTrustSession = new ZeroTrustSession(authorizedScopes,identity)
        console.log('Calculated Session')
        console.log(zeroTrustSession.commitment)
        // const savedIdentity = {nullifier:BigInt(0),trapdoor:BigInt(0)} //new Identity(identity);
        userOperation.paymasterAndData = paymasterAndData
        const userOpHash = await getEntryPointContract(provider).getUserOpHash(userOperation)
        const nullifier = zeroTrustSession.nullifier;
        const trapdoor = zeroTrustSession.trapdoor;
        const externalNullifier =  BigInt(userOpHash) >> BigInt(8) //BigInt(solidityKeccak256(['bytes'],[calldataHash])) >> BigInt(8)
        
        const actionContract = nftContractAddress
        const action = demoNFTContracts.interface.getFunction('mintNFT').selector

        const actionContractIndex = Object.keys(authorizedScopes).indexOf(actionContract)
        const actionIndex = Object.values(authorizedScopes)[actionContractIndex].indexOf(action)
        console.log(authorizedScopes)
        const contracts = Object.keys(authorizedScopes).map(v => BigInt(v))
        console.log("Contract Array")
        console.log(contracts)
        const scopes = Object.values(authorizedScopes).map(scopesArray =>
          padArrayWithZeros(scopesArray.map(scope => BigInt(scope)) )
        )
        console.log("scopes Array")
        console.log(scopes)
        
        console.log("Generating Proof")
        const wasmFilePath = `/assets/${contracts.length}/Session.wasm`;
        const zkeyFilePath = `/assets/${contracts.length}/Session.zkey`;
        const {proof,publicSignals} = await generateProof(
          trapdoor,
          nullifier,
          externalNullifier,
          contracts,
          scopes,
          actionContractIndex,
          actionIndex,
          {wasmFilePath,zkeyFilePath}
          )
          console.log(`Proof inputs: `)
          console.log({trapdoor,
            nullifier,
            externalNullifier,
            contracts,
            scopes,
            actionContractIndex,
            actionIndex})
          console.log(`Proof : ${proof}`)
          console.log(`publicSignals : ${publicSignals}`)
        const sessionProof: any[8] = proof
        const proofInput: any[5] = publicSignals
        // const argv = sessionProof.map((x:any) => BigInt(x))
        // const hexStrings = argv.map((n:BigInt) => '0x' + n.toString(16));
        const sessionMode = '0x00000001' // '0x00000001' for session mode, '0x00000000' for direct signature mode
        // Encode the array of hex strings
        const defaultAbiCoder = ethers.AbiCoder.defaultAbiCoder()
        // zeroTrustAccount.sessionSignatureProofStruct()
        const sessionSignatureProof = defaultAbiCoder.encode([
          'tuple(bytes32,uint256,uint256[8])'],
          [ [ethers.keccak256(ethers.toUtf8Bytes(dappId)),
            proofInput[1],
            sessionProof]]).substring(2)
          console.log(`sessionSignatureProof : ${sessionSignatureProof}`)
        const encodedSessionProof = defaultAbiCoder.encode(['bytes4'],[sessionMode])+sessionSignatureProof
        userOperation.signature = encodedSessionProof
        logger.debug(userOperation)
        console.log("Application Name")
        console.log(ethers.keccak256(ethers.toUtf8Bytes('www.example.com')))

        // SUBMIT THE USER OPERATION TO BE BUNDLED
        const userOperationHash = await pimlicoProvider.send("eth_sendUserOperation", [
          userOperation,
          entryPointContractAddress // ENTRY_POINT_ADDRESS
        ])
        logger.debug("UserOperation hash:", userOperationHash)
        // let's also wait for the userOperation to be included, by continually querying for the receipts
        logger.debug("Querying for receipts...")
        let receipt = null
        while (receipt === null) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          receipt = await pimlicoProvider.send("eth_getUserOperationReceipt", [
          userOperationHash,
        ]);
          logger.debug(receipt === null ? "Still waiting..." : receipt)
        }

        const txHash = receipt.receipt.transactionHash
        const blockExplorer = getBlockExplorerURLByChainId(chainId)
        logger.debug(`UserOperation included: ${blockExplorer}/tx/${txHash}`)
        setTxLink(`${blockExplorer}/tx/${txHash}`)
        toast({
          title: "Successfully minted DEMO NFT",
          description: "",
          status: "success",
          duration: 3000,
          isClosable: true,
        })
        } else {
        logger.debug('Invalid PaymasterAndData.');
      }  

    }catch(e){
      logger.error(e)
      toast({
        title: "Failed to mint DEMO NFT",
        description: "",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
    setMintLoading(false)
  };
  
  const onSuccessfullSignInCallback = (message:string) =>{
    toast({
      title: message,
      description: '',
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  }
  const onErrorSignInCallback = (message:string) =>{
    toast({
      title: message,
      description: '',
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  }

  const { isLoading,  handleSignIn,  disconnect,  } = useSignInWithZeroTrustAccount(onSuccessfullSignInCallback,onErrorSignInCallback)

  useEffect(() => {
    if(!isLoading){
      onWalletDrawerClose()
    }
   }, [ onWalletDrawerClose,isLoading]);
  
  return (
    <Container  h={{ base: 'auto', md: '100vh' }} display="flex" justifyContent="center" alignItems="center" >
      <Box w="415px" h="800px" bg="red.200" border="1px solid gray" borderRadius="md"  position={'relative'}>
        <Flex minWidth="max-content" p={2} alignItems="center" gap="2">
          <Box px="2">
            <Heading size="lg" fontFamily="monospace">
              🌈
            </Heading>
          </Box>
          <Spacer />

          {session 
          ?<HStack >
            <HStack spacing={1} flexShrink={0}>
              <Icon aria-label="wallet" as={FaClock} />
               {timeRemaining && <Text fontSize={'sm'} >{formatTime(timeRemaining)}</Text>}
               <Icon aria-label="wallet" as={BiWalletAlt} /> 
              <Text fontSize={'sm'}>
                {formatAddress(userAddress)} 
              </Text>
              <Tooltip hasArrow label={hasCopied ? 'Copied' : 'Copy'}>
                <Button size="sm" variant={'ghost'}  onClick={handleCopyWalletAddress}>
                  <Icon w={3} h={3} as={FaCopy} />
                </Button>
              </Tooltip>
            </HStack>
            <HStack spacing="1">
              <Button size="sm" colorScheme={'red'} onClick={disconnect}>
                <Icon w={3} h={3} as={FaPowerOff} />
              </Button>
            </HStack>
          </HStack>
          :<Button
          bgColor="black"
          _hover={{
            bg: 'gray.700',
          }}
          textColor={'white'}
          rounded={'full'}
          onClick={onWalletDrawerOpen}
        >
          Connect
        </Button>
          }
          
        </Flex>

        <Divider orientation="horizontal" />

        {/* body */}
        <Box overflow="scroll" h="800px" >
          <Container  maxW="3xl" h="100%" p={4}>
            <Box mt={4} display="flex" justifyContent="center" alignItems="center">
              <Image objectFit="cover" maxW="100%" maxH="calc(100% - 2rem)" src="citizen657.png" alt="Citizen 657" />
            </Box>
            <HStack py={4} >
              <HStack>
                <Button
                  _hover={{ bgColor: 'black' }}
                  rounded="full"
                  bgColor="black"
                  textColor="white"
                  leftIcon={<Icon as={ChatIcon} />}
                >
                  7
                </Button>
                <Button
                  _hover={{ bgColor: 'black' }}
                  rounded="full"
                  bgColor="black"
                  textColor="white"
                  leftIcon={<Icon as={FaShare} />}
                >
                  23
                </Button>
              </HStack>
              <Spacer/>
              <AvatarGroup size='sm' borderColor={'black'} max={2}>
                <Avatar name='Ryan Florence' src='https://bit.ly/ryan-florence' />
                <Avatar name='Segun Adebayo' src='https://bit.ly/sage-adebayo' />
                <Avatar name='Kent Dodds' src='https://bit.ly/kent-c-dodds' />
                <Avatar name='Prosper Otemuyiwa' src='https://bit.ly/prosper-baba' />
                <Avatar name='Christian Nwamba' src='https://bit.ly/code-beast' />
              </AvatarGroup>
            </HStack>
            <Heading textColor={'black'}>Citizen 657</Heading>
            <Stack spacing={4} align='center' mt={4} >
              <Stack
                direction='column'
                spacing={3}
                align='center'
                position='relative'
                w={'100%'}
              >
                <Button
                  w={'100%'}
                  isLoading={isMintLoading}
                  bgColor='black'
                  textColor={'white'}
                  rounded='full'
                  px={6}
                  onClick={handleMint}
                  _hover={{
                    bg: 'black.800',
                  }}
                >
                  MintNFT
                </Button>
                {txLink && (
                  <Link href={txLink} isExternal>
                    Transaction link <Icon as={BiLinkExternal} mx='2px' />
                  </Link>
                )}
              </Stack>
            </Stack>
          </Container>
        </Box>

      {/* Drawer */}
      {isWalletDrawerOpen && (
        <>
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            zIndex={10}
            bg="white"
            boxShadow="lg"
            p={4}
            mx={1}
            bgColor={'red.300'}
            roundedTop={'10%'}
            maxHeight="50vh"
            overflowY="auto"
            style={isWalletDrawerOpen ? { transition: "height 0.6s ease-in-out, opacity 0.6s ease-in-out", opacity: 1, height: "50vh" } : {}}
          >
            <Box
            position="absolute"
            zIndex={10}
            top={3}
            right={4}
          >
            <Button
              size="sm"
              onClick={onWalletDrawerClose}
              bg="transparent"
              _hover={{ bg: "transparent" }}
            >
              <Icon as={CloseIcon} boxSize={4} />
            </Button>
          </Box>
            {isLoading ?
              <Flex w={'full'} h={'full'} justify={'center'} align={'center'}>
                  <Spinner size='xl' />
              </Flex>
              :<VStack w={'full'}>
                <Text mb={4}>Log In or Sign Up</Text>
                <Button isDisabled={true} mb={4} w={'full'}  _hover={{  bg: 'black', }}  bgColor="black"  textColor={'white'}  >Connect MetaMask</Button>

                <Button isDisabled={true} mb={4} w={'full'} bgColor="black"  _hover={{  bg: 'black', }} textColor={'white'}  >Continue with email</Button>

                <Button mb={4} w={'full'}
                  _hover={{  bg: 'black', }} 
                  bgColor="gray.800" textColor={'white'} 
                  onClick={handleSignIn}
                  isLoading={isLoading}
                  >SignIn w/ Zero Trust Accounts
                </Button>
              </VStack>
            }
          </Box>
        </>
      )}

      </Box>
    </Container>
  )
}