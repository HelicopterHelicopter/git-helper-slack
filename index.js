const { App } = require('@slack/bolt');
require("dotenv").config();
const { Pinecone } = require("@pinecone-database/pinecone");
const { Document } = require("@langchain/core/documents");
const { PineconeStore } = require("@langchain/pinecone");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai")
const { HumanMessage } = require("@langchain/core/messages");
const { chain } = require('langchain/chains');

const model = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    apiKey: process.env.GEMINI_API_KEY,

})


const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
    apiKey: process.env.GEMINI_API_KEY
})

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN
});

const pinecone = new Pinecone({
    apiKey: "77250727-5580-4933-9d6b-88846e424142"
});

const pineconeIndex = pinecone.Index("farmart-app-backend");



const elasticsearch_url = "https://localhost:9200/farmart-app-backend/_search"

app.message(async ({ message, say }) => {
    try {
        const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex
        });

        const docs2 = await vectorStore.similaritySearch(message.text);

        const retriever = vectorStore.asRetriever();

        const docs = await retriever.invoke(message.text);
        console.log(docs);

        const prompt = `You are an AI assistant that answers user's queries about a github repo. The code is in javascript. You will be provided with relevant files data in an array of string which is a json object in strified format has the file content. Here is the relevant data ${JSON.stringify(docs2)} \n Refer the above data and answer the follow query: ${message.text}`;
        console.log(prompt);
        const result = await model.invoke([new HumanMessage(prompt)]);
        console.log(result);
        const text = result.content;

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