import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './three2';
import { MobxContext } from './context';
import { store } from './model/service';

// const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
// root.render(
//   <React.StrictMode>
//     <MobxContext.Provider value={store}>
//       <App />
//     </MobxContext.Provider>
//   </React.StrictMode>,
// );

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
