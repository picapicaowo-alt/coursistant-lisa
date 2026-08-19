import {createRoot} from 'react-dom/client'
import './styles/tokens.global.scss'
import './index.css'
import App from './App'
import {QueryProvider} from "@/providers/QueryProvider";
import React from "react";
import './i18n';
import {enableMapSet} from "immer"
import {getAppEnv} from '@/config/env';

enableMapSet();
getAppEnv();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <App/>
    </QueryProvider>
  </React.StrictMode>,
);
