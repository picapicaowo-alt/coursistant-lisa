export interface ProfileResponse {
  userId: number;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  email: string;
  role: string;
  level: string | null;
  avatarUrl: string | null;
  emailNotifications: boolean;
}

export interface UpdateProfileRequest {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  emailNotifications?: boolean;
}
