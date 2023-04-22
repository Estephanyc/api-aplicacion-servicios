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

app.post("/getApp", (req, res) => {
  let body = req.body;
  database
    .getApp(body.idApp)
    .then((data) => {
      res.json({ message: "apps oks", data: data });
    })
    .catch((err) => {
      res.json({ message: "apps error", data: err });
    });
});

app.post("/registrarAuditoria", (req, res) => {
  let body = req.body;
  database
    .registrarAuditoria(body)
    .then((data) => {
      res.json({ message: "Auditoria ok", data: data });
    })
    .catch((err) => {
      res.json({ message: "Auditoria error", data: err });
    });
});

app.post("/validateUser", (req, res) => {
  let body = req.body;
  database
    .validateUser(body.usuario, body.password)
    .then((data) => {
      res.json({ message: "Validate user", data: data });
    })
    .catch((err) => {
      res.json({ message: "Validate user error", data: err });
    });
});

app.get("/modules", (req, res) => {
  database
    .getModules()
    .then((data) => {
      res.json({ message: "Nodules oks", data: data });
    })
    .catch((err) => {
      res.json({ message: "Get modules error", data: err });
    });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
