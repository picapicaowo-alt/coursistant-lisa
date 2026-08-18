export interface ProfileResponse {
  userId: number;
  displayName: string;
  email: string;
  role: string;
  level: string | null;
  avatarUrl: string | null;
  emailNotifications: boolean;
}

export interface UpdateProfileRequest {
  displayName?: string;
  emailNotifications?: boolean;
}
