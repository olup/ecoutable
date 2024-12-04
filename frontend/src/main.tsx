import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { Button, createTheme, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@fontsource/lora/400.css";
import "@fontsource/lora/700.css";

const theme = createTheme({
  fontFamily: "Lora, serif",
  fontFamilyMonospace: "Monaco, Courier, monospace",
  headings: { fontFamily: "Lora, serif" },

  components: {
    Button: {
      defaultProps: {
        ff: "sans-serif",
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider forceColorScheme="dark" theme={theme}>
      <App />
    </MantineProvider>
  </React.StrictMode>
);
