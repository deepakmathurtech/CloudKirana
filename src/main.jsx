import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './styles/supplyChain.css';
import './styles/auth.css';
import './styles/shopkeeper.css';
import './styles/delivery.css';
import './styles/transfers.css';
import './styles/personalization.css';
import './styles/procurement.css';
import './styles/ledger.css';
import './styles/responsive.css';

createRoot(document.getElementById('root')).render(<App />);
