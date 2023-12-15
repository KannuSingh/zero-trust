import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { ethers } from "ethers";
import { Passkey,ZeroTrustAccount } from 'zero-trust-core-sdk';
import React, { useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { logger } from "../../lib/logger";
import Header from "../../components/Header";
import {  useNavigate, useSearchParams } from "react-router-dom";
import { useEthereum } from "../../hooks/useEthereum";
import { useZeroTrustConfig } from "../../hooks/useZeroTrustConfig";

export type LocalPasskeyMetaInfoMap = {
  [name: string]: PasskeyMetaInfo; 
}

type PasskeyMetaInfo = {
  accountAddress?:string
  credentialId?:string
  credentialRawId?:string
  publicKeyAsHex?:string
}
export default function Signup() {
  const toast = useToast();
  let [searchParams] = useSearchParams();
  const {ethereumProvider} = useEthereum();
  const {accountFactoryAddress,entryPointAddress} = useZeroTrustConfig();
  const navigate = useNavigate()
  const [passkeyDisplayName,setPasskeyDisplayName] = useState("")
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isLoading,setLoading] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [localPasskeyMetaInfoMap,setLocalPasskeyMetaInfoMap]= useLocalStorage<LocalPasskeyMetaInfoMap>("localPasskeyMetaInfoMap",{})

  const handleFocus = () => {
    setIsInputFocused(true);
  };

  const handleBlur = () => {
    setIsInputFocused(false);
  };

  const handlePasskeyCreation = async ({  yubikeyOnly, }: {  yubikeyOnly?: boolean; }) => {
      setLoading(true)
      const { data: credential, response,  error, } = await Passkey.create({
        appName: "ZeroTrust Demo",
        name: passkeyDisplayName,
        displayName: passkeyDisplayName,
        yubikeyOnly,
      });

      if (error) {
        setLoading(false)
        logger.error("(🪪,❌) Error", error);
        toast({
          title: "Error creating credential.",
          description: error,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
      let passkeyInfo:PasskeyMetaInfo = {}
     
      if (credential && response) {
        logger.debug("(🪪,✅) Credential", credential);
        toast({
          title: "Credential created.",
          description: "Your credential has been created.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        const rawIdAsBase64 = btoa(
          String.fromCharCode.apply(null, new Uint8Array(credential.rawId))
        );
        passkeyInfo.credentialId = credential.id;
        passkeyInfo.credentialRawId = rawIdAsBase64;

        const { data: publicKey } = Passkey.getPublicKeyFromAttestationResponse({
          response,
        } as { response: AuthenticatorAttestationResponse });
        const publicKeyAsCryptoKey = await Passkey.importPublicKeyAsCryptoKey(
          publicKey
        );
        const exported = await window.crypto.subtle.exportKey(
          "jwk",
          publicKeyAsCryptoKey
        );
        logger.debug(
          "Public Key as Crypto Key and JWT",
          publicKeyAsCryptoKey,
          exported
        );
        passkeyInfo.publicKeyAsHex = Passkey.buf2hex(publicKey);
        const [pubKeyX,pubKeyY] = await Passkey.getPublicKeyXYCoordinate(publicKeyAsCryptoKey)
         
        const passkeyMetaInfo= {
          pubKeyX,
          pubKeyY,
          salt:0,
          credentialId:ethers.toUtf8Bytes(credential.id)
        }
        const ztAccountInstance = new ZeroTrustAccount(ethereumProvider,entryPointAddress,accountFactoryAddress,passkeyMetaInfo)
        const userAccountAddress = await ztAccountInstance.getCounterfactualAccountAddress()
        passkeyInfo.accountAddress = userAccountAddress;
         // Save the information in the usernamePasskeyInfoMap
         setLocalPasskeyMetaInfoMap((prevMap) => ({
          ...prevMap,
          [passkeyDisplayName]: passkeyInfo,
        }));
        if(searchParams.has('redirect_url')){
          navigate(`${searchParams.get('redirect_url')}&user=${passkeyDisplayName}`)
        }else{
          navigate(`/local/${passkeyDisplayName}/dashboard`)
        }
       
      }
      
      setLoading(false)
  }

  // const usernameAvailable = () =>{
  //   //check localPasskeyMetaInfoMap for name availabilty
  //   return (passkeyDisplayName.length > 3 && !localPasskeyMetaInfoMap[passkeyDisplayName])
  // }
  const handleLogIn = () =>{
    if(searchParams.has('redirect_url')){
      navigate(`/login?redirect_url=${encodeURIComponent(searchParams.get('redirect_url'))}`)
    }else{
      navigate('/login')
    }
  }

  return (
    <Container maxW={'6xl'}>
      <Flex flexDirection="column" minHeight="100vh">
        {/* Navbar */}
        <Header />

        {/* Body */}
        <Flex flex={1} flexDirection="column">
          <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
            <Stack spacing="8">
              <Stack spacing="4" align={'center'}>
                {/* <Box >
                    <Image
                      src={useColorModeValue("/zt-logo-black-text.png", "/zt-logo-white-text.png")}
                      alt="ZeroTrustLogo"
                      height={150}
                    />
                  </Box> */}
                <Stack spacing={{ base: '2', md: '3' }} textAlign="center">
                  <Heading size={{ base: 'xs', md: 'sm' }}>Register your account</Heading>
                </Stack>
              </Stack>
              <Box
                py={{ base: '0', sm: '8' }}
                px={{ base: '4', sm: '10' }}
                bg={{ base: 'transparent', sm: 'bg.surface' }}
                boxShadow={{ base: 'none', sm: 'md' }}
                borderRadius={{ base: 'none', sm: 'xl' }}
              >
                <Stack spacing="6">
                  <Stack spacing="5">
                    <FormControl>
                      <FormLabel htmlFor="passkey-name">Name</FormLabel>
                      <Input id="passkey-name" name="passkey-name" type="text" 
                        value={passkeyDisplayName}
                        onChange={(e) => setPasskeyDisplayName(e.target.value.replace(/\s/g, "").toLowerCase())}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        isInvalid={isInputFocused && passkeyDisplayName.length !== 0 && (passkeyDisplayName.length < 3 || passkeyDisplayName.length > 32)}/>
                        {isInputFocused && passkeyDisplayName.length > 32 && (
                          <Text color="red.500">Maximum length of {32}</Text>
                        )}
                        {isInputFocused && passkeyDisplayName.length < 3 && (
                          <Text color="red.500">Minimum length of {3}</Text>
                        )}
                    </FormControl>
                  </Stack>
                  
                  <Stack spacing="6">
                    <Button isLoading={isLoading} 
                    // isDisabled={!usernameAvailable()}
                    onClick={() => handlePasskeyCreation({})}
                    >
                       Next
                    </Button>
                    <Text color="fg.muted">
                      Already have an account? <Button variant='link' onClick={handleLogIn}>Log in</Button>
                    </Text>
                  </Stack>
                </Stack>
              </Box>
            </Stack>
          </Container>
        </Flex>
      </Flex>
    </Container>
  );
}