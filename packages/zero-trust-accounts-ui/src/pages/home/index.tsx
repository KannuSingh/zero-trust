import React, { useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom"; // Import the useHistory hook
import {
  Box,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerCloseButton,
  Flex,
  Link,
  Text,
  useDisclosure,
  VStack,
  Container,
  Badge,
  HStack,
  Icon,
  Tooltip,
  Button,
  useClipboard,
} from "@chakra-ui/react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import Settings from "../../components/Settings";
import Dashboard from "../../components/Dashboard";
import { FaCopy } from "react-icons/fa";
import { formatAddress } from "../../utils";
import { BiWalletAlt } from "react-icons/bi";
import { useLocalStorage } from "usehooks-ts";
import { LocalPasskeyMetaInfoMap } from "../signup";



const ManageSessionContent = () => {
  return <Text fontSize="xl">Manage Session Content</Text>;
};

const links = [
  { title: "Dashboard", url: "dashboard", component: Dashboard },
  { title: "Settings", url: "settings", component: Settings },
  { title: "Manage Session", url: "manage-session", component: ManageSessionContent },
];

const Home = () => {
  const {dataSource,name} = useParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const [ethBalance,] = useState('0')
  const { onCopy, setValue:setWalletAddress, hasCopied } = useClipboard("");
  const [localPasskeyInfoMap,]= useLocalStorage<LocalPasskeyMetaInfoMap>("localPasskeyMetaInfoMap",{})
  const handleCopyWalletAddress = () => {
    setWalletAddress(localPasskeyInfoMap[name].accountAddress)
    onCopy()
  }
 
  const handleSelectLink = (link) => {
    onClose();
    navigate(`/${dataSource}/${name}/${link.url}`); // Change the URL based on the selected link
  };

  return (
    <Container maxW={"6xl"}>
      <Flex flexDirection="column" minHeight="100vh">
        <Header onOpen={onOpen} />

        <Flex h="100vh">
          {/* <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
            <DrawerOverlay />
            <DrawerContent>
              <DrawerCloseButton />
              <DrawerHeader>Zero Trust</DrawerHeader>
              <DrawerBody>
                <VStack alignItems="start" spacing="4">
                  {links.map((link) => (
                    <Link
                      key={link.title}
                      onClick={() =>
                        link.title !== "Manage Session" && handleSelectLink(link)
                      }
                      opacity={link.title === "Manage Session" ? 0.5 : 1}
                      pointerEvents={
                        link.title === "Manage Session" ? "none" : "auto"
                      }
                    >
                      {link.title}
                      {link.title === "Manage Session" && (
                        <Badge colorScheme="red" ml="2">
                          Coming Soon
                        </Badge>
                      )}
                    </Link>
                  ))}
                </VStack>
              </DrawerBody>
              <DrawerFooter></DrawerFooter>
            </DrawerContent>
          </Drawer> */}
          {/* <Box w="64" display={{ base: "none", md: "block" }}>
            <Sidebar  onSelectLink={handleSelectLink}  links={links} />
          </Box> */}

          <Box flex="1" p="4">
            <HStack justify="space-between">
              <HStack>
                <Icon aria-label="wallet" as={BiWalletAlt} />
                <Text> {formatAddress(localPasskeyInfoMap[name].accountAddress)}
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
            <Outlet/>
          </Box>
        </Flex>
      </Flex>
    </Container>
  );
};

export default Home;
