const path = require("path");

if (process.env.NODE_ENV != "production") {
  require("dotenv").config({ path: path.join(__dirname, "../.env") });
}

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const dburl = process.env.ATLASDB_URL;

async function main() {
  await mongoose.connect(dburl);
}

const initDB = async () => {
  await Listing.deleteMany({});

  initData.data = initData.data.map((obj) => ({
    ...obj,
    owner: "6ac79a4deb7cfababe69e3db",
    geometry: obj.geometry || {
      type: "Point",
      coordinates: [88.3639, 22.5726],
    },
  }));

  await Listing.insertMany(initData.data);
  console.log("data was initialized");

  await mongoose.connection.close();
};

main()
  .then(() => {
    console.log("connected to DB");
    return initDB();
  })
  .catch((err) => {
    console.log(err);
  });
