"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// lib/mongodb.ts
var mongodb_1 = require("mongodb");
var uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable inside Vercel");
}
var client;
var clientPromise;
var options = {};
if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
        client = new mongodb_1.MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
}
else {
    client = new mongodb_1.MongoClient(uri, options);
    clientPromise = client.connect();
}
exports.default = clientPromise;
