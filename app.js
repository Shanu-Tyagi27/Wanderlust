if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path"); // FOR VIEWS
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const MongoStore = require("connect-mongo");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js"); // listings router
const reviewRouter = require("./routes/review.js"); // reviews router
const userRouter = require("./routes/user.js"); // users router

const dbUrl = process.env.ATLASDB_URL;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true })); // parse req.body
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.successAdded = req.flash("success");
  res.locals.successDeleted = req.flash("deletion");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

async function main() {
  await mongoose.connect(dbUrl);
}
main()
  .then(() => {
    console.log("Connected to Database");
  })
  .catch((err) => {
    console.log("Some error occurred", err);
  });

// ---------------- ROOT ROUTE ----------------
app.get("/", (req, res) => {
  res.redirect("/listings");
});

// ROUTES
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("error.ejs", { err });
});

app.listen(8080, () => {
  console.log("Server listening to port 8080");
});
