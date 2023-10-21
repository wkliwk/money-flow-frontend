export interface ExpenseRequest {
  owner: string;
  description: string;
  purpose: string;
  currentLocation: string;
  type: string;
  parent: string;
  status: string;
  profit: number;
  startDate?: Date | null;
  endDate?: Date | null;
  amount: number;
}

export interface ExpenseResponse {
  _id: string;
  owner: string;
  description?: string;
  purpose?: string;
  currentLocation?: string;
  type?: string;
  parent?: string;
  status?: string;
  profit?: number;
  startDate?: Date;
  endDate?: Date;
  amount: number;
}
