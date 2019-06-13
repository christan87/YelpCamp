//all the middleware goes here
var Campground = require("../models/campground");
var Comment = require("../models/comment");

var middlewareObj = {};

middlewareObj.isLoggedIn = function (req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "Log In First");
    res.redirect("/login");
}

middlewareObj.checkCampgroundOwnership = function (req, res, next){
    //is user loggid in?
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundCampground){
            if(err || !foundCampground){
                console.log(err);
                req.flash("error", "Campground not found");
                res.redirect("back");
            }
            else{
                //does the user own the campground?
                if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
                    next();
                }
                else{
                    res.redirect("back");
                }
            }
        });
    }
    else{
        req.flash("error", "Login Firs!");
        res.redirect("/login");
    }
}

middlewareObj.checkCommentOwnership = function (req, res, next){
    //is user logged in?
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, comment) {
            if(err || !comment){
                console.log(err);
                req.flash("error", "Comment not found!");
                res.redirect("back");
            }
            else{
                if(comment.author.id.equals(req.user._id) || req.user.isAdmin){
                    next();
                }
                else{
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    }
    else{
        req.flash("error", "Login First");
        res.redirect("/login");
    }
} 

module.exports = middlewareObj;