import { Card, CardBody, CardHeader, Flex, Heading, List, ListItem, Text } from "@chakra-ui/react";

const Settings = () => {
  return  (
  <Flex direction={'column'}>
    <Text fontSize="xl">Settings</Text>
    <List spacing={2}>
      <ListItem>
        <Card size={'sm'}>
          <CardHeader>
            <Heading size='md'>Configure Bundler</Heading>
          </CardHeader>
          <CardBody>
            <Text>Add/Edit bundler details for your account operation.</Text>
          </CardBody>
        </Card>
      </ListItem>
      <ListItem>
        <Card size={'sm'}>
          <CardHeader>
            <Heading size='md'>Configure Paymaster</Heading>
          </CardHeader>
          <CardBody>
            <Text>Configure paymaster details for you account operations.</Text>
          </CardBody>
        </Card>
      </ListItem>
    </List>
  </Flex>);
};

export default Settings;