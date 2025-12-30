const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError");
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");
const userRoutes =require("./routes/users");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const passport = require("passport");

main().catch((err) => console.log(err));

async function main() {
  await mongoose.set("strictQuery", false);
  await mongoose.connect("mongodb://127.0.0.1:27017/yelp-camp");
}

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

const sessionConfig = {
  secret:"thisshouldbeabettersecret!",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
  }
}
app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

// adding user model to authenticate method provided by passport-local-mongoose
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
})

app.get('/fakeUser', async(req, res) => {
  const user = new User({
    email:'rivaldi@gmail.com',
    username:'rivaldi'
  })
  const newUser = await User.register(user,'chicken1');
  res.send(newUser);
})

app.use('/', userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.get("/", (req, res) => {
  res.render("home");
});


app.all(/(.*)/, (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh no, Something went wrong";
  res.status(statusCode).render("errors", { err });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
