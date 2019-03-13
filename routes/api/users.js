const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const passport = require("passport");

//Load User Model
const User = require("../../models/User");

// @route  GET api/users/test
// @desc   Tests users route
// @access Public
router.get("/test", (req, res) => res.json({ msg: "User Works" }));

// @route POST api/users/register
// @desc Register User
// @access public
router.post("/register", (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (user) {
      return res.status(400).json({ email: "Email already exist!" });
    } else {
      const avatar = gravatar.url(req.body.email, {
        s: "200", //size
        r: "pg", //rating
        d: "mm" //default
      });

      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        avatar, //same with avatar: avatar,
        password: req.body.password
      });

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser.save((err, user) => {
            if (err) {
              console.log(err);
            } else {
              res.json(user);
            }
          });
        });
      });

      // //alternative way to save with then
      // newUser
      //   .save()
      //   .then(user => res.send(user))
      //   .catch(err => console.log(err));
    }
  });
});

// @route POST api/users/login
// @desc Login User / Returning JWT Token
// @access public
router.post("/login", (req, res) => {
  email = req.body.email;
  password = req.body.password;
  User.findOne({ email: email }).then(user => {
    //check for user
    if (!user) {
      return res.status(404).json({ email: "User not found." });
    }

    //check password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        //User Match
        const payload = { id: user.id, name: user.name, avatar: user.avatar }; //create jwt payload
        //Sign Token
        jwt.sign(
          payload,
          keys.secretOrKey,
          { expiresIn: 3600 },
          (err, token) => {
            res.json({
              success: true,
              token: "Bearer " + token
            });
          }
        );
      } else {
        return res.status(400).json({ msg: "invalid password" });
      }
    });
  });
});

// @route  GET api/users/current
// @desc   Return current User
// @access Private
router.get(
  "/current",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    });
  }
);

module.exports = router;
