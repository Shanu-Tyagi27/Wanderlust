if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path"); //FOR VIEWS
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const MongoStore = require("connect-mongo");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js"); // This will connect the listing.js router here
const reviewRouter = require("./routes/review.js"); // This will connect the review.js router here
const userRouter = require("./routes/user.js"); //This will connect the user.js router here

const dbUrl = process.env.ATLASDB_URL;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true })); // USED TO PARSE THE DATA FROM req.params
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter:24*3600,
});

store.on("error",()=>{
  console.log("ERROR in MONGO SESSION STORE",err);
})

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

app.use(passport.initialize()); // from here
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate())); // every user and request will go through this

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser()); //to here all lines are to use passport

app.use((req, res, next) => {
  res.locals.successAdded = req.flash("success");
  res.locals.successDeleted = req.flash("deletion");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user; // We are saving this to access the user in navbar.ejs
  next();
});

async function main() {
  // await mongoose.connect('mongodb://127.0.0.1:27017/Wanderlust');
  await mongoose.connect(dbUrl);
}
main()
  .then((res) => {
    console.log("Connected to Database");
  })
  .catch((err) => {
    console.log("Some error occured", err);
  });


//Whole listings routes are removed and only this line is required
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter); // this reviews is coming from up(const reviews = require....)
app.use("/", userRouter);
//  /listings/:id/reviews actually this whole route resides inside app.js and doesn't go inside review.js so for that


app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("error.ejs", { err });
  //   res.status(statusCode).send(message);
});
app.listen(8080, () => {
  console.log("Server listening to port 8080");
});

