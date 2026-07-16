export interface LoginResponse {
  id: number;
  username: string;
  name: string;
  password?: string;
  role?: string;
  newPassword?: string;
  avatar?: string;
  invitation?: string;
  accessToken: string;
  refreshToken?: string;
  level: string;
  email: string;
  verification?: string;
  type?: string;
  rocketChatToken?: string;
  rocketChatUserId?: string;
  nwAccessToken: string;
}