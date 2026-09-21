const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = typeof data.detail === 'string'
      ? data.detail
      : data.detail?.message || data.message || 'An error occurred.';
    throw new ApiError(res.status, msg, data.detail);
  }

  return data as T;
}

// ─── ATS Engine ───────────────────────────────────────────────────────────

export const atsApi = {
  analyze: (formData: FormData) =>
    fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new ApiError(res.status, data.detail || 'Analysis failed.', data.detail);
      return data;
    }),

  rewriteBullet: (body: {
    original_text: string;
    target_role: string;
    target_company?: string;
  }) =>
    request<unknown>('/rewriter/bullet', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export { ApiError, API_BASE };
