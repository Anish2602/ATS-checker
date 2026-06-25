const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export type ApiResponse<T = unknown> = {
  status: string;
  message?: string;
} & T;

export interface User {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  profile_picture: string;
  auth_provider: 'email' | 'google' | 'apple';
  subscription_plan: string;
  ats_credits: number;
}

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
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers,
    },
    ...options,
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

// ─── Auth ──────────────────────────────────────────────────────────────────

export const authApi = {
  signup: (body: {
    email: string;
    password: string;
    full_name: string;
  }) =>
    request<ApiResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<ApiResponse<{ user: User }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  logout: () =>
    request<ApiResponse>('/auth/logout', { method: 'POST' }),

  session: () =>
    request<ApiResponse<{ user: User }>>('/auth/session'),

  me: () =>
    request<User>('/auth/me'),

  googleAuth: (credential: string) =>
    request<ApiResponse<{ user: User }>>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),

  appleAuth: (identity_token: string, full_name?: string) =>
    request<ApiResponse<{ user: User }>>('/auth/apple', {
      method: 'POST',
      body: JSON.stringify({ identity_token, full_name }),
    }),

  forgotPassword: (email: string) =>
    request<ApiResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, new_password: string) =>
    request<ApiResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password }),
    }),

  verifyEmail: (token: string) =>
    request<ApiResponse>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  resendVerification: (email: string) =>
    request<ApiResponse>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  refresh: () =>
    request<ApiResponse>('/auth/refresh', { method: 'POST' }),
};

// ─── User ──────────────────────────────────────────────────────────────────

export const userApi = {
  updateProfile: (body: {
    first_name?: string;
    last_name?: string;
    profile_picture?: string;
  }) =>
    request<ApiResponse>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  getResumes: () =>
    request<{ id: string; file_name: string; created_at: string }[]>('/user/resumes'),

  getHistory: () =>
    request<unknown[]>('/user/history'),

  deleteAccount: () =>
    request<ApiResponse>('/user/account', { method: 'DELETE' }),
};

// ─── ATS Engine ───────────────────────────────────────────────────────────

export const atsApi = {
  analyze: (formData: FormData) =>
    fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
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
