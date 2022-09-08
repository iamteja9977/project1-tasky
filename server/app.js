import  express  from "express";
import fs from "fs/promises";
const app=express();
const port =5000;

app.use(express.json())

app.get("/", (req,res)=>{
res.status(200).json({success: "welcome to the tasky application"})
})

// app.post("/api/register", (req,res)=>{
//     res.status(200).json({success: "welcome to the tasky to register"})
//     })
  
app.post("/api/signup", async(req,res)=>{
 try{
    // console.log(req.body);
    let { firstname, lastname, email, password, password2, address, phone } = req.body;
    // console.log(email);
    if (!email || !firstname || !lastname || !phone || !address || !password || !password2) {
        return res.status(400).json({ "error": "Some Fields Are Missing " });
    }
    if (password !== password2) {
        return res.status(400).json({ "error": "Passwords are Not Same" });
    }
    let body = req.body
    let fileData= await fs.readFile("data.json");
    fileData=JSON.parse(fileData);
    fileData.push(body);
    await fs.writeFile("data.json", JSON.stringify(fileData));
    res.status(200).json({ "success": "user signed up successfully" });

}catch(error){
    console.error(error);
    res.status(500).json({error:"internalserver error"})
 }
//when route works fine then, start  coding
})
app.listen(port,() =>{
console.log("server started at port ", port);
});