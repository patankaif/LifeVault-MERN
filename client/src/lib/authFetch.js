export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('lifeVaultToken');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized globally
  if (response.status === 401) {
    localStorage.removeItem('lifeVaultToken');
    // Only redirect if we're not already on the login page
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  return response;
};

export const jsonFetch = async (url, options = {}) => {
  const response = await authFetch(url, options);
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  
  // If not JSON, it might be an error page (HTML)
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed with status ${response.status}: ${text.substring(0, 100)}`);
  }
  
  return { success: response.ok };
};
