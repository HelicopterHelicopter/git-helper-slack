const { App } = require('@slack/bolt');
require("dotenv").config();
const axios = require('axios');
const {Client} = require("@elastic/elasticsearch");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const fs = require('fs');
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genai.getGenerativeModel({model: "gemini-1.5-flash"});

const client = new Client({
    auth:{
        username:process.env.ELASTIC_USERNAME,
        password:process.env.ELASTIC_PASSWORD
    },
    node:"https://localhost:9200",
    tls:{
        ca: fs.readFileSync("http_ca.crt"),
        rejectUnauthorized:false
    }
})

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN
});

const elasticsearch_url = "https://localhost:9200/farmart-app-backend/_search"

app.message(async ({ message, say }) => {
    try {
        const elasticSearchMessage = message.text.replaceAll("what","").replaceAll("the","");
        const elasticRes = await client.search({
            index:"farmart-app-backend",
            query:{
                multi_match:{
                    query:elasticSearchMessage,
                    fields:["data","file_name","path"]
                }
            },
            size:10
        })

        const prompt_data = elasticRes.hits.hits.map((hit)=>{
            return JSON.stringify({
                "file_name":hit._source.file_name,
                "path":hit._source.path,
                "data":hit._source.data
            });
        })
        console.log(prompt_data);

        const prompt = `You are an AI assistant that answers user's queries about a github repo. The code is in javascript. You will be provided with relevant files data in an array of string which is a json object in strified format has the file content. Here is the relevant data ${prompt_data} \n Refer the above data and answer the follow query: ${message.text}`;
        console.log(prompt);
        const result = await model.generateContent(prompt);
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