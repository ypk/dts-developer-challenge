export interface APIResponse<T> {
  data: T;
  message?: string;
}

export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
