export interface RegisterDTO {
  name: string;
  age?: number;
  email: string;
  password: string;
}

export interface LoginDTO {
  username: string;
  password: string;
}
