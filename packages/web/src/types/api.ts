declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

/** Token armazenado no localStorage para chamadas à API autenticada */
export type AccessToken = Brand<string, 'AccessToken'>;

export type ApiSuccess<T> = { data: T };
export type ApiErrorBody = {
  error: { message: string; code: string };
};

export type WaterType = 'FRESHWATER' | 'SALTWATER' | 'BRACKISH';

export type AquariumListItem = {
  id: string;
  name: string;
  volumeLiters: number;
  waterType: WaterType;
  isActive: boolean;
  aliveQuantity: number;
  lastWaterTest: {
    id: string;
    testedAt: string;
    summary: 'ok' | 'warning' | 'unknown';
  } | null;
};

export type Paginated<T> = {
  items: T[];
  meta: { page: number; perPage: number; total: number; totalPages: number };
};

export type TestParameter = {
  id: string;
  name: string;
  unit: string;
  description: string | null;
  createdAt: string;
  ranges?: {
    id: string;
    waterType: WaterType;
    idealMin: number | null;
    idealMax: number | null;
  }[];
};

export type WaterTestResult = {
  id: string;
  value: number;
  isWithinRange: boolean | null;
  testParameter: TestParameter;
};

export type WaterTest = {
  id: string;
  testedAt: string;
  notes: string | null;
  results: WaterTestResult[];
};

export type Animal = {
  id: string;
  speciesName: string;
  commonName: string;
  quantity: number;
  status: 'ALIVE' | 'DEAD' | 'DONATED' | 'TRANSFERRED';
  addedDate: string;
  removedDate: string | null;
  notes: string | null;
};

export type WaterChange = {
  id: string;
  changedAt: string;
  volumeLiters: number;
  percentVolume: number | null;
  usedDechlorinator: boolean;
  notes: string | null;
};

export type Equipment = {
  id: string;
  type: string;
  brand: string | null;
  model: string | null;
  installedAt: string | null;
  lastMaintenanceAt: string | null;
  nextMaintenanceAt: string | null;
  notes: string | null;
};

export type Dosing = {
  id: string;
  productName: string;
  amountMl: number;
  dosedAt: string;
  purpose: string | null;
  notes: string | null;
};

export type AquariumNote = {
  id: string;
  content: string;
  createdAt: string;
};
