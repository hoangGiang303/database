const { Author, Image } = require("../model/model");

const imageController = {
  addImage: async (req, res) => {
    try {
      if (req.body.author) {
        await deleteImagesByAuthor(req.body.author);
      }
      const newImage = new Image(req.body);
      const savedImage = await newImage.save();
      if (req.body.author) {
        const author = Author.findById(req.body.author);
        await author.updateOne({ $set: { avatar: savedImage.avatar } });
      }
      res.status(200).json(savedImage);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  getAllImage: async (req, res) => {
    try {
      const allImage = await Image.find();
      res.status(200).json(allImage);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  updateImage: async (req, res) => {
    try {
      const image = await Image.findById(req.params.id);
      await image.updateOne({ $set: req.body });
      res.status(200).json("Updated successfully!");
    } catch (err) {
      res.status(500).json(err);
    }
  },

  deleteImage: async (req, res) => {
    try {
      updateImagesByAuthor(req.params.id);
      await Image.findByIdAndDelete(req.params.id);
      res.status(200).json("Deleted successfully!");
    } catch (err) {
      res.status(500).json(err);
    }
  },
};

const deleteImagesByAuthor = async (authorId) => {
  try {
    await Image.deleteMany({ author: authorId });
  } catch (err) {
    console.error(err);
  }
};

const updateImagesByAuthor = async (imageId) => {
  try {
    const image = await Image.findById(imageId);
    const author = await Author.findById(image.author);
    await author.updateOne(
      { $set: { avatar: "" } }
    );
  } catch (err) {
    console.error(err);
  }
};

module.exports = imageController;
