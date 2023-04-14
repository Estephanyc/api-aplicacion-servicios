var Connection = require("tedious").Connection;
var Request = require("tedious").Request;
const config = require("./config.json");

let connection;
const getConnection = () => {
  connection = new Connection(config);

  console.log("llamada de nuevo");
  if (connection) {
    console.log("ya estaba abierta");
    connection = connection;
  } else {
    console.log("se abre una nueva");

    connection = new Connection(config);
  }
};

function executeStatement(query) {
  return new Promise((resolve, reject) => {
    const request = new Request(query, (err, rowCount) => {
      if (err) {
        throw err;
      }
      connection.close();
    });

    let rowsData = [];

    request.on("row", (columns) => {
      const columnData = {};
      columns.forEach((column) => {
        columnData[column.metadata.colName] = column.value;
      });
      rowsData.push(columnData);
    });

    request.on("doneInProc", (rowCount, more) => {
      resolve(rowsData);
    });
    connection.execSql(request);
  });
}

function getApps() {
  return new Promise((resolve, reject) => {
    const query = "select * from APLICACION";
    connection.connect((err) => {
      if (err) {
        reject(err);
      }
      const response = executeStatement(query)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  });
}

function validateUser(user, password) {
  return new Promise((resolve, reject) => {
    const query = `select * from USUARIOS where nombre_usuario = '${user}' and clave = '${password}'`;
    console.log("Antes de connection");
    getConnection();
    connection.connect((err) => {
      console.log("se ejecuto validateUser query");

      if (err) {
        console.log(err);
        reject(err);
      }
      const response = executeStatement(query)
        .then((res) => {
          console.log("se ejecuto validateUser query");
          let responseData;
          if (res.length > 0) {
            responseData = {
              status: true,
              data: res[0],
            };
          } else {
            responseData = {
              status: false,
              data: res,
            };
          }
          resolve(responseData);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  });
}

module.exports = {
  getApps,
  validateUser,
};
