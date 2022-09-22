import mongoose from "mongoose";
const Schema = mongoose.Schema;

const tasks=new Schema({
    task_name:{
        type:string,
        required:true
    },
    deadline:{
        type:Date,
        required:true
    },
    isCompleted:{
        type:Boolean,
        default:false
    },
   remainders:{
       type:[Date]
   }

})


const UserSchema = new Schema({
    user : {
        firstname : {
            type: String,
            required: true,
            maxlength: 25,
            minlength: 2
        },
        lastname : {
            type: String,
            required: true,
            maxlength: 25,
            minlength: 2
        },
        password : {
            type: String,
            required: true,
            maxlength: 300,
            minlength: 2
        },
        email : {
            type: String,
            required: true,
            unique : true
        },
        phone : {
            type: String,
            required: true,
            unique : true
        },
        address : {
            type: String,
            required: true,
            maxlength: 25,
            minlength: 2
        }
    },
    tasks:{
        // task_id:{
        //  type:string,
        //  required:true
        // },
        task_name:{
            type:string,
            required:true
        },
        deadline:{
            type:Date,
            required:true
        },
        isCompleted:{
            type:Boolean,
            default:false
        },
       remainders:{
           type:[tasks]
       }
        
    }
})
const userModel = new mongoose.model("user", UserSchema, "UserData")
export default userModel;







