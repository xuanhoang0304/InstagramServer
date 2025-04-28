import { EAuthProvider, UserModel } from '../../user/model/user.model';
import { RegisterDTO } from '../dtos/auth.dtos';

export class AuthRepository {
  static async register(data: RegisterDTO) {
    const result = (
      await UserModel.create({ ...data, provider: EAuthProvider.Account })
    ).toObject();
    const { password, ...newUser } = result;
    return newUser;
  }
  static async registerBySocial(payload: {
    data: RegisterDTO;
    provider: EAuthProvider;
    providerId: string;
  }) {
    const { data, provider, providerId } = payload;

    const user = await UserModel.create({
      ...data,
      provider,
      providerId,
    });

    return user.toObject();
  }
}
