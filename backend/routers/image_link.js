const imageController = require("../controllers/imageController");

const router = require("express").Router();


router.post("/", imageController.addImage);


router.get("/", imageController.getAllImage);


router.put("/:id", imageController.updateImage);


router.delete("/:id", imageController.deleteImage);

module.exports = router;