// Shared types and utilities across frontend and backend

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
}
