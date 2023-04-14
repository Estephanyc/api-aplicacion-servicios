const express = require("express");
const database = require("./db-connect");
const app = express();
const port = 3000;
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

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

app.get("/validateUser", (req, res) => {
  let body = req.body;
  database
    .validateUser(bodyreq.user, body.clave)
    .then((data) => {
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
