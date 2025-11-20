// Error handler utility for consistent error handling across the app

export const handleFetchError = (error: any, context: string = 'API'): void => {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    console.error(`${context}: Network error or CORS issue. Make sure the server is running.`);
  } else {
    console.error(`${context}: Error -`, error);
  }
};

export const isAuthError = (error: any): boolean => {
  return error?.message?.includes('Unauthorized') || 
         error?.status === 401 || 
         error?.message?.includes('Invalid token');
};

export const safeJsonParse = async (response: Response): Promise<any> => {
  try {
    return await response.json();
  } catch (error) {
    console.error('Failed to parse JSON response:', error);
    return null;
  }
};
