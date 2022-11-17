import React from 'react';
import { store } from './model/service';

export const MobxContext = React.createContext(store);

export const useStore = () => {
  return React.useContext(MobxContext);
};
