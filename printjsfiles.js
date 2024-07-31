const fs = require('fs');
const path = require('path');
require("dotenv").config();
const { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { Pinecone } = require("@pinecone-database/pinecone");
const { Document } = require("@langchain/core/documents");
const { PineconeStore } = require("@langchain/pinecone");
const { ContextMissingPropertyError } = require('@slack/bolt');

const pinecone = new Pinecone({
    apiKey: "77250727-5580-4933-9d6b-88846e424142"
});

const pineconeIndex = pinecone.Index("farmart-app-backend");

const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
    apiKey: process.env.GEMINI_API_KEY
})

const printJSFilesRecursively2 = (dir, docs) => {
    const test = fs.readdirSync(dir).map(file => {
        const filePath = path.join(dir, file);

        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            printJSFilesRecursively2(filePath, docs);
        } else if (stat.isFile() && path.extname(file) === ".js") {
            const data = fs.readFileSync(filePath, 'utf8');
            //console.log(data);

            const doc = new Document({
                metadata: { filePath },
                pageContent: data
            });

            docs.push(doc);
        }
    });
}


const printJSFilesRecursively = (dir, docs) => {
    try {
        const test = fs.readdirSync(dir, recursive = true).map(file => {
            const filePath = path.join(dir, file);

            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                printJSFilesRecursively(filePath, docs);
            } else if (stat.isFile() && path.extname(file) === ".js") {
                const data = fs.readFileSync(filePath, 'utf8');
                //console.log(data);

                const doc = new Document({
                    metadata: { filePath },
                    pageContent: data
                });

                docs.push(doc);
            }
        });

        fs.readdir(dir, (err, files) => {
            if (err) {
                console.error("blblbl");
                return;
            }

            files.forEach((file) => {
                const filePath = path.join(dir, file);

                fs.stat(filePath, (err, stats) => {
                    if (err) {
                        console.error("blblbl");
                        return;
                    }

                    if (stats.isDirectory()) {
                        printJSFilesRecursively(filePath, docs);

                    } else if (stats.isFile() && path.extname(file) === ".js") {
                        try {
                            const data = fs.readFileSync(filePath, 'utf8');
                            //console.log(data);
                            const bytesize = new Blob([data]).size;
                            console.log(bytesize);
                            const doc = new Document({
                                metadata: { filePath },
                                pageContent: data
                            });

                            docs.push(doc);
                        } catch (errrrr) {
                            console.log(errrrr);
                        }

                    }
                })
            })
        })

        //console.log(docs);
    } catch (e) {
        console.log(e);
    }
}
try {
    const directoryPath = "farmart-app-backend-production";
    pineconeIndex.deleteAll().then((res) => {
        console.log(res);
    })
    const docs = [];
    printJSFilesRecursively2(directoryPath, docs);
    console.log(docs.length);
    PineconeStore.fromDocuments(docs, embeddings, {
        pineconeIndex,
        maxConcurrency: 5
    }).then((res) => {
        console.log(res);
    });
    //const docs = printJSFilesRecursively(directoryPath, []);
    // console.log(documents);
    // PineconeStore.fromDocuments(documents, embeddings, {
    //     pineconeIndex,
    //     maxConcurrency: 5
    // }).then((res) => {
    //     console.log(res);
    // });

} catch (e) {
    console.log(e);
}

/*
const batch1 = docs.slice(0, 1000);
const batch2 = docs.slice(1000, 2000);
const batch3 = docs.slice(2000, 3000);
const batch4 = docs.slice(3000, 4000);

pineconeIndex.upsert(batch1).then((res) => {
    console.log(res);
    console.log("batch1 processed");
});

pineconeIndex.upsert(batch1).then((res) => {
    console.log(res);
    console.log("batch1 processed");
});

pineconeIndex.upsert(batch2).then((res) => {
    console.log(res);
    console.log("batch2 processed");
});
pineconeIndex.upsert(batch3).then((res) => {
    console.log(res);
    console.log("batch3 processed");
});
pineconeIndex.upsert(batch4).then((res) => {
    console.log(res);
    console.log("batch4 processed");
});   
*/