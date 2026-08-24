const winston = require("winston");
const moment = require("moment");
require("moment-timezone");
require("winston-mongodb");
const util = require("util");
let waktuSkrg = moment().tz("Asia/Jakarta").format();
const safeStringify = (data) => {
  if (!data) return "-";
  if (typeof data === "string") return data;
  try {
    return JSON.stringify(data);
  } catch (e) {
    return util.inspect(data, { depth: null, breakLength: Infinity });
  }
};

const loggerMongo = winston.createLogger({
  level: "info",
  format: winston.format.printf((log) => {
    return `${waktuSkrg} : ${log.ip || "-"} : ${log.iduser || "-"} : ${log.methode || "-"} : ${log.message} : ${safeStringify(log.bodyData)} : ${safeStringify(log.queryData)}`;
  }),
  transports: [
    new winston.transports.MongoDB({
      level: "info",
      db: process.env.URILOG,
      options: {
        maxPoolSize: process.env.LOg_POOL_SIZE,
      },
      collection: "app_logs",
    }),
  ],
});
const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
});

const log = (id, ip, methode, bodyData, queryData, msg) => {
  if (process.env.NODE_ENV == "development") {
    logger.log({
      level: "error",
      iduser: id,
      time: waktuSkrg,
      ip: ip,
      bodyData: bodyData,
      queryData: queryData,
      methode: methode,
      message: msg.message,
    });
  } else {
    loggerMongo.log({
      level: "error",
      iduser: id,
      time: waktuSkrg,
      ip: ip,
      bodyData: bodyData,
      queryData: queryData,
      methode: methode,
      message: msg.message,
    });
  }
};
module.exports = log;
