export interface LoginAdminDTO {
  email: string;
  password: string;
}
export interface CreateAdminDTO {
  email: string;
  name: string;
  role: string;
  password?: string;
  buildIn: boolean;
}
