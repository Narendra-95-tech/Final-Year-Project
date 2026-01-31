require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');

mongoose.connect(process.env.ATLASDB_URL)
    .then(async () => {
        const user = await User.findOne({ username: 'Narendra' });
        if (user) {
            process.stdout.write(JSON.stringify({
                username: user.username,
                email: user.email,
                role: user.role
            }, null, 2));
        } else {
            console.log('User not found');
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
