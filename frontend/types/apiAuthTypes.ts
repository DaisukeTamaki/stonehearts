export interface GoogleLoginResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  last_login_at: string;
}
