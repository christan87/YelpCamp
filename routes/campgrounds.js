var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");

//INDEX - Show all campgrounds
router.get("/campgrounds", function(req, res){
    //Get All Campgrounds
    Campground.find({}, function(err, allCampgrounds){
        if(err){
            console.log(err);
        }
        else{
            res.render("campgrounds/index", {campgrounds: allCampgrounds});
        }
    });
    // res.render("campgrounds", {campgrounds: campgrounds});
});

//NEW - show form to create new campground
router.get("/campgrounds/new", middleware.isLoggedIn, function(req, res){
    res.render("campgrounds/new");
});


//CREATE - add new campgrounds
router.post("/campgrounds", middleware.isLoggedIn, function (req, res){
    //get data from form and add to campgrounds array
    //redirect back to campgrounds page
    var name = req.body.name;
    var price = req.body.price;
    var image = req.body.image;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    var newCampground = {name: name, price: price, image: image, description: desc, author: author};
    console.log(req.user);
    // campgrounds.push(newCampground);
    //Create new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        }
        else{
            //redirect to campgrounds
            console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    })
    //redirect to campgrounds
   // res.redirect("/campgrounds");
});


//SHOW - shows more info about one campground
router.get("/campgrounds/:id", function(req, res){
    //find campground with provided id
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        }
        else{
            //render show template with that campground
            console.log(foundCampground);
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

//==>--Edit Form Route--
router.get("/campgrounds/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});

//==>--Update Route--
router.put("/campgrounds/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, foundCampground){
        if(err){
            console.log(err);
            req.flash("error", "Something Went Wrong");
            res.redirect("back");
        }
        else{
            req.flash("success", foundCampground.name + " Successfully Updated!");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

//==>--Destroy Route--
router.delete("/campgrounds/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err, foundCampground){
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
        }
        else{
            res.redirect("/campgrounds");
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

// function checkCampgroundOwnership(req, res, next){
//     //is user loggid in?
//     if(req.isAuthenticated()){
//         Campground.findById(req.params.id, function(err, foundCampground){
//             if(err){
//                 console.log(err);
//                 res.redirect("back");
//             }
//             else{
//                 //does the user own the campground?
//                 if(foundCampground.author.id.equals(req.user._id)){
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