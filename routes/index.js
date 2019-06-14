var express = require("express");
var router = express.Router();
var User = require("../models/user");
var Campground = require("../models/campground");
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
    res.render("register", {page: "register"});
});

//==>--Registration Route--
router.post("/register", function(req, res) {
    var username = req.bod.username;
    var firstName = req.bod.firstName;
    var lastName = req.bod.lastName;
    var email = req.bod.email;
    var avatar = req.bod.avatar;
    var newUser = new User({username: username, firstName: firstName, lastName: lastName, email: email, avatar: avatar});
    if(req.body.adminCode === "secret_admin123"){
        newUser.isAdmin = true;
    }
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
    res.render("login", {page: "login"});
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

//===============
//--USER ROUTES--
//===============

router.get("/users/:id", function(req, res){
    User.findById(req.params.id, function(err, foundUser){
        if(err){
            req.flash("error", "User Not Found");
            console.log("User Not Found Err: " + err);
            res.redirect("back");
        }
        else{
            Campground.find().where("author.id").equals(foundUser.id).exec(function(err, foundCampgrounds){
                if(err){
                    req.flash("error", "Campgrounds Not Found");
                    console.log("Campgrounds Not Found Err: " + err);
                    res.redirect("back");
                }
                else{
                    res.render("users/show", {user: foundUser, campgrounds: foundCampgrounds});
                }
            });
        }
    });
});

//===================
//--USER ROUTES END--
//===================

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