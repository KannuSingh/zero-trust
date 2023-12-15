import { Badge, Box, Link, VStack } from "@chakra-ui/react";

const Sidebar = ({ onSelectLink, links }) => {
  return (
    <Box bg="gray.700" minHeight="100vh" color="white" w="64" py="4" px="3">
      <VStack alignItems="start" spacing="4">
        {links.map((link) => (
          <Link
            key={link.title}
            onClick={() =>
              link.title !== "Manage Session" && onSelectLink(link)
            }
            opacity={link.title === "Manage Session" ? 0.5 : 1}
            pointerEvents={
              link.title === "Manage Session" ? "none" : "auto"
            }
            px={2}
            py={1}
            borderRadius="md"
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
    </Box>
  );
};

export default Sidebar;
