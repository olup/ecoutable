import { QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "./lib/trpc";
import { View } from "./View";
import { MantineProvider } from "@mantine/core";
import { KindeProvider } from "@kinde-oss/kinde-auth-react";
import { WithAuthView } from "./WithAuthView";
import { WithTrpcClient } from "./WithTrpcClient";
import { Route, useLocation } from "wouter";
import { ArticleView } from "./components/ArticleView";

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
          <Route path="/" component={View} />
          <Route path="/article/:uuid" component={ArticleView} />
        </WithAuthView>
      </WithTrpcClient>
    </KindeProvider>
  );
}
