import React from "react";
import { createRoot } from "react-dom/client";
import { CardBuilderApp } from "./App";

const root = createRoot(document.getElementById("root")!);
root.render(<CardBuilderApp />);
