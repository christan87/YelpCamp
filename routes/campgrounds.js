var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

//INDEX - Show all campgrounds
router.get("/campgrounds", function(req, res){
    //Get All Campgrounds
    var noMatch = null;
    if(req.query.search){
        //plugis in our search and 'gi' (global, ignore case?) 
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name: regex}, function(err, allCampgrounds){
            if(err){
                console.log(err);
            }
            else{
                if(allCampgrounds.length < 1){
                    noMatch = "No Campgrounds match that query, please try again.";
                    req.flash("error", noMatch);
                    //passing the error as an object allows the flash to display on the correct page (the first time as opposed to after reloading). 
                    res.render("campgrounds/index", {campgrounds: allCampgrounds, page: "campgrounds", error:noMatch});
                    
                }
                else{
                    res.render("campgrounds/index", {campgrounds: allCampgrounds, page: "campgrounds"});
                }
            }
        });
    }
    else{
        Campground.find({}, function(err, allCampgrounds){
            if(err){
                console.log(err);
            }
            else{
                res.render("campgrounds/index", {campgrounds: allCampgrounds, page: "campgrounds", noMatch: noMatch});
            }
        });
    }
    // res.render("campgrounds", {campgrounds: campgrounds});
});

//NEW - show form to create new campground
router.get("/campgrounds/new", middleware.isLoggedIn, function(req, res){
    res.render("campgrounds/new");
});


//CREATE - add new campgrounds
// router.post("/campgrounds", middleware.isLoggedIn, function (req, res){
//     //get data from form and add to campgrounds array
//     //redirect back to campgrounds page
//     var name = req.body.name;
//     var price = req.body.price;
//     var image = req.body.image;
//     var desc = req.body.description;
//     var author = {
//         id: req.user._id,
//         username: req.user.username
//     };
//     var newCampground = {name: name, price: price, image: image, description: desc, author: author};
//     console.log(req.user);
//     // campgrounds.push(newCampground);
//     //Create new campground and save to DB
//     Campground.create(newCampground, function(err, newlyCreated){
//         if(err){
//             console.log(err);
//         }
//         else{
//             //redirect to campgrounds
//             console.log(newlyCreated);
//             res.redirect("/campgrounds");
//         }
//     })
//     //redirect to campgrounds
//   // res.redirect("/campgrounds");
// });

//CREATE - add new campground to DB
router.post("/campgrounds", middleware.isLoggedIn, function(req, res){
  // get data from form and add to campgrounds array
  var name = req.body.name;
  var image = req.body.image;
  var desc = req.body.description;
  var price = req.body.price;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newCampground = {name: name, price: price, image: image, description: desc, author:author, location: location, lat: lat, lng: lng};
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to campgrounds page
            console.log(newlyCreated);
            res.redirect("/campgrounds");
        }
    });
  });
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
// router.put("/campgrounds/:id", middleware.checkCampgroundOwnership, function(req, res){
//     Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, foundCampground){
//         if(err){
//             console.log(err);
//             req.flash("error", "Something Went Wrong");
//             res.redirect("back");
//         }
//         else{
//             req.flash("success", foundCampground.name + " Successfully Updated!");
//             res.redirect("/campgrounds/" + req.params.id);
//         }
//     });
// });

// UPDATE CAMPGROUND ROUTE
router.put("/campgrounds/:id", middleware.checkCampgroundOwnership, function(req, res){
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;

    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
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
            Comment.deleteMany({_id: {$in: foundCampground.comments}}, function(err){
                if(err){
                    console.log(err);
                    res.redirect("/campgrounds");
                }
                else{
                    res.redirect("/campgrounds");
                }
            });
            
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

//=============
//--FUNCTIONS--
//=============

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//=================
//--FUNCTIONS End--
//=================

module.exports = router;