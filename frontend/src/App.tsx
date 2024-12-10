import { QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "./lib/trpc";
import { HomeView } from "./views/HomeView";
import { KindeProvider } from "@kinde-oss/kinde-auth-react";
import { WithAuthView } from "./WithAuthView";
import { WithTrpcClient } from "./WithTrpcClient";
import { Route, useLocation } from "wouter";
import { ArticleView } from "./views/ArticleView";
import { Box } from "@mantine/core";

export function App() {
  return (
    <KindeProvider
      clientId="2aa945d2060544f4a2a7d8173d40aabf"
      domain="https://auth.ecoutable.club"
      redirectUri={window.location.origin}
      logoutUri={window.location.origin}
    >
      <WithTrpcClient>
        <WithAuthView>
          <Box bg="gray.1" mih="100vh">
            <Route path="/" component={HomeView} />
            <Route path="/article/:uuid" component={ArticleView} />
          </Box>
        </WithAuthView>
      </WithTrpcClient>
    </KindeProvider>
  );
}
