import { API_BASE_URL } from "./utils";

// Helper function to make API calls to the team app
export async function fetchFromAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    credentials: "include", // Include cookies for NextAuth session
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: response.statusText,
    }));
    throw new Error(error.error || error.message || "Request failed");
  }

  return response.json();
}

export const postData = async <T>(url: string, data: unknown): Promise<T> => {
  return fetchFromAPI<T>(url, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateData = async <T>(url: string, data: unknown): Promise<T> => {
  return fetchFromAPI<T>(url, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const fetchData = async <T>(url: string): Promise<T> => {
  return fetchFromAPI<T>(url, {
    method: "GET",
  });
};

export const deleteData = async <T>(url: string): Promise<T> => {
  return fetchFromAPI<T>(url, {
    method: "DELETE",
  });
};
