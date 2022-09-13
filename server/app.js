import express from "express"
import fs from "fs/promises"
import bcrypt from "bcrypt"
import randomString from "./utils/randomstring.js"
import { userInfo } from "os"

const app = express()
const port = 5000
// JSON Body Parser
app.use(express.json())
app.get("/", (req, res) => {
  res.status(200).json({ success: "Welcome to the TAsky" })
})
app.post("/register", (req, res) => {
  res.status(200).json({ success: "Welcome to the Tasky from register" })
})
app.post("/api/signup", async (req, res) => {
  try {
    let { firstname, lastname, password, password2, address, phone, email } =
      req.body
    // let body =req.body
    // basic Validations
    if (!email || !firstname || !lastname || !address || !phone || !address) {
      return res.status(400).json({ error: "some fields are missing" })
    }
    if (password !== password2) {
      return res.status(400).json({ error: "Password does not match" })
    }
    // Check duplication of email and mobile
    let fileData = await fs.readFile("data.json")
    fileData = JSON.parse(fileData)
    // console.log(email)
    let emailFound = fileData.find((ele) => ele.email == email)
    if (emailFound) {
      return res
        .status(409)
        .json({ error: "User Email Already Registered.Please Login" })
    }
    let phoneFound = fileData.find((ele) => ele.phone == phone)
    if (phoneFound) {
      return res
        .status(409)
        .json({ error: "User phone Already Registered.Please Login" })
    }
    password = await bcrypt.hash(password, 12)
    // Generate a 12 digit random string for user_id
    let user_id = randomString(16)
    let userData = {
      user_id,
      firstname,
      lastname,
      password,
      address,
      phone,
      email,
    }
    userData.tasks = []
    // userData.firstname = firstname
    fileData.push(userData)
    await fs.writeFile("data.json", JSON.stringify(fileData))
    res.status(200).json({ success: "Welcome you are in a signup route" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Internal Server Error" })
  }
})
app.post("/api/login", async (req, res) => {
  try {
    let { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: "some fields are missing" })
    }
    let fileData = await fs.readFile("data.json")
    fileData = JSON.parse(fileData)
    let userFound = fileData.find((ele) => ele.email == email)
    if (!userFound) {
      return res.status(401).json({ error: "Invalid Credentials" })
    }
    // console.log(userFound)
    let matchPassword = await bcrypt.compare(password, userFound.password)
    if (!!matchPassword) {
      return res.status(401).json({ error: "Invalid Credentials" })
    }
    res.status(200).json({ success: "Login is Successful" })
    
    
    //GENERATE A TOKEN



  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Internal Server Error" })
  }
})
app.listen(port, () => {
  console.log("Server Started at Port ", port)
})







