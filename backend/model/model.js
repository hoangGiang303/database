const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    admin: {
      type: Boolean,
      default: false,
    },
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
  },
  {
    collection: "account",
    timestamps: true,
  }
);

const profileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      match: [
        /^0\d{9}$/,
        "Số điện thoại không hợp lệ",
      ],
    },
    img : {
      type : String,
    }
  },
  {
    collection: "profile",
  }
);

const authorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    avatar: {
      type: mongoose.Schema.Types.String,
      ref: "Image",
    },
    books: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
      },
    ],
  },
  {
    collection: "author",
  }
);

const bookSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    publishedDate: {
      type: String,
    },
    genres: {
      type: [String],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
    },
  },
  {
    collection: "book",
  }
);

const imageSchema = new mongoose.Schema(
  {
    avatar: {
      type: String,
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.String,
      ref: "Author",
    },
  },
  {
    collection: "image-author",
  }
);
let Account = mongoose.model("Account", accountSchema);
let Profile = mongoose.model("Profile", profileSchema);
let Book = mongoose.model("Book", bookSchema);
let Author = mongoose.model("Author", authorSchema);
let Image = mongoose.model("Image", imageSchema);

module.exports = { Account, Profile, Book, Author, Image };
