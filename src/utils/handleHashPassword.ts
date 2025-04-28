import bcrypt from 'bcryptjs';

export default async function handleHashPassword(password: string) {
  return bcrypt.hash(password, 10);
}
