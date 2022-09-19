import twilio from 'twilio';
const accountSid = "ACa929d14b426e44666ea3a4129f7b6a05";
const authToken = "38755ca74387a95d028b75bfebcaa5a9";
const client = new twilio(accountSid, authToken);

async function sendSMS(smsbody) {
    try {
        let message= await  client.messages
            .create({
                body: smsbody.body,
                from: '+18146795441',//need to add twilio number
                to: smsbody.to
            })
            console.log(message.sid);
    } catch (error) {
        console.error(error);
    }
}
export default sendSMS;