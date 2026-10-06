import express from "express";
import fs from "fs";
import registerRouter from "./router/registerRouter.js";
import clearRouter from "./router/clearRouter.js";
import packageRouter, { initialisePackages } from "./router/packageRouter.js";
import contactRouter from "./router/contactRouter.js";
import locationRouter from "./router/locationRouter.js";
import deviceTokenRouter from "./router/deviceTokenRouter.js";
import tripRouter from "./router/tripRouter.js";
import policeRouter from "./router/policeRouter.js";
import { sweepPoliceCases } from "./utils/caseEscalation.js";

const app = express();

app.use(express.text());
app.use(express.json());

app.use("/user", registerRouter);
app.use("/user/contacts", contactRouter);
app.use("/user/device-token", deviceTokenRouter);
app.use("/api/location", locationRouter);
app.use("/api/trips", tripRouter);
app.use("/api/police", policeRouter);

app.use("/clear", clearRouter);
app.use("/packages", packageRouter);
app.use("/contacts", contactRouter);

async function startServer() {
    fs.mkdirSync("./user", {recursive : true});
    fs.mkdirSync("./jwt", {recursive : true});

    if (!fs.existsSync("./user/userInfo.json")){
        fs.writeFileSync("./user/userInfo.json", JSON.stringify([], null, 2));
    }
    if (!fs.existsSync("./jwt/token.json")){
        fs.writeFileSync("./jwt/token.json", JSON.stringify([], null, 2));
    }
    if (!fs.existsSync("./user/policeInfo.json")){
        fs.writeFileSync("./user/policeInfo.json", JSON.stringify([], null, 2));
    }

    await initialisePackages();
    const caseSweep = setInterval(() => {
        sweepPoliceCases().catch((error) => console.error(`Could not check for overdue route cases: ${error.message}`));
    }, 5000);
    caseSweep.unref();
    app.listen(3000, '0.0.0.0', () => console.log("server successfully started"));
}

startServer();
