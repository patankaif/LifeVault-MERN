export const safeJsonParse = async (response) => {
  try {
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      // If not JSON, get text response
      const text = await response.text();
      throw new Error(`Expected JSON response, got ${contentType || 'no content-type'}. Response: ${text.substring(0, 200)}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON response from server');
    }
    throw error;
  }
};

export const handleApiError = async (response) => {
  try {
    const data = await safeJsonParse(response);
    throw new Error(data.message || 'Request failed');
  } catch (error) {
    if (error.message.includes('Expected JSON') || error.message.includes('Invalid JSON')) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    throw error;
  }
};
