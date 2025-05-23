/**
 * API Response Data Transfer Objects
 * @module ResponseDTO
 * @description Defines standardized response structures for API endpoints
 */

/**
 * Generic API response wrapper for successful operations
 * @interface APIResponse
 * @template T - The type of data returned in the response
 */
export interface APIResponse<T> {
  data: T;
  message?: string;
}

/**
 * Standard error response structure
 * @interface ErrorResponse
 * @description Used for communicating errors to API consumers
 */
export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
  };
}

/**
 * Metadata for paginated responses
 * @interface PaginationMeta
 * @description Contains information about the pagination state
 */
export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Wrapper for paginated response data
 * @interface PaginatedResponse
 * @template T - The type of items in the paginated collection
 * @description Standard structure for returning paginated collections of items
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
