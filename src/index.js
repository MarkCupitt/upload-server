"use strict";

const config = require("config");
const express = require("express");
const cors = require("cors");
const uuid = require("uuid");
const multer = require("multer");
const sharp = require("sharp");
const aa = require("express-async-await");
const { Logger } = require("winston");
const createWinstonTransports = require("./helpers/createWinstonTransports");
const createExpressLogger = require("./middleware/createExpressLogger");
const bodyParser = require("body-parser");
const AWS = require("aws-sdk");

const transports = createWinstonTransports({ config: config.get("winston") });
const logger = new Logger({
  level: config.get("winston").level,
  transports,
});
logger.info("App is starting...");

const s3Config = config.get("s3");
const s3 = new AWS.S3({ logger, region: s3Config.region });

async function upload({ buffer, mimetype }) {
  if (process.env.NODE_ENV !== "production") {
    logger.debug("upload: Uploaded file");
    return "https://assets.confrere.com/image";
  }

  const { key } = await new Promise((resolve, reject) => {
    s3.upload(
      {
        Bucket: s3Config.bucket,
        Key: uuid.v4(),
        ACL: s3Config.acl,
        ContentType: mimetype,
        Body: buffer,
      },
      (err, data) => {
        if (err) reject(err);
        resolve(data);
      },
    );
  });
  const url = `${s3Config.cdnUrl}/${key}`;
  logger.info("upload: Uploaded file", { url });
  return url;
}

const app = aa(express());
// ENABLES ALL CORS REQUESTS. THIS IS DANGEROUS AND MUST BE FIXED.
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());
app.use(createExpressLogger({ transports }));

const SUPPORTED_IMAGE_MIMETYPES = [
  "image/jpeg",
  "image/gif",
  "image/png",
  "image/bmp",
  "image/webp",
  "image/svg+xml",
];
const storage = multer.memoryStorage();
const imageUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!SUPPORTED_IMAGE_MIMETYPES.includes(file.mimetype)) {
      return cb(null, false);
    }
    return cb(null, true);
  },
  limits: {
    fileSize: 50000000, // 50 MB
  },
});

app.get("/health", (req, res) => {
  res.status(200).send();
});
app.get("/", async (req, res) => {
  res.send(uuid.v4());
});

app.post("/image", imageUpload.single("image"), async (req, res) => {
  const {
    file,
    body: {
      imageHeight: imageHeightString,
      imageWidth: imageWidthString,
      resizeStrategy = "centre",
    },
  } = req;
  const imageHeight = parseInt(imageHeightString, 10);
  const imageWidth = parseInt(imageWidthString, 10);
  if (!(imageHeight, imageWidth, file)) {
    res.status(400).json({
      message: "imageHeight, imageWidth, file are required attributes",
    });
    return;
  }

  if (file.mimetype === "image/svg+xml") {
    const url = await upload(file);
    res.json({ url });
    return;
  }

  try {
    const resizedImage = sharp(file.buffer).resize(imageWidth, imageHeight);

    let processedImage;
    if (resizeStrategy === "max") {
      processedImage = resizedImage.max();
    } else {
      processedImage = resizedImage.crop(resizeStrategy);
    }

    const url = await upload({
      buffer: await processedImage.toBuffer(),
      mimetype: file.mimetype,
    });
    res.json({ url });
  } catch (e) {
    res.status(400).json({ message: `Could not process image: ${e.message}` });
  }
});

const { port } = config.get("server");
module.exports = app.listen(port, () => {
  logger.info(`App has started listening on port ${port}`);
});
