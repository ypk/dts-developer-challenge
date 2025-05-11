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
  /** The main response data */
  data: T;
  /** Optional message providing additional context about the response */
  message?: string;
}

/**
 * Standard error response structure
 * @interface ErrorResponse
 * @description Used for communicating errors to API consumers
 */
export interface ErrorResponse {
  /** Error details object */
  error: {
    /** Human-readable error message */
    message: string;
    /** Optional error code for client-side error handling */
    code?: string;
  };
}

/**
 * Metadata for paginated responses
 * @interface PaginationMeta
 * @description Contains information about the pagination state
 */
export interface PaginationMeta {
  /** Total number of items across all pages */
  total: number;
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages available */
  totalPages: number;
}

/**
 * Wrapper for paginated response data
 * @interface PaginatedResponse
 * @template T - The type of items in the paginated collection
 * @description Standard structure for returning paginated collections of items
 */
export interface PaginatedResponse<T> {
  /** Array of paginated items */
  data: T[];
  /** Pagination metadata */
  meta: PaginationMeta;
}
