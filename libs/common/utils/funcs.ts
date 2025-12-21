import { genSalt, hash } from 'bcryptjs';

const saltRounds = 10;

export async function hashPassword(plainPassword: string): Promise<string> {
  try {
    const salt = await genSalt(saltRounds);
    return await hash(plainPassword, salt);
  } catch (error) {
    console.log(error);
  }
}
