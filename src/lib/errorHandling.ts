import { toast } from "@/hooks/use-toast";

// Error types for better categorization
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

// Interface for structured error responses
export interface AppError {
  type: ErrorType;
  message: string;
  details?: string;
  field?: string;
}

// User-friendly error messages mapping
const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: "Please check your internet connection and try again.",
  TIMEOUT_ERROR: "The request took too long. Please try again.",
  
  // Authentication errors
  INVALID_CREDENTIALS: "Invalid email or password. Please check your credentials and try again.",
  TOKEN_EXPIRED: "Your session has expired. Please log in again.",
  UNAUTHORIZED: "You don't have permission to access this resource.",
  
  // Validation errors
  REQUIRED_FIELD: "This field is required.",
  INVALID_EMAIL: "Please enter a valid email address.",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters long.",
  PASSWORDS_DONT_MATCH: "Passwords do not match.",
  
  // User management errors
  USER_NOT_FOUND: "User not found. Please check the details and try again.",
  EMAIL_ALREADY_EXISTS: "An account with this email already exists.",
  
  // Skills and matching errors
  NO_SKILLS_FOUND: "No skills found. Try adjusting your search criteria.",
  MATCHING_FAILED: "Unable to find matches at the moment. Please try again later.",
  PROFILE_INCOMPLETE: "Please complete your profile to enable skill matching.",
  
  // Messages errors
  MESSAGE_SEND_FAILED: "Failed to send message. Please try again.",
  CONVERSATION_NOT_FOUND: "Conversation not found or no longer available.",
  
  // File upload errors
  FILE_TOO_LARGE: "File size is too large. Please choose a smaller file.",
  INVALID_FILE_TYPE: "Invalid file type. Please choose a different file.",
  
  // Generic errors
  GENERIC_ERROR: "Something went wrong. Please try again.",
  SERVER_ERROR: "Server is temporarily unavailable. Please try again later.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please contact support if this persists."
};

// Function to extract error type from HTTP status codes
export function getErrorTypeFromStatus(status: number): ErrorType {
  switch (true) {
    case status === 401:
      return ErrorType.AUTHENTICATION;
    case status === 403:
      return ErrorType.AUTHORIZATION;
    case status === 404:
      return ErrorType.NOT_FOUND;
    case status >= 400 && status < 500:
      return ErrorType.VALIDATION;
    case status >= 500:
      return ErrorType.SERVER;
    default:
      return ErrorType.UNKNOWN;
  }
}

// Function to get user-friendly error message
export function getUserFriendlyMessage(error: any): string {
  // Handle network errors
  if (!navigator.onLine) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  // Handle axios/fetch errors
  if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT_ERROR;
  }
  
  // Handle API response errors
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    // Use backend error message if it's user-friendly
    if (data?.message && !data.message.toLowerCase().includes('error')) {
      return data.message;
    }
    
    // Map status codes to user-friendly messages
    switch (status) {
      case 400:
        if (data?.field) {
          return `Invalid ${data.field}. Please check and try again.`;
        }
        return data?.message || "Please check your input and try again.";
      case 401:
        return ERROR_MESSAGES.INVALID_CREDENTIALS;
      case 403:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 404:
        return ERROR_MESSAGES.USER_NOT_FOUND;
      case 409:
        return ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
      case 422:
        return data?.message || "Please check your input and try again.";
      case 500:
        return ERROR_MESSAGES.SERVER_ERROR;
      default:
        return ERROR_MESSAGES.GENERIC_ERROR;
    }
  }
  
  // Handle specific error messages
  const errorMessage = error.message?.toLowerCase() || '';
  
  if (errorMessage.includes('email') && errorMessage.includes('exist')) {
    return ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
  }
  
  if (errorMessage.includes('password') && errorMessage.includes('invalid')) {
    return ERROR_MESSAGES.INVALID_CREDENTIALS;
  }
  
  if (errorMessage.includes('token') && errorMessage.includes('expired')) {
    return ERROR_MESSAGES.TOKEN_EXPIRED;
  }
  
  // Default fallback
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

// Enhanced toast error function
export function showErrorToast(error: any, title?: string) {
  const message = getUserFriendlyMessage(error);
  
  toast({
    title: title || "Error",
    description: message,
    variant: "destructive",
  });
}

// Success toast helper
export function showSuccessToast(message: string, title?: string) {
  toast({
    title: title || "Success",
    description: message,
    variant: "default",
  });
}

// Warning toast helper
export function showWarningToast(message: string, title?: string) {
  toast({
    title: title || "Warning",
    description: message,
    variant: "destructive", // You might want to create a warning variant
  });
}

// Field-specific error handling for forms
export function getFieldError(fieldName: string, error: any): string {
  if (error.response?.data?.errors?.[fieldName]) {
    return error.response.data.errors[fieldName];
  }
  
  switch (fieldName.toLowerCase()) {
    case 'email':
      if (error.message?.includes('email')) {
        return ERROR_MESSAGES.INVALID_EMAIL;
      }
      break;
    case 'password':
      if (error.message?.includes('password')) {
        return ERROR_MESSAGES.PASSWORD_TOO_SHORT;
      }
      break;
    default:
      return getUserFriendlyMessage(error);
  }
  
  return ERROR_MESSAGES.GENERIC_ERROR;
}

// Async operation wrapper with error handling
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  successMessage?: string,
  errorTitle?: string
): Promise<T | null> {
  try {
    const result = await operation();
    
    if (successMessage) {
      showSuccessToast(successMessage);
    }
    
    return result;
  } catch (error) {
    console.error('Async operation failed:', error);
    showErrorToast(error, errorTitle);
    return null;
  }
}