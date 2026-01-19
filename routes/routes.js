require("dotenv").config();
const { Router } = require("express");
const route = Router();
const { success, error } = require("./../util/responses");
const { authentication } = require("./../util/auth");
const dashboardController = require('../controller/dashboard.controller');      

route.post("/uploadcsv", dashboardController.upload.single('file'), dashboardController.uploadCsv);
route.get("/data", dashboardController.getData);
route.get("/years", dashboardController.getYears);

module.exports = route;
