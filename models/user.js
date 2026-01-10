const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    name: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    username: {
        type: String,
        unique: true,
        trim: true,
        sparse: true
    },
    firstName: String,
    lastName: String,
    avatar: {
        url: String,
        filename: String
    },
    bio: {
        type: String,
        maxlength: 500
    },
    location: String,
    website: String,
    social: {
        facebook: String,
        twitter: String,
        instagram: String
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    followers: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    notifications: [{
        type: Schema.Types.ObjectId,
        ref: 'Notification'
    }],
    savedPosts: [{
        type: Schema.Types.ObjectId,
        ref: 'Journal'
    }],
    preferences: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        privacy: {
            profile: {
                type: String,
                enum: ['public', 'followers', 'private'],
                default: 'public'
            },
            activity: {
                type: String,
                enum: ['public', 'followers', 'private'],
                default: 'public'
            }
        }
    },
    lastActive: Date,

    // Host profile fields
    hostingSince: {
        type: Date,
        default: Date.now
    },
    responseRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 100
    },
    responseTime: {
        type: String,
        default: 'within a few hours'
    },
    verifiedHost: {
        type: Boolean,
        default: false
    },
    wishlist: [{
        type: Schema.Types.ObjectId,
        ref: 'Listing'
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function () {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.username;
});

// Virtual for user's posts
userSchema.virtual('posts', {
    ref: 'Journal',
    localField: '_id',
    foreignField: 'author'
});

// Virtual for user's reviews
userSchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'author'
});

// Virtual for user's listings (as host)
userSchema.virtual('listings', {
    ref: 'Listing',
    localField: '_id',
    foreignField: 'owner'
});

// Virtual for properties count
userSchema.virtual('propertiesCount', {
    ref: 'Listing',
    localField: '_id',
    foreignField: 'owner',
    count: true
});

// Add passport-local-mongoose to handle password hashing and authentication
userSchema.plugin(passportLocalMongoose, {
    usernameField: 'email',
    usernameQueryFields: ['email', 'username']
});

// Method to get public profile data
userSchema.methods.getPublicProfile = function () {
    const user = this.toObject();
    delete user.hash;
    delete user.salt;
    delete user.email;
    delete user.followers;
    delete user.following;
    delete user.notifications;
    delete user.savedPosts;
    delete user.preferences;
    delete user.lastActive;
    return user;
};

// Pre-save hook to ensure username is set
userSchema.pre('save', function (next) {
    if (!this.username && this.email) {
        this.username = this.email.split('@')[0];
    }
    next();
});

module.exports = mongoose.model('User', userSchema);