require('dotenv').config();

const key = process.env.CLOUD_API_KEY;
const secret = process.env.CLOUD_API_SECRET;
const cloud_name = process.env.CLOUD_NAME;

console.log("Cloud Name:", cloud_name ? `"${cloud_name}"` : "MISSING");
console.log("API Key:", key ? `"${key}"` : "MISSING");
console.log("API Secret:", secret ? `Length: ${secret.length}, First: '${secret[0]}', Last: '${secret[secret.length - 1]}'` : "MISSING");

console.log("Checking for whitespace...");
if (secret && (secret.trim() !== secret)) {
    console.log("WARNING: API Secret has leading/trailing whitespace!");
}
if (key && (key.trim() !== key)) {
    console.log("WARNING: API Key has leading/trailing whitespace!");
}
if (cloud_name && (cloud_name.trim() !== cloud_name)) {
    console.log("WARNING: Cloud Name has leading/trailing whitespace!");
}
