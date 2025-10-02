const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema } = require("../schema"); // Validate client side schema by joi and review also
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");

const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

router
  .route("/")
  .get(wrapAsync(listingController.index)) //INDEX ROUTE TO SHOW ALL LISTS
  .post(
    // EDIT ROUTE FOR LISTINGS
    isLoggedIn,
    upload.single("listing[image][url]"),
    validateListing,
    wrapAsync(listingController.createListing)
  );

//NEW ROUTE TO CREATE NEW LISTING
router.get("/new", isLoggedIn, listingController.renderNewform);

router
  .route("/:id")
  .get(wrapAsync(listingController.showListing)) //SHOW ROUTE
  .put(
    isLoggedIn, //UPDATE ROUTE
    isOwner,
    upload.single("listing[image][url]"),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);

router.get(
  "/category/:category",
  wrapAsync(async (req, res) => {
    const { category } = req.params;
    const listings = await Listing.find({ category });
    res.render("listings/index.ejs", { allListings: listings });
  })
);

router.get("/search/listings",wrapAsync(async(req,res)=>{
  let {q}=req.query;
  let listings = await Listing.find({ title: { $regex: q, $options: "i" } });
  res.render("listings/index.ejs",{allListings: listings,q});
}))

module.exports = router;
