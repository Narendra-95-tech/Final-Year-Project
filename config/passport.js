const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : undefined;
        const name = profile.displayName;
        const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : undefined;

        let user = await User.findOne({ googleId });

        if (!user && email) {
          user = await User.findOne({ email: email.toLowerCase() });
          if (user) {
            user.googleId = googleId;
            if (!user.name && name) user.name = name;
            if (avatar && (!user.avatar || !user.avatar.url)) {
              user.avatar = { url: avatar, filename: '' };
            }
            await user.save();
            return done(null, user);
          }
        }

        if (!user) {
          user = new User({
            googleId,
            name: name || (email ? email.split('@')[0] : 'User'),
            email: email ? email.toLowerCase() : undefined,
            avatar: avatar ? { url: avatar, filename: '' } : undefined
          });
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

module.exports = passport;
