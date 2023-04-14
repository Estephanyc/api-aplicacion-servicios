var Connection = require("tedious").Connection;
var Request = require("tedious").Request;
const config = require("./config.json");

const connection = new Connection(config);

function executeStatement(query) {
  return new Promise((resolve, reject) => {
    const request = new Request(query, (err, rowCount) => {
      if (err) {
        throw err;
      }
      connection.close();
    });

    let result = [];

    request.on("row", (columns) => {
      columns.forEach((column) => {
        const columnData = {
          name: column.metadata.colName,
          value: column.value,
        };
        result.push(columnData);
      });
    });

    request.on("doneInProc", (rowCount, more) => {
      resolve(result);
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

module.exports = {
  getApps,
  validateUser,
};
