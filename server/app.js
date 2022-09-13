import express from "express";
import fs from "fs/promises";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";


import randomString from "./utils/randomstring.js";

const app = express();

const port = 5000;


//JSON Body Parser
app.use(express.json())

app.get("/", (req, res) => {
    res.status(200).json({ success: "Welcome To the Tasky Application" })
})

/*
METHOD : POST
API Endpoint : /api/signup
Body : 
firstname ; 
lastname
phone
email
password 
password2
address
*/

app.post("/api/signup", async (req, res) => {
    try {
        // console.log(req.body);
        let { firstname, lastname, email, password, password2, address, phone } = req.body;
        // let body = req.body;

        //Basic Validations
        if (!email || !firstname || !lastname || !phone || !address || !password || !password2) {
            return res.status(400).json({ "error": "Some Fields Are Missing " });
        }
        if (password !== password2) {
            return res.status(400).json({ "error": "Passwords are Not Same" });
        }
        //Check Duplication of Email & Mobile
        let fileData = await fs.readFile("data.json");
        fileData = JSON.parse(fileData);
        //
        // console.log(fileData);
        // console.log(email);

        let emailFound = fileData.find((ele) => ele.email == email)
        console.log(emailFound);
        if (emailFound) {
            return res.status(409).json({ error: "User Email Already Registered. Please Login" });
        }

        let phoneFound = fileData.find((ele) => ele.phone == phone)
        if (phoneFound) {
            return res.status(409).json({ error: "User Phone Already Registered. Please Login." })
        }

        // fileData.forEach((ele) => {
        //     console.log(ele.email);
        // })

        password = await bcrypt.hash(password, 12);

        //Generate a 12 Digit Random String for user_id

        let user_id = randomString(16);
        // console.log(user_id);
        let userData = { user_id, firstname, lastname, email, password, address, phone };
        userData.tasks = []
        // userData.firstname = firstname;
        // console.log(userData)
        fileData.push(userData);
        await fs.writeFile("data.json", JSON.stringify(fileData));
        res.status(200).json({ success: "User Signed Up Succesfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" })
    }
})


app.post("/api/login", async (req, res) => {
    try {
        let { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ "error": "Some Fields Are Missing " });
        }

        let fileData = await fs.readFile("data.json");
        fileData = JSON.parse(fileData);

        let userFound = fileData.find((ele) => ele.email == email)
        if (!userFound) {
            return res.status(401).json({ "error": "Invalid Credentials " });
        }
        // console.log(userFound);
        let matchPassword = await bcrypt.compare(password, userFound.password)
        // console.log(matchPassword);
        if (!matchPassword) {
            return res.status(401).json({ "error": "Invalid Credentials " });
        }

        let payload = {
            user_id: userFound.user_id,
            role: "user"
        }

        let privatekey = "codeforindia";

        //GENERATE A TOKEN
        const token = jwt.sign(payload, privatekey, { expiresIn: "7d" });
        // console.log(token);

        res.status(200).json({ success: "Login is Successful", token })


    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" })
    }
})

app.post("/api/task", async (req, res) => {
    try {
        //Check for Authorization 
        let token = req.headers["auth-token"];
        if (!token) {
            return res.status(401).json({ error: "Unauthorised Access" });
        }
        const payload = jwt.verify(token, "codeforindia");
        // console.log(payload);
        if (!payload) {
            return res.status(401).json({ error: "Unauthorised Access" });
        }

        //Check Req.body

        let { task_name, deadline } = req.body;
        if (!task_name || !deadline) {
            return res.status(400).json({ error: "Some Fields are Missing" });
        }

        console.log(task_name, deadline);


        let utc_deadline = new Date(deadline);
        //Check if format is Right or Not
        //Check if its Backdated or Not

        let present_time = new Date();
        // console.log(utc_deadline < present_time);
        if (utc_deadline == "Invalid Date" || (utc_deadline < present_time)) {
            return res.status(400).json({ error: "Invalid Date Entered" });
        }
        // console.log(utc_deadline);

        //Reading File Data
        let fileData = await fs.readFile("data.json");
        fileData = JSON.parse(fileData);

        let userFound = fileData.find((ele) => ele.user_id == payload.user_id)
        // console.log(userFound);

        let task_data = {
            task_id: randomString(14),
            task_name,
            deadline: utc_deadline,
            isCompleted: false
        }

        // console.log(task_data);
        userFound.tasks.push(task_data);

        // console.log(userFound);
        console.log(fileData);
        await fs.writeFile("data.json", JSON.stringify(fileData));
        res.status(200).json({ success: "Task was Added" })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" })
    }
})


app.listen(port, () => {
    console.log("Server Started at Port ", port);
})