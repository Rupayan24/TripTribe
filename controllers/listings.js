const Listing = require("../models/listing");
const Booking = require("../models/booking");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const { getListingWeather } = require("../utils/weather.js");


module.exports.index = async (req, res) => {
  const searchQuery = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const filter = searchQuery
    ? {
        $or: ["title", "location", "country"].map((field) => ({
          [field]: { $regex: escapedQuery, $options: "i" },
        })),
      }
    : {};
  const allListings = await Listing.find(filter);
  res.render("listings/index.ejs", { allListings, searchQuery });
};


module.exports.renderNewForm = async (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res, next) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews", populate: { path: "author" },
    })
    .populate("owner");
  
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const bookedPeriods = await Booking.find({
    listing: listing._id,
    status: "confirmed",
    checkOut: { $gt: today },
  })
    .select("checkIn checkOut -_id")
    .sort({ checkIn: 1 })
    .lean();
  const unavailablePeriods = bookedPeriods.map(({ checkIn, checkOut }) => ({
    checkIn: checkIn.toISOString().slice(0, 10),
    checkOut: checkOut.toISOString().slice(0, 10),
  }));

  let weather = null;
  if (listing.geometry && listing.geometry.coordinates?.length === 2) {
    const [lng, lat] = listing.geometry.coordinates;
    weather = await getListingWeather(lng, lat);
  }
  
  res.render("listings/show.ejs", { listing, weather, unavailablePeriods });
};


module.exports.createListing = async (req, res, next) => {
  if (!mapToken) {
    throw new Error("MAP_TOKEN is required to locate a new listing.");
  }

  let response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1, // -> gives only one coordinate of Goa... Not multiple
    })
    .send();

  const feature = response.body.features[0];
  if (!feature) {
    req.flash("error", "We couldn't find that location. Please try a nearby city or region.");
    return res.redirect("/listings/new");
  }

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  if (req.file) {
    newListing.image = { url: req.file.path, filename: req.file.filename };
  }

  newListing.geometry = feature.geometry;

  await newListing.save();
  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  originalImageUrl =  originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};


module.exports.updateListing = async (req, res) => {
  let { id } = req.params;

  let geometry;
  if (req.body.listing.location !== undefined) {
    if (!mapToken) {
      throw new Error("MAP_TOKEN is required to update a listing location.");
    }

    const response = await geocodingClient
      .forwardGeocode({ query: req.body.listing.location, limit: 1 })
      .send();
    const feature = response.body.features[0];
    if (!feature) {
      req.flash("error", "We couldn't find that location. Please try a nearby city or region.");
      return res.redirect(`/listings/${id}/edit`);
    }
    geometry = feature.geometry;
  }

  let listing = await Listing.findByIdAndUpdate(
    id,
    { ...req.body.listing, ...(geometry && { geometry }) },
    { new: true, runValidators: true },
  );
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};


module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
