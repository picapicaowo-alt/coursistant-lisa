import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App.js'
import {QueryProvider} from "@/providers/QueryProvider";
import React from "react";
import './i18n';
import {enableMapSet} from "immer"

enableMapSet();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <App/>
    </QueryProvider>
  </React.StrictMode>,
);