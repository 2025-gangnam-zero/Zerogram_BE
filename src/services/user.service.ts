import { Types } from "mongoose";

class UserService {
  async getUserById(_id: Types.ObjectId): Promise<any> {
    try {
    } catch (err) {
      throw err;
    }
  }
}

export default new UserService();
