import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 4000;

//middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


/* for the posts part */

const posts = [
    {
        id: 1,
        time: "don't worry about it, you haven't even born when i posted this.",
        author: "pawan",
        title: "Mastering the Art of Focus: Tips for a Distracted World",
        description: "In a world full of notifications and noise, staying focused is a superpower. This post explores practical techniques backed by science to help you concentrate better, get more done, and feel less overwhelmed.",
    }, 
    {
        id: 2,
        time: "don't worry about it, you haven't even born when i posted this.",
        author: "pawan",
        title: "Why Every Beginner Should Learn JavaScript First",
        description: "Starting your coding journey? Here's why JavaScript is the best language to begin with — it's beginner-friendly, powerful, and can open doors to both frontend and backend development.",
    },
    {
        id: 3,
        time: "don't worry about it, you haven't even born when i posted this.",
        author: "pawan",
        title: "Small Habits That Create Big Life Changes",
        description: "This article dives into how tiny, consistent habits can transform your productivity, mindset, and health over time — starting with just five minutes a day",
    },    
]
let last_postId = 3;

//fetching all the posts.
app.get("/posts", (req, res) => {
    try {
        res.status(200).json({
            message:" ✅ Successfully fetched all posts.",
            data: posts,
        });

    } catch (error) {
        res.status(500).json({
            message: "something went wrong while fetching posts. Please try again later."
        });
    }   
});

//adding a new post.
app.post("/posts/add_newPost", (req, res) => {
    try {

        if (!req.body.title || !req.body.description) {
            return res.status(400).json({ message: "Title and description are required." });
        }


        const newId = last_postId + 1;
        const newPost = {
            id: newId,
            time: new Date().toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short"
            }),
            author: "Unkown for now(will make this feature available later)",
            title: req.body.title,
            description: req.body.description,
        }
        posts.push(newPost);
        last_postId = newId;

        res.status(201).json({
            message: " ✅ successfully posted.",
        })
    } catch (error) {
        res.status(500).json({
            message: "Something went wrong with the sever"
        });
    }
});

// get a single post.
app.get("/posts/singlePost/:postId", (req, res) => {
    try {
        const checkingId = parseInt(req.params.postId);
        const existingPost = posts.find((post) => post.id === checkingId);
    
        if (!existingPost){
            return res.status(404).json({message: "no post with this id"});
        }

        res.status(200).json({
        data: existingPost,
        });
    } catch (error) {
        res.status(500).json({
            message: "Something went wrong with the server",
        });
    }
    
});

// edite a specific post
app.patch("/posts/edit/:postId", (req, res) => {
    try {
        const checkingId = parseInt(req.params.postId);
        const existingPost = posts.find((post) => post.id === checkingId);
    
        if (!existingPost){
            return res.status(404).json({
                message: "post not found"
            });
        } 

        const newPost = {
            id: existingPost.id,
            time:`${new Date().toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short"
            })}(edited.)`,
            author: "Unkown for now(will make this feature available later)",
            title: req.body.title,
            description: req.body.description,
        }

        posts[existingPost.id] = newPost

        res.status(201).json({
            message: "successfully edited.",
            data: newPost,
        });
    } catch (error) {
        console.log("Failed! a server problem",error.message);
        res.status(500).json({
            message: "Something went wrong with the server!."
        });
    }
    
});

// delete a post.
app.delete("/posts/delete/:postId", (req, res) => {
    try {
        const deleteId = parseInt(req.params.postId);
        const searchIndex = posts.findIndex((post) => post.id === deleteId);

        if ( searchIndex > -1 ) {
            posts.splice(searchIndex, 1);
            res.sendStatus(200);
        } else {
            res.status(404).json({
                error: `Post with the id: ${deleteId} not found. No posts were deleted.`
            });
        }
    } catch (error) {
        console.log("Failed! a server problem.", error.message);
        res.status(500).json(({
            message: "Something went wrong with the server!"
        }));
    }
    
});


/* for the users part */

const users = [
    { 
        id: 1,
        username: "pawan",
        password: "stupidDonkey"
    },
    {
        id: 2,
        username: "sankalpa",
        password: "123",
    }
]
let last_userId = 2;

//registering a user.
app.post("/users/register", (req, res) => {

    try {
        const newId = last_userId + 1;
        const newUser_username = req.body.username;
        const existingUser = users.find((user) => user.username === newUser_username);
        if (existingUser){
            return res.status(409).json({
                errorMessage: "username already exists. Please choose a another one"
            });
        } else {
            const newUser = {
                id: newId,
                username: req.body.username,
                password: req.body.password,
            }
            last_userId = newUser.id;
            users.push(newUser);
            res.status(201).json({
                message: " ✅ successfully registered.",
                data: users,
            });
        }
    } catch (error) {
        res.status(500).json({
            message: "Something went wrong with the sever"
        });
    }

    if(!req.body.username || !req.body.password){
        return res.status(400).json({message: "username and password are required."})
    }

    
    
});

// checking a user.
app.post("/users/logIn", (req, res) => {

    try {
        const { username, password } = req.body;

        if(!username || !password){
            return res.status(400).json({message: "username and password are required."})
        }

        const existingUser = users.find((user) => user.username === username );

        // if (existingUser){
        //     let passwordIsCorrect = false;
        //     existingUser.password === password ? passwordIsCorrect = true : passwordIsCorrect = false;
        //     if (passwordIsCorrect){
        //         res.status(200).json({
        //             message: "username and password are correct",
        //             data: existingUser,
        //         });
        //     } else {
        //         res.status(401).json({
        //             message: "password is incorrect",
        //         });
        //     }
            
        // } else {
        //     res.status(401).json({
        //         message: "username does not exist"
        //     });
        // }

        if (!existingUser){
            return res.status(401).json({message: "Username does not exist"});
        }

        if (existingUser.password !== password){
            return res.status(401).json({message: "password is incorrect"});
        }

        res.status(200).json({
            message: "Username and password are correct",
            data: existingUser,
        });
    } catch (error) {
        res.status(500).json({
            message: "Something went wrong with the sever"
        });
    }


});




app.listen(port, () => {
    console.log(`server is running on port: ${port}`)
});