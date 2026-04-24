const mongoose = require('mongoose');

if (!process.env.CONNECTION_STRING) {
    console.error('Missing CONNECTION_STRING in .env');
} else {
    mongoose.connect(process.env.CONNECTION_STRING)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB', err));
}

const userSchema = new mongoose.Schema({
    googleId: String,
    name: String,
    email: String,
    picture: String
});

const bookmarkSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    tmdbId: { type: String, required: true },
    mediaType: { type: String, enum: ['movie', 'tv'], required: true },
    addedAt: { type: Date, default: Date.now }
});
bookmarkSchema.index({ userId: 1, tmdbId: 1, mediaType: 1 }, { unique: true });

const watchlistSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    name: { type: String, required: true },
    items: [{
        tmdbId: String,
        mediaType: { type: String, enum: ['movie', 'tv'] },
        addedAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

const watchHistorySchema = new mongoose.Schema({
    userId: { type: String, required: true },
    tmdbId: { type: String, required: true },
    mediaType: { type: String, enum: ['movie', 'tv'], required: true },
    season: Number,
    episode: Number,
    progress: Number,
    currentTime: Number,
    duration: Number,
    lastWatchedAt: { type: Date, default: Date.now }
});
watchHistorySchema.index({ userId: 1, tmdbId: 1, mediaType: 1, season: 1, episode: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);
const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
const Watchlist = mongoose.model('Watchlist', watchlistSchema);
const WatchHistory = mongoose.model('WatchHistory', watchHistorySchema);

module.exports = { User, Bookmark, Watchlist, WatchHistory };