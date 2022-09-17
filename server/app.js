import express from "express";
import fs from "fs/promises";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import { scheduleJob, scheduledJobs, cancelJob } from "node-schedule";


import randomString from "./utils/randomString.js";
//instantiate express
const app = express();

const port = 5000;


//JSON Body Parser
//allowing only json
app.use(express.json())
//-------------------------------------------------------------------------------------------------------
app.get("/", (req, res) => {
    res.status(200).json({ success: "Welcome To the Tasky Application" })
})

/*
METHOD : POST
API Endpoint : /api/signup
Body : 
firstname 
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

//Basic Validations if empty
        if (!email || !firstname || !lastname || !phone || !address || !password || !password2) {
            return res.status(400).json({ "error": "Some Fields Are Missing " });
        }
//validation for pass and pass2
        if (password !== password2) {
            return res.status(400).json({ "error": "Passwords are Not Same" });
        }
        //Check Duplication of Email & Mobile
//reading the data.json -->JSON
        let fileData = await fs.readFile("data.json");
        fileData = JSON.parse(fileData);
       
//if emial of user already exists in DB
        let emailFound = fileData.find((ele) => ele.email == email)
        // console.log(emailFound);
        if (emailFound) {
            return res.status(409).json({ error: "User Email Already Registered. Please Login" });
        }
//if phone number already exists
        let phoneFound = fileData.find((ele) => ele.phone == phone)
        if (phoneFound) {
            return res.status(409).json({ error: "User Phone Already Registered. Please Login." })
        }

//Hashing the password        
        password = await bcrypt.hash(password, 12); //applying 12 rounds of  salt

//Generate a 12 Digit Random String for user_id
let user_id = randomString(16);
// console.log(user_id);

//making our own object to store in DB
        let userData = { user_id, firstname, lastname, email, password, address, phone };

//adding tasks to our userData object 
        userData.tasks = []
//pushing our userData object to  empty fileData        
        fileData.push(userData);
//writing the fileData object to DB
        await fs.writeFile("data.json", JSON.stringify(fileData));
        res.status(200).json({ success: "User Signed Up Succesfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" })
    }
})
//----------------------------------------------------------------------------------------------

/*
METHOD : POST
PUBLIC
API Endpoint : /api/login
Body : 
email
password 
*/

app.post("/api/login", async (req, res) => {
    try {
//destructuring from the body
        let { email, password } = req.body;
//if fields are empty
        if (!email || !password) {
            return res.status(400).json({ "error": "Some Fields Are Missing " });
        }
//reading from the existing DB
        let fileData = await fs.readFile("data.json");
        fileData = JSON.parse(fileData);
//email checking in the existing DB
        let userFound = fileData.find((ele) => ele.email == email)
        if (!userFound) {
            return res.status(401).json({ "error": "Invalid Credentials " });
        }
        // console.log(userFound);
//checking the hashed password matching with the entered password
        let matchPassword = await bcrypt.compare(password, userFound.password)
        // console.log(matchPassword);
        if (!matchPassword) {
            return res.status(401).json({ "error": "Invalid Credentials " });
        }

 //GENERATE A JWT TOKEN       
        let payload = {
            user_id: userFound.user_id,
            role: "user"
        }

        let privatekey = "codeforindia";
        const token = jwt.sign(payload, privatekey, { expiresIn: "7d" });
        // console.log(token);
//PASSING THE TOKEN IN RESPONSE 
        res.status(200).json({ success: "Login is Successful", token })


    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" })
    }
})
//-------------------------------------------------------------------------------------------------------------
/*
METHOD : POST
API Endpoint : /api/task
PRIVATE
Header:
auth-token

Body : 
task_name
deadline
*/


app.post("/api/task", async (req, res) => {
    try {
        //Check for Authorization ,geting token from request.headers
        let token = req.headers["auth-token"];
//check for the token exist[empty] 
        if (!token) {
            return res.status(401).json({ error: "Unauthorised Access" });
        }
//verifying the token
        const payload = jwt.verify(token, "codeforindia");
        // console.log(payload);
//checking the token is valid or not
        if (!payload) {
            return res.status(401).json({ error: "Unauthorised Access" });
        }

//getting the task_name and deadline from the body
        let { task_name, deadline } = req.body;
//checking the task_name and deadline is empty
        if (!task_name || !deadline) {
            return res.status(400).json({ error: "Some Fields are Missing" });
        }
        //    console.log(task_name, deadline);

//converting the GMT to UTC
        let utc_deadline = new Date(deadline);
        // console.log(utc_deadline);
        let present_time = new Date();//UTC time format
        // console.log(present_time);

//if date is in correct format AND date entered is already been passed
        if (utc_deadline == "Invalid Date" || (utc_deadline < present_time)) {
            return res.status(400).json({ error: "Invalid Date Entered" });
        }
        
 //Check Validation for 30 mins and 30 Days
        let difference = utc_deadline - present_time; //milli seconds
        // console.log(difference);

//Difference in Minutes
        let mins = difference / (1000 * 60)
        // console.log(mins);
//Difference in Days
        let days = difference / (1000 * 60 * 60 * 24);
        // console.log(days);

//Not Less than 30 mins and Not more than 30 Days
        if (mins < 1 || days > 30) {
            return res.status(400).json({ error: "Invalid Date Entered, Deadline Should be More than 30 mins and Less than 30 Days" });
        }

//creating  Reminders array
        let reminders = [];

        let reminder1 = new Date((+present_time) + (difference / 4));
        // console.log(reminder1);

        let reminder2 = new Date((+present_time) + (difference / 2));
        // console.log(reminder2);

        let reminder3 = new Date((+present_time) + (difference / (4 / 3)));
        // console.log(reminder3);

//3 remainders and deadline is pushing into the remainders array
        reminders.push(reminder1, reminder2, reminder3, utc_deadline);
        // console.log(reminders);


//Reading File Data
        let fileData = await fs.readFile("data.json");
        fileData = JSON.parse(fileData);
//Checking user_id exist in db that is same from token i.e payload.user_id
        let userFound = fileData.find((ele) => ele.user_id == payload.user_id)
        // console.log(userFound);
        let task_id = randomString(14)
//creating task_data object to push in tasks array
        let task_data = {
            task_id,
            task_name,
            deadline: utc_deadline,
            isCompleted: false,
            reminders
        }
//fileData will be updated bcoz of shallow copy when userFound updated
userFound.tasks.push(task_data);
    /*************************************************************/
        task_data.reminders.forEach((ele, i) => {
            // console.log(ele);
            // scheduleJob(`${task_id}_${i}`, ele, () => {
            //     console.log("Reminder Sent", i);
            //     console.log(new Date());
            // })
            // console.log(i);

//work
            scheduleJob(`${task_id}_${i}`, ele, () => {
                if(i<3){
                    console.log(` Hi ${userFound.firstname} This is a reminder ${i+1} for completing your task ${task_data.task_name}`);
                    console.log(new Date());
                   
                }
                else{
                    console.log(` Hi ${userFound.firstname} ,your deadline for ${task_data.task_name} has been passed`  )
                   
                }
                

            })
        })
        console.log(scheduledJobs);
    /************************************************************/
        
        await fs.writeFile("data.json", JSON.stringify(fileData));
        res.status(200).json({ success: "Task was Added" })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" })
    }
})
//--------------------------------------------------------------------------
/* 
End Point : /api/tasks
Method : GET
PRIVATE
*/
app.get('/api/tasks',async(req,res)=>{
	try {
		let token= req.headers["auth-token"];
		if(!token){
			return res.status(401).json({error: "Unauthorised Access"});
		}
		let privateKey="codeforindia";
		const payload = jwt.verify(token, privateKey);
		// console.log(payload);

		if(!payload){
			return res.status(401).json({error : "Unauthorised Access"});
		}

		//Reading File Data
		let fileData = await fs.readFile('data.json');
		fileData = JSON.parse(fileData);

		let userFound= fileData.find((ele)=> ele.user_id == payload.user_id);
		// console.log(userFound);

		res.status(200).json({ data: userFound.tasks})
	} catch (error) {
		console.log(error);
		res.status(500).json({error:"Internal Server Error"});
	}
})

//-----------------------------------------------------------------------
/* 
End Point : /api/task/:task_id
Method : GET
PRIVATE
*/


//-----------------------------------------------------------------------------
/* 
End Point : /api/task/:task_id
Method : DELETE
PRIVATE
Use : To Delete the Task from a Given ID
*/


app.delete("/api/task/:task_id", async (req, res) => {
    try {
        // console.log(req.params);
//taking task_id from url
        let task_id = req.params.task_id;
        console.log(task_id);

//Check for Authorisation
        let token = req.headers["auth-token"];
        if (!token) {
            return res.status(401).json({ error: "Unauthorised Access" });
        }
        const payload = jwt.verify(token, "codeforindia");
        // console.log(payload);
        if (!payload) {
            return res.status(401).json({ error: "Unauthorised Access" });
        }


//Reading File Data
        let fileData = await fs.readFile("data.json");
        fileData = JSON.parse(fileData);

        let userFound = fileData.find((ele) => ele.user_id == payload.user_id)
        // console.log(userFound);

//Find Index of Given Task
        let taskIndex = userFound.tasks.findIndex((ele) => ele.task_id == task_id);
        // console.log(taskIndex);

        if (taskIndex == -1) {
            return res.status(404).json({ error: "Task Not Found" });
        }

//Delete Element with Given Index from an Array
        userFound.tasks.splice(taskIndex, 1)

        // console.log(userFound.tasks);
        // console.log(fileData);
        await fs.writeFile("data.json", JSON.stringify(fileData));
        res.status(200).json({ success: "Task Was Deleted Successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
})
//---------------------------------------------------------------------------------------
// app.get("/check", (req, res) => {
//     try {
//         let date = new Date("Thu Sep 15 2022 18:16:50 GMT+0530 (India Standard Time)")
//         console.log(new Date());

//         console.log(date);

//         scheduleJob("jobid_1", date, () => {
//             console.log(randomString(100))
//         });
//         console.log(scheduledJobs);
//         cancelJob("jobid_1");
//         console.log(scheduledJobs);
//         res.status(200).json({ success: "Checking " });

//     } catch (error) {
//         console.error(error)
//         res.status(500).json({ error: "Internal Server Error " });
//     }
// })


//--------------------------------------------------------------------------------------------------

app.listen(port, () => {
    console.log("Server Started at Port ", port);
})