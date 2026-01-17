const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['like', 'comment', 'follow', 'mention', 'message', 'booking'],
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    link: String, // URL to the related content
    content: String, // Additional context about the notification
    metadata: {
        // Store any additional data specific to the notification type
        postId: Schema.Types.ObjectId,
        commentId: Schema.Types.ObjectId,
        bookingId: Schema.Types.ObjectId,
        message: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for faster querying
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

// Pre-save hook to ensure content is set based on type
notificationSchema.pre('save', function (next) {
    if (!this.content) {
        switch (this.type) {
            case 'like':
                this.content = 'liked your post';
                break;
            case 'comment':
                this.content = 'commented on your post';
                break;
            case 'follow':
                this.content = 'started following you';
                break;
            case 'mention':
                this.content = 'mentioned you in a post';
                break;
            case 'message':
                this.content = 'sent you a message';
                break;
            case 'booking':
                this.content = 'received a new booking';
                break;
        }
    }
    next();
});

// Static method to create a new notification
notificationSchema.statics.createNotification = async function (userId, senderId, type, options = {}) {
    const notification = new this({
        user: userId,
        sender: senderId,
        type,
        link: options.link,
        content: options.content,
        metadata: options.metadata
    });

    await notification.save();
    return notification;
};

// Method to mark notification as read
notificationSchema.methods.markAsRead = async function () {
    if (!this.read) {
        this.read = true;
        await this.save();
    }
    return this;
};

module.exports = mongoose.model('Notification', notificationSchema);
