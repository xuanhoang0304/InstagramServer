import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { StatusCodes } from 'http-status-codes';
import ConfignEnv from '../config/env';
import { EAuthProvider } from '../modules/account/user/model/user.model';
import { UserService } from '@/modules/account/user/services/user.service';
import { AppError } from '@/utils/app-error';

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: ConfignEnv.jwt_secret,
};

passport.use(
  new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
    try {
      const user = await UserService.getById(jwtPayload.id);
      if (!user) {
        throw new AppError({
          id: 'passport.jwt.err',
          message: 'UNAUTHORIZE',
          statusCode: StatusCodes.BAD_GATEWAY,
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
      callbackURL: '/api/auth/google/callback',
    },
    async (_accessToken: string, _refreshToken: string, profile, done) => {
      try {
        const email = profile.emails?.[0].value || '';
        if (!email)
          throw new AppError({
            id: 'passport.google.err',
            statusCode: StatusCodes.BAD_REQUEST,
            message: 'EMAIL_NOT_VALID',
          });

        const user = await UserService.RegisterSocial({
          name: profile.displayName,
          email,
          avatar: profile._json.picture,
          provider: EAuthProvider.Google,
        });

        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    },
  ),
);

export default passport;
