import express from "express";
import fs from "fs";
import registerRouter from "./router/registerRouter.js";
import clearRouter from "./router/clearRouter.js";
import packageRouter, { initialisePackages } from "./router/packageRouter.js";
import contactRouter from "./router/contactRouter.js";
import locationRouter from "./router/locationRouter.js";
import deviceTokenRouter from "./router/deviceTokenRouter.js";

const app = express();

app.use(express.text());
app.use(express.json());

app.use("/user", registerRouter);
app.use("/user/contacts", contactRouter);
app.use("/user/device-token", deviceTokenRouter);
app.use("/api/location", locationRouter);

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

    await initialisePackages();
    app.listen(3000, '0.0.0.0', () => console.log("server successfully started"));
}

startServer();
