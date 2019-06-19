var express = require("express");
var router = express.Router();
var User = require("../models/user");
var Campground = require("../models/campground");
var passport = require("passport");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

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
    var username = req.body.username;
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var email = req.body.email;
    var avatar = req.body.avatar;
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
            req.flash("success", "Welcome to YelpCamp " + user.username);
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

//==========================
//--FORGOT PASSWORD ROUTES--
//==========================

//==>--Forgot Password Form--
router.get("/forgot", function(req, res) {
   res.render("forgot"); 
});

//==>--Forgot Password POST Route--
router.post("/forgot", function (req, res, next){
    async.waterfall([
        //this functino generats the token (url that lasts 1hr that will send the user to the reset password form) that will be emailed to the user
        function(done){
            crypto.randomBytes(20, function(err, buf){
                var token = buf.toString("hex");
                done(err, token);
            });
        },
        
        //this function saves the token to the user and sets the expiration time for the token
        function(token, done){
            User.findOne({email: req.body.email}, function(err, user){
                if(!user){
                    console.log("NO USER FOUND");
                    req.flash("error", "No account with that email address exists.");
                    res.redirect("/forgot");
                }
                
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; //1hr
  
                user.save(function(err){
                    done(err, token, user);
                });
            });
        },
        
        //this function send the reset password email to the user
        function(token, user, done){
            //this variable creates a connection to your email by which the reset email will be sent
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "christan.price2010",
                    pass: process.env.GMAILPW
                }
            });
            //this var composes the email as an object
            var mailOptions = {
                to: user.email,
                from: "christan.price2010@gmail.com",
                subject: "Node.js Password Reset",
                text: "You are receiving this emal because you (or someone elese) has requested a reset of the password. \n" + 
                "Plaeas click on the following link or copy and paste it into your browser to complete the process. \n" + 
                "http://" + req.headers.host + "/reset/" + token + "\n\n" + 
                "If you did not request this, please ignore this email and your password will remain unchanged."
            }
            //this function sends the email to the user via the gmail account provided, the password is in the .env file
            smtpTransport.sendMail(mailOptions, function(err){
                if(err){
                    console.log(err);
                }
                else{
                    console.log("Mail Sent");
                    req.flash("success", "An email has been sent to " + user.email + " with further instructions.");
                    done(err, "done");
                }
            });
        }
    ],
    function(err){
        if(err) return next (err);
        res.redirect("/forgot");
    });
});

//==>--Forgot Password Reset Form--
router.get("/reset/:token", function(req, res) {
    //finds a user that matches the token and checks that that the resetPasswordExpires is larger than the current time $gt stands fo 'greater than'
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user){
       if(!user){
           req.flash("error", "Password reset token is invlaid or expired");
           return res.redirect("/forgot");
       } 
       res.render("reset", {token: req.params.token});
    });
});

//==>--Reset The Password--
router.post("/reset/:token", function(req, res){
    async.waterfall([
        //this functino matches a user with the reset token making sure the reset expiration time is greater than current time
        function(done){
            User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user) {
                console.log("USER FOUND : " + user);
                if(!user){
                    req.flash("error", "Password reset token is invaled or expired.");
                    return res.redirect("back");
                }
                //saves new password if the new and confirm passwords match ;
                if(req.body.password === req.body.confirm){
                    user.setPassword(req.body.password, function(err){
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;
                        
                        user.save(function(err){
                            done(err, user)
                        });
                    });
                }
                else{
                    req.flash("error", "Passwords do not match.")
                    res.redirect("back");
                }
            });
        },
        //sets up the process by which the user will be emailed that the password reset was successful
        function(user, done){
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail",
                auth: {
                    user: "christan.price2010@gmail.com",
                    pass: process.env.GMAILPW
                }
            });
            //composes the confirmation email to the user that their password has been reset
            var mailOptions = {
                to: user.email,
                from: "christan.price2010@gmail.com",
                subject: "Your password has been successfully changed!",
                text: "Hello, \n\n"+
                "This is a confimation that the password to your account " + user.email + " has just been changed."
            }
            //sends the confirmation email
            smtpTransport.sendMail(mailOptions, function(err){
                req.flash("success", "Success! Your password has been changed.");
                done(err);
            });
        } 
    ],
    function(err){
        res.redirect("/campgrounds");
    });
});
//==============================
//--FORGOT PASSWORD ROUTES END--
//==============================

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