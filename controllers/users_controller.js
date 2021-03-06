const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');
const fs = require('fs');
const path = require('path');

module.exports.profile = function(req, res){
    
    User.findById(req.params.id)
    .populate({
        path: 'friends'
    })
    .populate({
        path : 'posts',
        populate : {
            path : 'comments',
            model: 'Comment',
            select:{
                createdAt:0,
                updatedAt:0
            },
            populate:{
                path: 'user',
                model: 'User',
                select:{
                    posts:0,
                    email: 0,
                    password:0,
                    createdAt:0,
                    updatedAt:0
                }
            }
        }
    })
    .exec(function(err, user){       
        let isFriend=false;
        let ispending = false;
        for(friendship of user.friends){
            // console.log("in users controller")
            // console.log(friendship);
            // // console.log(req.user._id);

            

            //for finding is request is pending or accepted

            if(friendship.user_id==req.user.id || friendship.friend_id==req.user.id){
                 
                ispending = true;
            }


            if((friendship.user_id==req.user.id || friendship.friend_id==req.user.id) && (friendship.request_accepted)){
                isFriend = true;
                ispending = false;
                break;
            }
        }

       
        return res.render('user_profile', {
                    title: 'User Profile',
                    profile : user,
                    isFriend : isFriend,
                    ispending:ispending
                });
    });
    
};

module.exports.update = async function(req, res){
    
    if(req.user.id == req.params.id)
    {
        try
        {
            
            let user= await User.findByIdAndUpdate(req.params.id, req.body);
            User.uploadedAvatar(req,res,function(err)
            {
                if(err)
                {
                    console.log('******Multer Error:',err);
                    
                }

                user.name=req.body.name;
                user.email=req.body.email;
                if(req.file)
                {
                    if(user.avatar)
                    {
                        fs.unlinkSync(path.join(__dirname,'..',user.avatar));
                    }
                    
                    // this is saving the path of the uploaded file into the avatar fiels in the user schema
                    user.avatar=User.avatarPath+'/'+req.file.filename
                }

                user.save();
                return res.redirect('back');
            
            });    

        
        }catch(err)
        {
            req.flash('error',err);
            return res.redirect('back');
        }

    }else{
        req.flash('error', 'Unauthorized!');
        return res.status(401).send('Unauthorized');
    }  
};

// render the sign up page
module.exports.signUp = function(req, res){   
    if(req.isAuthenticated()){
        return res.redirect('/');
    }
    return res.render('user_sign_up', {
        title: "Codeial | Sign Up"
    })
}


// render the sign in page
module.exports.signIn = function(req, res){
    if(req.isAuthenticated()){
        return res.redirect('/');
    }
    return res.render('user_sign_in', {
        title: "Codeial | Sign In"
    })
}

// get the sign up data
module.exports.create = function(req, res){
    if (req.body.password != req.body.confirm_password){
        return res.redirect('back');
    }

    User.findOne({email: req.body.email}, function(err, user){
        if(err){
            console.log('error in finding user in signing up');
            return res.redirect('/');
        }

        if (!user){
            User.create(req.body, function(err, user){
                if(err){console.log('error in creating user while signing up'); return}

                return res.redirect('/sign-in');
            })
        }else{
            return res.redirect('back');
        }

    });
}


// sign in and create a session for the user
module.exports.createSession = function(req, res){
    req.flash('success', 'Logged In Successfully');
    return res.redirect('/');
}

module.exports.signOut = function(req, res){
    
    req.flash('success', 'Logged Out Successfully');
    req.logout();
    return res.redirect('/');
}
