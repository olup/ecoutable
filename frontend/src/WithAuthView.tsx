import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { Button, Container, Flex } from "@mantine/core";
import { FC, ReactNode, useEffect } from "react";
import { trpc } from "./lib/trpc";

export const WithAuthView: FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, login, isLoading } = useKindeAuth();
  const { isLoading: isRegisterLoading, mutate: registerUser } =
    trpc.user.registerUser.useMutation();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    registerUser();
  }, [isAuthenticated]);

  if (isLoading || isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Container>
        <Flex justify="center" align="center" h="100vh">
          <Button onClick={() => login()}>Login</Button>
        </Flex>
      </Container>
    );
  }

  return <div>{children}</div>;
};
