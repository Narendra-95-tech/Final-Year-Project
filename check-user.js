require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');

mongoose.connect(process.env.ATLASDB_URL)
    .then(async () => {
        const user = await User.findOne({ username: 'Narendra' });
        if (user) {
            console.log('--- USER DATA ---');
            console.log('Username:', user.username);
            console.log('Email:', user.email);
            console.log('Role:', user.role);
            console.log('-----------------');
        } else {
            console.log('❌ ERROR: User Narendra not found.');
        }
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ CONNECTION ERROR:', err);
        process.exit(1);
    });
