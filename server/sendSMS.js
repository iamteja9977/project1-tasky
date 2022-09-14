import twilio from 'twilio';
const accountSid = "AC4b117984210106ca9d42c3185b319343";
const authToken = "00916747e40054109fcd94de5a2ed203";
const client = new twilio(accountSid, authToken);
let smsbody={
    body:"this is a reminder",
    to:"+919618710198"
}
async function sendsms(smsbody) {
    try {
      let message= await  client.messages
            .create({
                body: smsbody.body,
                from: '',//need to add twilio number
                to: smsbody.to
            })
            console.log(message.sid);
    } catch (error) {
        console.error(error)
    }
}
sendsms(smsbody);