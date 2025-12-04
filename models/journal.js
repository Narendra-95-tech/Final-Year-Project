const mongoose = require('mongoose');
const { Schema } = mongoose;

const ImageSchema = new Schema({
    url: String,
    filename: String
});

ImageSchema.virtual('thumbnail').get(function() {
    return this.url.replace('/upload', '/upload/w_200');
});

const JournalSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    images: [ImageSchema],
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true }
});

JournalSchema.virtual('likeCount').get(function() {
    return this.likes.length;
});

module.exports = mongoose.model('Journal', JournalSchema);
