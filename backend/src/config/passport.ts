import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { prisma } from '../index';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/auth/github/callback';

export function configurePassport() {
  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // GitHub OAuth Strategy
  if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: GITHUB_CLIENT_ID,
          clientSecret: GITHUB_CLIENT_SECRET,
          callbackURL: GITHUB_CALLBACK_URL,
          scope: ['user:email', 'repo', 'read:org'],
        },
        async (
          accessToken: string,
          refreshToken: string,
          profile: any,
          done: (error: any, user?: any) => void
        ) => {
          try {
            // Find or create user
            const existingUser = await prisma.user.findUnique({
              where: { githubId: profile.id },
            });

            if (existingUser) {
              // Update existing user
              const updatedUser = await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  accessToken,
                  refreshToken: refreshToken || existingUser.refreshToken,
                  username: profile.username,
                  name: profile.displayName,
                  avatarUrl: profile.photos?.[0]?.value,
                  email: profile.emails?.[0]?.value,
                },
              });
              return done(null, updatedUser);
            }

            // Create new user
            const newUser = await prisma.user.create({
              data: {
                githubId: profile.id,
                username: profile.username,
                name: profile.displayName,
                email: profile.emails?.[0]?.value,
                avatarUrl: profile.photos?.[0]?.value,
                accessToken,
                refreshToken,
              },
            });

            return done(null, newUser);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );
  } else {
    console.warn('GitHub OAuth credentials not configured. Authentication will not work.');
  }
}
