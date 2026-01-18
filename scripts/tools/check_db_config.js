if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const isAtlas = process.env.USE_ATLAS === "true";
const dbUrl = isAtlas ? process.env.ATLASDB_URL : "mongodb://127.0.0.1:27017/wanderlust";

console.log("USE_ATLAS:", process.env.USE_ATLAS);
console.log("Effective DB URL:", dbUrl);
