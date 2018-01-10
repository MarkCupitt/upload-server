"use strict";

const config = require("config");
const express = require("express");
const cors = require("cors");
const uuid = require("uuid");
const aa = require("express-async-await");
const { Logger } = require("winston");
const createWinstonTransports = require("./helpers/createWinstonTransports");
const createExpressLogger = require("./middleware/createExpressLogger");
const bodyParser = require("body-parser");

const transports = createWinstonTransports({ config: config.get("winston") });
const logger = new Logger({
  level: config.get("winston").level,
  transports,
});
logger.info("App is starting...");

const app = aa(express());
// ENABLES ALL CORS REQUESTS. THIS IS DANGEROUS AND MUST BE FIXED.
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());
app.use(createExpressLogger({ transports }));

app.get("/health", (req, res) => {
  res.status(200).send();
});
app.get("/", async (req, res) => {
  res.send(uuid.v4());
});

const { port } = config.get("server");
app.listen(port, () => {
  logger.info(`App has started listening on port ${port}`);
});
