require("dotenv").config();
const { Router } = require("express");
const route = Router();
const { success, error } = require("./../util/responses");
const { authentication } = require("./../util/auth");
const dashboardController = require('../controller/dashboard.controller');
const authController = require('../controller/auth.controller');
const adminController = require('../controller/admin.controller');

route.post("/auth/google", authController.verifyGoogleToken);
route.get("/profile", authController.getProfile);

// Admin Routes (Add middleware in real app)
route.get("/api/admin/users", adminController.getAllUsers);
route.get("/api/admin/stats", adminController.getStats);
route.post("/api/admin/promote/:id", adminController.promoteUser);
route.delete("/api/admin/data", adminController.deleteAllData);

route.post("/uploadcsv", dashboardController.upload.single('file'), dashboardController.uploadCsv);
route.get("/data", dashboardController.getData);
route.get("/years", dashboardController.getYears);
route.post("/summary", dashboardController.getSummary);

module.exports = route;
