//Explaination of Nodescheduler

// import schedule from "node-schedule";
import { scheduleJob } from "node-schedule";


import utils from "./utils/randomString.js"
// import {randomString,randomString2} from "./ut"

// console.log(utils.randomString2(100))

let date = new Date("Thu Sep 15 2022 16:23:12 GMT+0530 (India Standard Time)")
console.log(new Date());

console.log(date);

scheduleJob(date, () => {
    console.log(utils.randomString(1))
});
