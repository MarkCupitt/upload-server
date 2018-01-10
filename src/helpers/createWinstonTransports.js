"use strict";

const winston = require("winston");

module.exports = ({ config }) => {
  const transports = [];

  if (config.console) {
    transports.push(new winston.transports.Console(config.console));
  }

  return transports;
};
