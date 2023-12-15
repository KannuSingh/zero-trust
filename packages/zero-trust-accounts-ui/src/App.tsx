import {  Link, Route, RouterProvider,createHashRouter, createRoutesFromElements, redirect } from 'react-router-dom';
import Login from './pages/login';
import { Button, Flex, Heading, Text } from '@chakra-ui/react';
import React from 'react';
import Signup from './pages/signup';
import Home from './pages/home';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Authorize from './pages/authorize';



export default function App() {

  const loginRedirectOnAuthorize = async ({request}) => {
    try {
      const url = new URL(request.url);
      if(!url.searchParams.has("user"))
        return redirect(`/login?redirect_url=${encodeURIComponent(`${url.pathname}?${url.searchParams}`)}`);
      return null
    } catch (error) {
      console.log( `Error occurred while loading ${request.url}`)
    }
  };

  const router = createHashRouter(
    createRoutesFromElements(
      <Route path='/'>
          <Route path="authorize" element={<Authorize />} loader={loginRedirectOnAuthorize}/>
          <Route path=":dataSource/:name" element={<Home />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="settings" element={<Settings />} />
          </Route>
					<Route path="signup" element={<Signup />}/>
					<Route path="login" element={<Login />}>
          <Route path="*" element={<NotFoundPage/>}/>
					</Route>
				</Route>
    )
  );
  return (
    <RouterProvider router={router} />
  )
}

const NotFoundPage = () => {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      h="100vh"
      textAlign="center"
    >
      <Heading as="h1" fontSize="6xl" mb={4}>
        404 - Not Found
      </Heading>
      <Text fontSize="xl" mb={8}>
        Oops! The page you are looking for might be in another castle.
      </Text>
      <Button colorScheme="teal" size="lg">
        <Link to="/">Go Home</Link>
      </Button>
    </Flex>
  );
};
