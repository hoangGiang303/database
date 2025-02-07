const { accController, forgotPassword, resetPassword } = require('../controllers/accController');

const { authenticateToken, isAdmin ,canUpdateProfile} = require('../middleWare/middleware');

const router = require("express").Router();

router.post("/login", accController.login);

router.post("/signup", accController.addAccount);

router.post("/logout",authenticateToken, accController.logout);

router.put("/account/:id",authenticateToken,canUpdateProfile,accController.createProfile);

router.put("/account/:id/change-pass",authenticateToken,accController.changePass);

router.get("/account", authenticateToken, isAdmin, accController.getAllAccount);

router.get("/account/:id",authenticateToken, accController.getAnAccount);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

router.post("/account/role/:id",authenticateToken, isAdmin, accController.setRoleAdmin);

module.exports = router;