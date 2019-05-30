var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//==>--New Comments Form Route--
router.get("/campgrounds/:id/comments/new", middleware.isLoggedIn, function(req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        if(err){
            console.log(err);
        }
        else{
            res.render("comments/new", {campground: campground});
        }
    })
});

//==>--New Comments Route--
router.post("/campgrounds/:id/comments", middleware.isLoggedIn, function(req, res){
    //look up campground using ID
    Campground.findById(req.params.id, function(err, campground) {
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
        }
        else{
            //create new comment
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    console.log(err);
                }
                //connect comment to campground
                else{
                    //add username and id to comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    //save comment
                    comment.save();
                    campground.comments.push(comment);
                    campground.save();
                    res.redirect("/campgrounds/" + campground._id);
                }
            });
        }
    })
});

//==>-Edit Form Route
router.get("/campgrounds/:id/comments/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground) {
        if(err || !foundCampground){
            console.log(err);
            req.flash("error", "Cannot find Campground associated with this comment");
            res.redirect("back");
        }
        else{
            Comment.findById(req.params.comment_id, function(err, foundComment) {
                if(err || !foundComment){
                    console.log(err);
                    req.flash("error", "Cannot find comment associated with this campground");
                    res.redirect("back")
                }
                else{
                    res.render("comments/edit", {comment: foundComment, campground: foundCampground});
                }
            }); 
        }
    });
});

//==>Update Route--
router.put("/campgrounds/:id/comments/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, foundComment){
        if(err){
            console.log(err);
            res.redirect("back");
        }
        else{
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

//==>--Destroy Route--
router.delete("/campgrounds/:id/comments/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            console.log(err);
            res.redirect("back")
        }
        else{
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});
//==============
//--MIDDLEWARE--
//==============

// function isLoggedIn(req, res, next){
//     if(req.isAuthenticated()){
//         return next();
//     }
//     res.redirect("/login");
// }

// function checkCommentOwnership(req, res, next){
//     //is user logged in?
//     if(req.isAuthenticated()){
//         Comment.findById(req.params.comment_id, function(err, comment) {
//             if(err){
//                 console.log(err);
//                 res.redirect("back");
//             }
//             else{
//                 if(comment.author.id.equals(req.user._id)){
//                     next();
//                 }
//                 else{
//                     res.redirect("back");
//                 }
//             }
//         });
//     }
//     else{
//         res.redirect("back");
//     }
// } 
//==================
//--MIDDLEWARE END--
//==================

module.exports = router;