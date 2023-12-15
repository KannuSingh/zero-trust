import { HamburgerIcon, MoonIcon, SunIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, IconButton, Image, Spacer, useColorMode } from "@chakra-ui/react";

import { Avatar, Center, HStack, Icon, Popover, PopoverArrow, PopoverBody, PopoverContent, PopoverHeader, PopoverTrigger, Portal, Text, Tooltip, VStack, useBoolean, useClipboard, useColorModeValue } from "@chakra-ui/react";
import {  FaChevronDown, FaChevronUp, FaCopy } from "react-icons/fa"
import { BiWalletAlt } from "react-icons/bi"
import { formatAddress } from "../../utils";
import { useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import PropTypes from "prop-types";
import { useParams } from "react-router-dom";
import { LocalPasskeyMetaInfoMap } from "../../pages/signup";

const Header = ({ onOpen }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const {dataSource,name} = useParams();
  return (
    <Box borderBottom="1px" borderColor="gray.200">
      <Flex p={2} justifyContent="space-between" gap={2} alignItems="center">
        {/* {onOpen && (
          <IconButton
            aria-label="Toggle sidebar"
            icon={<HamburgerIcon />}
            display={{ base: "block", md: "none" }}
            ml={2}
            onClick={onOpen}
          />
        )} */}
        <Box >
          <Image
            src={useColorModeValue("/zt-simple-black-text.png", "/zt-simple-white-text.png")}
            alt="ZeroTrustLogo"
            height={8}
          />
        </Box>
        <Spacer />
        {/* {dataSource && name  && <UserProfileAvatar username={name} />} */}
        <Flex alignItems="center">
          <Button onClick={toggleColorMode}>
            {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

Header.propTypes = {
  onOpen: PropTypes.func,
};

export default Header;



export function UserProfileAvatar({username}) {
  const [isAccountDetailOpen, setIsAccountDetailOpen] = useBoolean()
  const [ethBalance,] = useState('0')
  const _portalBg = useColorModeValue("white", "gray.900")
	const _portalBorderBg = useColorModeValue("gray.200", "gray.700")
  const { onCopy, setValue:setWalletAddress, hasCopied } = useClipboard("");
  const [localPasskeyInfoMap,]= useLocalStorage<LocalPasskeyMetaInfoMap>("localPasskeyMetaInfoMap",{})

  const handleCopyWalletAddress = () => {
    setWalletAddress(localPasskeyInfoMap[username].accountAddress)
    onCopy()
  }
  if(localPasskeyInfoMap[username] && localPasskeyInfoMap[username].accountAddress){
    return (
      <Popover isOpen={isAccountDetailOpen} onOpen={setIsAccountDetailOpen.on} onClose={setIsAccountDetailOpen.off}
        placement="bottom-end" isLazy
      >
        <PopoverTrigger>
          <Button  bg="none"
            leftIcon={ <Avatar size="sm" /> }
            rightIcon={
              isAccountDetailOpen ? (
                <Icon w={3} h={3} as={FaChevronUp} />
              ) : (
                <Icon w={3} h={3} as={FaChevronDown} />
              )
            }
            variant="ghost"
            _focus={{ boxShadow: "none", background: "none" }}
            _hover={{ background: "none" }}
          >
            {username}
          </Button>
        </PopoverTrigger>
        <Portal>
          <PopoverContent bg={_portalBg} borderColor={_portalBorderBg}>
            <PopoverArrow />
            <PopoverHeader borderBottomWidth="0px">
              <HStack justify="space-between">
                <HStack>
                  <Icon aria-label="wallet" as={BiWalletAlt} />
                  <Text> {formatAddress(localPasskeyInfoMap[username].accountAddress)}
                  </Text>
                </HStack>
                <HStack spacing="1">
                  <Tooltip hasArrow label={hasCopied?'Copied':'Copy'} >
                    <Button size="sm" onClick={handleCopyWalletAddress}>
                      <Icon w={3} h={3} as={FaCopy} />
                    </Button>
                  </Tooltip>
                </HStack>
              </HStack>
            </PopoverHeader>
            <PopoverBody>
              <Center>
                <VStack spacing="1">
                  <Text fontSize="2xl">{ethBalance}</Text>
                  <Text fontSize="3xl">ETH</Text>
                </VStack>
              </Center>
            </PopoverBody>
          </PopoverContent>
        </Portal>
      </Popover>
    );
  }
  
  

  
  
}
