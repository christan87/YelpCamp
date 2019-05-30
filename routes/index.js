var express = require("express");
var router = express.Router();
var User = require("../models/user");
var passport = require("passport");

//--Landing Page Route--
router.get("/", function(req, res){
    res.render("landing");
});


//===============
//--AUTH ROUTES--
//===============

//==>--Registration Form Route---
router.get("/register", function(req, res){
    res.render("register");
});

//==>--Registration Route--
router.post("/register", function(req, res) {
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            req.flash("error", err.message);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to YelpCamp " + user.name);
            res.redirect("/campgrounds");
        });
    });
});

//==>--Login Form Route--
router.get("/login", function(req, res) {
    res.render("login");
});

//==>--Login Route--
router.post("/login", passport.authenticate("local", {
    
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
}), function(req, res){
    
});

//==>--Logout Route--
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});


//==============
//--MIDDLEWARE--
//==============

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

//==================
//--MIDDLEWARE END--
//==================

//===================
//--AUTH ROUTES END--
//===================

module.exports = router;