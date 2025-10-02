const Listing = require("./models/listing");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema,reviewSchema } = require("./schema"); // Validate client side schema by joi and review also
const Review = require("./models/review.js");

//Created for user authentication to check if user is logged in or not

module.exports.isLoggedIn = (req,res,next)=>{
  console.log("user details: ",req.user);
    if(!req.isAuthenticated()){
      //to redirect user to the url if he was not logged in first
      req.session.redirectUrl = req.originalUrl;
    req.flash("error","You must be logged in to create or modify listing!");
    return res.redirect("/login");
  }
  next();
}

//Creating for redirecting user to the url if he was not logged in first

module.exports.saveRedirectUrl = (req,res,next)=>{
  if(req.session.redirectUrl){
    res.locals.redirectUrl= req.session.redirectUrl;
  }
  next();
}

module.exports.isOwner = async(req,res,next)=>{
  let {id}=req.params;
  let listing = await Listing.findById(id);
    if(!listing.owner.equals(res.locals.currUser._id)){
      req.flash("error","You don't have permission to edit or delete.");
      return res.redirect(`/listings/${id}`);
    }
    next();
}

module.exports.isReviewAuthor = async(req,res,next)=>{
  let {id,reviewId}=req.params;
  let review = await Review.findById(reviewId);
    if(!review.author.equals(res.locals.currUser._id)){
      req.flash("error","You don't have permission to delete.");
      return res.redirect(`/listings/${id}`);
    }
    next();
}

module.exports.validateListing= (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    console.log(errMsg);
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};


//created a function for joi to validate client side reviewSchema
module.exports.validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  } 
};