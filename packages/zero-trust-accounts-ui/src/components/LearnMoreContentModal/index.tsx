import { Button, ListItem, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, OrderedList, Stack, Text } from "@chakra-ui/react";
import React from "react";

export default function LearnMoreContent({isOpen,onClose}:{isOpen:boolean,onClose():void}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Learn More</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={3}>
            <Text mt={4} textAlign={'start'}>
              {`Passkey X zk account is an ERC-4337 account that incorporates two powerful authorization mechanisms:`}
            </Text>
            <OrderedList spacing={2}>
              <ListItem>
                <Text as='b'>{`Passkeys with Secp256r1 Signatures:`}</Text>
                {` Passkeys use Secp256r1 signatures, verified on-chain through the Daimo p256-verifier .`}
              </ListItem>
              <ListItem>
                <Text as='b'>{`zkCommitment Proof for Time-Limited Interactions:`}</Text>
                {` The account introduces zkCommitment, where a commitment ID is generated for a specific DApp smart contract, such as a Demo NFT contract. This commitment ID, along with a designated time frame, creates a structure reminiscent of a session, similar to the concept commonly found in web2 applications. The account can seamlessly interact with the DApp smart contract by generating a proof for the commitment ID within its validity period. Notably, these interactions occur without the need for additional signature operations using the Passkey, providing both a secure and user-friendly experience.`}
              </ListItem>
            </OrderedList>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme='red' mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
  }