export interface UserIdWithTokens {
  user: {
    id: number;
  };
  access_token: string;
  refresh_token: string;
}
