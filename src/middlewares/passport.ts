import { StatusCodes } from 'http-status-codes';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { UserService } from '~/modules/account/user/services/user.service';
import { AppError } from '~/utils/app-error';

import ConfignEnv from '../config/env';
import { EAuthProvider } from '../modules/account/user/model/user.model';

// const cookieExtractor = (req: Request) => {
//   const { accessToken, refreshToken } = req.cookies;
//   try {
//     const reFreshTokenDecoded = jwt.verify(refreshToken, ConfignEnv.JWT_SECRET) as JwtPayload & {
//       id: string;
//     };

//     if (!reFreshTokenDecoded.id) {
//       throw new AppError({
//         id: 'Passport.cookieExtractor',
//         message: 'Token invalid',
//         statusCode: StatusCodes.UNAUTHORIZED,
//       });
//     }
//   } catch (error: any) {
//     throw new AppError({
//       id: 'Passport.cookieExtractor',
//       message: error.message,
//       statusCode: StatusCodes.UNAUTHORIZED,
//     });
//   }
//   return accessToken || null;
// };
// const jwtOptions = {
//   jwtFromRequest: cookieExtractor,
//   secretOrKey: ConfignEnv.JWT_SECRET,
// };
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: ConfignEnv.JWT_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
    try {
      const user = await UserService.getById(jwtPayload.id);

      if (!user) {
        throw new AppError({
          id: 'passport.jwt.err',
          message: 'UNAUTHORIZE',
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }
      if (user) {
        return done(null, user);
      }
    } catch (error) {
      return done(error, false);
    }
  }),
);
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GG_CLIENT_ID as string,
      clientSecret: process.env.GG_SECRET_ID as string,
      callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
      passReqToCallback: true,
    },
    async (req: any, _accessToken: string, _refreshToken: string, profile, done) => {
      try {
        const email = profile.emails?.[0].value || '';
        if (!email)
          throw new AppError({
            id: 'passport.google.err',
            statusCode: StatusCodes.BAD_REQUEST,
            message: 'EMAIL_NOT_VALID',
          });
        const existedUser = (await UserService.getPaginate({ email })).users[0];
        if (existedUser) {
          return done(null, existedUser);
        }

        const user = await UserService.RegisterSocial({
          name: profile.displayName,
          email,
          avatar: profile._json.picture,
          provider: EAuthProvider.Google,
        });
        req.temp = user;

        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    },
  ),
);

export default passport;
