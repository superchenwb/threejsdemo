export interface IService {
  name: string;
  data: Record<string, any>;
}

export interface IPosition {
  x: number;
  y?: number;
  z: number;
}
