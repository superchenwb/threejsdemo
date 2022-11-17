import { action, makeObservable, observable } from 'mobx';
import { IService } from '../types';

export class Service {
  currentService?: IService;

  constructor() {
    makeObservable(this, {
      currentService: observable,
      setCurrentService: action,
    });
  }

  setCurrentService(currentService?: IService) {
    this.currentService = currentService;
  }
}

export const store = new Service();
