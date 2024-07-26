const { App } = require('@slack/bolt');
require("dotenv").config();
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genai.getGenerativeModel({ model: "gemini-1.5-pro" });



const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN
});

const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

let uploadResult;
fileManager.uploadFile("farmartapp-backend.txt", {
    mimeType: "text/plain",
    displayName: "farmart-app-backend.txt",
}).then((result) => {
    console.log(result);
    uploadResult = result;
}).catch((error) => {
    console.error(error);
});


const elasticsearch_url = "https://localhost:9200/farmart-app-backend/_search"

app.message(async ({ message, say }) => {
    try {

        const prompt = `You are an AI assistant that answers user's queries about a github repo. The code is in javascript. The codebase is attached as a text file. \n Refer the codebase and answer the follow query: ${message.text}`;
        console.log(prompt);
        const result = await model.generateContent([prompt, {
            fileData: {
                fileUri: uploadResult.file.uri,
                mimeType: uploadResult.file.mimeType
            }
        }]);
        const response = await result.response;

        const text = response.text();

        say(text);
    } catch (error) {
        console.log("err")
        console.error(error);
    }
});

(async () => {
    const port = 3000
    await app.start(process.env.PORT || port);
    console.log('Bolt app started!!');
})();