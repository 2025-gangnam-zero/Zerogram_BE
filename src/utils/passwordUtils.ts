import bcryptjs from "bcryptjs";
import { PASSWORD_SALT } from "../constants";

export const hashPassword = async (password: string) => {
  const salt = await bcryptjs.genSalt(PASSWORD_SALT);

  return await bcryptjs.hash(password, salt);
};

export const checkPassword = async (
  password: string,
  hashedPassword: string
) => {
  return await bcryptjs.compare(password, hashedPassword);
};
