import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./style.css";
import { createTheme, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@fontsource/lora/400.css";
import "@fontsource/lora/700.css";
import "@fontsource/geist-sans/400.css";
import "@fontsource/geist-sans/700.css";
import { shadcnTheme } from "./theme";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="auto" theme={shadcnTheme}>
      <App />
    </MantineProvider>
  </React.StrictMode>
);
