const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    journal: {
        type: Schema.Types.ObjectId,
        ref: 'Journal',
        required: true
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    parentComment: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    replies: [{
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    isEdited: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for like count
commentSchema.virtual('likeCount').get(function() {
    return this.likes.length;
});

// Virtual for reply count
commentSchema.virtual('replyCount').get(function() {
    return this.replies.length;
});

// Pre-save hook to update timestamps
commentSchema.pre('save', function(next) {
    if (this.isModified('content')) {
        this.isEdited = true;
    }
    next();
});

// Static method to add a reply
commentSchema.statics.addReply = async function(commentId, replyData) {
    const parentComment = await this.findById(commentId);
    if (!parentComment) {
        throw new Error('Parent comment not found');
    }
    
    const reply = new this({
        ...replyData,
        journal: parentComment.journal,
        parentComment: commentId
    });
    
    await reply.save();
    
    // Add reply to parent's replies array
    if (!parentComment.replies.includes(reply._id)) {
        parentComment.replies.push(reply._id);
        await parentComment.save();
    }
    
    return reply;
};

// Method to toggle like on a comment
commentSchema.methods.toggleLike = async function(userId) {
    const index = this.likes.indexOf(userId);
    if (index === -1) {
        // Add like
        this.likes.push(userId);
    } else {
        // Remove like
        this.likes.splice(index, 1);
    }
    await this.save();
    return this;
};

// Indexes for better query performance
commentSchema.index({ journal: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
