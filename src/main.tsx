import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import ptBR from 'antd/locale/pt_BR';
import 'antd/dist/reset.css';
import './styles.css';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={ptBR}
      theme={{
        token: {
          colorPrimary: '#d97706',
          colorInfo: '#2563eb',
          borderRadius: 14,
          fontFamily: '"Avenir Next", "Trebuchet MS", "Gill Sans", sans-serif'
        }
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
