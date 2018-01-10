"use strict";

const expressWinston = require("express-winston");

module.exports = ({ transports }) =>
  expressWinston.logger({
    transports,
    expressFormat: true,
  });
