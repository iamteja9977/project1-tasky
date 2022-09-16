import twilio from 'twilio';


const accountSid = "USE YOUR SID";
const authToken = "USE YOUR TOKEN";
const client = new twilio(accountSid, authToken);

// let smsbody = {
//     body: "this is a reminder",
//     to: "+919014828737"
// }
async function sendSMS(smsbody) {
    try {
        let message = await client.messages
            .create({
                body: smsbody.body,
                from: '+16066127657',
                to: smsbody.to
            })
        console.log(message.sid);
    } catch (error) {
        console.error(error)
    }
}
export default sendSMS;
// sendSMS({
//     body: `Thank you for Signing Up. Please click on the given link to verify your phone. http://192.168.68.133:5000/api/verify/mobile/`,
//     to: "+919703534849"
// })