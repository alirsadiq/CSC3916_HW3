var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie=require('./movies');
var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('//signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('//signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});
router.route('/movie')
    .post(authJwtController.isAuthenticated, function (req, res) {
        console.log(req.body);
        var movie = new Movie();
        movie.title = req.body.title;
        movie.yearReleased = req.body.yearReleased;
        movie.genre = req.body.genre;
        movie.actors = req.body.actors;

        Movie.findOne({title: req.body.title}, function(err, found){
            if(err){
                res.json({message: "Error please try again \n", error: err});
            }
            else if(found){
                res.json({message: "Duplicate, movie already exists"});
            }
            else if (movie.actors.length < 3){
                res.json({message: "Please enter at least 3 actors"});
            }
            else{
                movie.save(function (err) {
                    if(err){
                        res.json({message: "Error please try again\n", error: err});
                    }
                    else{
                        res.json({message: "Movie has successfully been saved"});
                    }
                })
            }
        });
    })
    //find a movie by title
    .get(authJwtController.isAuthenticated, function (req, res) {
        Movie.findOne({title : req.body.title}, function (err, movies) {
            if (err) res.send(err);
            res.json(movies);
        })
    })

    .delete(authJwtController.isAuthenticated, function (req, res){
        Movie.findOneAndDelete({title: req.body.title}, function (err, movie) {
            if (err)
            {
                res.status(400).json({message: "Error something went wrong please try again", msg: err})
            }
            else if(movie == null)
            {
                res.json({msg : "The movie was not found please make sure the title is correct"})
            }
            else
                res.json({msg :"The movie was successfully removed"})
        })
    })
    //update movie
    .put(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            var movie = new Movie();
            movie.title = req.body.title;
            movie.yearReleased = req.body.yearReleased;
            movie.genre = req.body.genre;
            movie.actors = req.body.actors;
            Movie.findOneAndDelete({title: req.body.title}, function(err, found){
                if(err){
                    res.json({message: "Error please try again \n", error: err});
                }
                else if (movie.actors.length < 3){
                    res.json({message: "Please enter at least 3 actors"});
                }

                else if(!found){
                    res.json({message: "No movie found with that title"});
                }

                else{
                    movie.save(function (err) {
                        if(err){
                            res.json({message: "Error please try again\n", error: err});
                        }
                        else{
                            res.json({message: "Movie has successfully been updated"});
                        }
                    })
                }
            });
        })


app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only
