const mongoose = require("mongoose");

let gridFSBucket = null;

const initGridFS = () => {
  try {
    if (!mongoose.connection.db) {
      console.log("MongoDB database is not ready for GridFS");
      return null;
    }

    gridFSBucket = new mongoose.mongo.GridFSBucket(
      mongoose.connection.db,
      {
        bucketName: "resumes",
      }
    );

    console.log("GridFS initialized successfully.");

    return gridFSBucket;
  } catch (error) {
    console.error("GridFS initialization error:", error);
    return null;
  }
};

const getGridFSBucket = () => {
  if (!gridFSBucket) {
    throw new Error("GridFS has not been initialized");
  }

  return gridFSBucket;
};

module.exports = {
  initGridFS,
  getGridFSBucket,
};