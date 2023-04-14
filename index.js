const express = require("express");
const database = require("./db-connect");
const app = express();
const port = 3000;
const cors = require("cors");

app.use(express.json());

app.use(cors());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/", (req, res) => {
  res.json({ message: "ok" });
});

app.get("/apps", (req, res) => {
  database
    .getApps()
    .then((data) => {
      res.json({ message: "apps oks", data: data });
    })
    .catch((err) => {});
});

app.post("/validateUser", (req, res) => {
  let body = req.body;
  console.log("se llamo a validateUser ");
  database
    .validateUser(body.usuario, body.password)
    .then((data) => {
      console.log("se recibidio respuesta de validateUser ");

      res.json({ message: "Validate user", data: data });
    })
    .catch((err) => {});
});

app.get("/modules", (req, res) => {
  database
    .getModules()
    .then((data) => {
      res.json({ message: "apps oks", data: data });
    })
    .catch((err) => {});
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
