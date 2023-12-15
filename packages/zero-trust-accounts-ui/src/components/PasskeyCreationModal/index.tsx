import { logger } from '../../lib/logger';
import { Passkey } from 'zero-trust-core-sdk';
import { useLocalStorage } from "usehooks-ts";
import { Modal,  ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody,  ModalCloseButton, Button, Input,  FormControl, FormLabel, FormHelperText, useToast, } from '@chakra-ui/react'
import { useState } from 'react';
import React from 'react';

interface IPasskeyCreationModal{
  isOpen:boolean; 
  onOpen():void; 
  onClose():void; 
}

export default function PasskeyCreationModal({ isOpen, onOpen, onClose }:IPasskeyCreationModal) {
  const toast = useToast();
  const [username,setUsername] = useState("")
  const [,setUsernamePasskeyInfoMap]= useLocalStorage("usernamePasskeyInfoMap",{})

  // const handlePasskeyCreation = async ({  yubikeyOnly, }: {  yubikeyOnly?: boolean; }) => {
  //     const { data: credential, response,  error, } = await Passkey.create({
  //       appName: "Passkey X zkAccount Demo",
  //       username: username,
  //       email: username,
  //       yubikeyOnly,
  //     });

  //     if (error) {
  //       logger.error("(🪪,❌) Error", error);
  //       toast({
  //         title: "Error creating credential.",
  //         description: error,
  //         status: "error",
  //         duration: 9000,
  //         isClosable: true,
  //       });
  //     }
  //     let passkeyInfo:{credentialId?:string,credentialRawId?:string,publicKeyAsHex?:string} = {}
     
  //     if (credential) {
  //       logger.debug("(🪪,✅) Credential", credential);
  //       toast({
  //         title: "Credential created.",
  //         description: "Your credential has been created.",
  //         status: "success",
  //         duration: 9000,
  //         isClosable: true,
  //       });
  //       const rawIdAsBase64 = btoa(
  //         String.fromCharCode.apply(null, new Uint8Array(credential.rawId))
  //       );
  //       passkeyInfo.credentialId = credential.id;
  //       passkeyInfo.credentialRawId = rawIdAsBase64;
  //     }
  //     if (response) {
  //       const { data: publicKey } = Passkey.getPublicKeyFromAttestationResponse({
  //         response,
  //       } as { response: AuthenticatorAttestationResponse });
  //       const publicKeyAsCryptoKey = await Passkey.importPublicKeyAsCryptoKey(
  //         publicKey
  //       );
  //       const exported = await window.crypto.subtle.exportKey(
  //         "jwk",
  //         publicKeyAsCryptoKey
  //       );
  //       logger.debug(
  //         "Public Key as Crypto Key and JWT",
  //         publicKeyAsCryptoKey,
  //         exported
  //       );
  //       passkeyInfo.publicKeyAsHex = Passkey.buf2hex(publicKey);
  //        // Save the information in the usernamePasskeyInfoMap
  //       setUsernamePasskeyInfoMap((prevMap) => ({
  //           ...prevMap,
  //           [username]: passkeyInfo,
  //       }));
        
  //     }
  //     onClose()
  // }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create Passkey</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
        <FormControl>
          <FormLabel>Username</FormLabel>
          <Input type='email' onChange={(e) => setUsername(e.target.value.toLowerCase())}/>
          <FormHelperText>Enter username to identify your account.</FormHelperText>
        </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme='red' mr={3} onClick={onClose}>
            Close
          </Button>
          {/* <Button onClick={()=> handlePasskeyCreation({})} colorScheme='green'>Create</Button> */}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}