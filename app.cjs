require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { User, Bookmark, Watchlist, WatchHistory } = require("./db.cjs");

const app = express();
app.use(express.json());
const port = 5200;

app.use(
  session({
    secret: process.env.SESSION_SECRET || "super_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
        proxy: true,
      },
      function (accessToken, refreshToken, profile, done) {
        return done(null, profile);
      },
    ),
  );
}

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/");
  },
);

app.get("/api/current_user", (req, res) => {
  res.json(req.user || null);
});

app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

app.get("/api/bookmarks", requireAuth, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user.id });
    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/bookmarks", requireAuth, async (req, res) => {
  const { tmdbId, mediaType } = req.body;
  try {
    const bookmark = new Bookmark({ userId: req.user.id, tmdbId, mediaType });
    await bookmark.save();
    res.json({ success: true, bookmark });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/bookmarks", requireAuth, async (req, res) => {
  const { tmdbId, mediaType } = req.body;
  try {
    await Bookmark.deleteOne({ userId: req.user.id, tmdbId, mediaType });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/watchlists", requireAuth, async (req, res) => {
  try {
    const watchlists = await Watchlist.find({ userId: req.user.id });
    res.json(watchlists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/watchlists", requireAuth, async (req, res) => {
  const { name } = req.body;
  try {
    const watchlist = new Watchlist({ userId: req.user.id, name, items: [] });
    await watchlist.save();
    res.json(watchlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/watchlists/add", requireAuth, async (req, res) => {
  const { listIds, tmdbId, mediaType } = req.body;
  try {
    await Watchlist.updateMany(
      { _id: { $in: listIds }, userId: req.user.id },
      { $addToSet: { items: { tmdbId, mediaType } } },
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/history", requireAuth, async (req, res) => {
  const {
    tmdbId,
    mediaType,
    season,
    episode,
    progress,
    currentTime,
    duration,
  } = req.body;
  try {
    const filter = {
      userId: req.user.id,
      tmdbId,
      mediaType,
      season: season || null,
      episode: episode || null,
    };
    const update = {
      progress,
      currentTime,
      duration,
      lastWatchedAt: Date.now(),
    };
    const history = await WatchHistory.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
    });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/history", requireAuth, async (req, res) => {
  try {
    const history = await WatchHistory.find({ userId: req.user.id }).sort({
      lastWatchedAt: -1,
    });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(express.static("./Frontend/public"));

app.get("/history", requireAuth, (req, res) => {
  res.status(200).sendFile(path.resolve("./Frontend/public/history.html"));
});

app.get("/search", (req, res) => {
  const filePath = path.resolve("./search.html");
  const { query } = req.query;
  if (!query) {
    res.redirect("/");
    return;
  }
  // console.log(query)
  // console.log(filePath);
  // console.log(require('fs').existsSync(filePath));
  res.status(200).sendFile(filePath);
  // res.end()
});

app.get("/", (req, res) => {
  res.sendFile(path.resolve("./index.html"));
});

app.get("/:type/:id", (req, res) => {
  const { type, id } = req.params;
  if (type == "movie") {
    res.status(200).sendFile(path.resolve("./Frontend/movie.html"));
  } else if (type == "tv") {
    res.status(200).sendFile(path.resolve("./Frontend/tv.html"));
  }
  res.end();
});

app.get("/page", (req, res) => {
  const { type, id } = req.query;
  console.log(type, id);
  if (type == "movie") {
    res.status(200).sendFile(path.resolve("./movie.html"));
  }
  if (type === "tv") {
    res.status(200).sendFile(path.resolve("./tv.html"));
  }
});

app.get("/play", (req, res) => {
  res.status(200).sendFile(path.resolve("./media.html"));
});

app.use((req, res) => {
  res.status(404).send("Resource not found");
});

app.listen(port, () => {
  console.log(`Started listening on port ${port}...`);
});
