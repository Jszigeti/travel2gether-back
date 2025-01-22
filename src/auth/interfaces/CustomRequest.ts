namespace Express {
  export interface Request {
    user: {
      sub: number;
    };
    token: string;
  }
}
