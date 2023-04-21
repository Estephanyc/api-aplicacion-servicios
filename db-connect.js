var Connection = require("tedious").Connection;
var Request = require("tedious").Request;
const config = require("./config.json");
var CryptoJS = require("crypto-js");

let connection;
const getConnection = () => {
  connection = new Connection(config);

  if (connection) {
    connection = connection;
  } else {
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
    const query = `select * from USUARIOS where nombre_usuario = '${user}'`;
    getConnection();

    connection.connect((err) => {
      if (err) {
        console.log(err);
        reject(err);
      }
      const response = executeStatement(query)
        .then((res) => {
          let responseData;

          //Valida si existe el usuario
          if (res.length > 0) {
            //Valida que las contraseñas desencriptadas coincidan
            const passwordDb = res[0].clave;
            let flagValidatePassword = validatePassword(password, passwordDb);

            // Si la contraseña es valida retorna true
            if (flagValidatePassword) {
              console.log("sin son iguales");
              responseData = {
                status: true,
                data: res[0],
              };
            } else {
              //Si no es valida retorna false
              responseData = {
                status: false,
                code: 403,
                message: "Contraseña invalida",
                data: res,
              };
            }
          } else {
            //Si no hay resultados retorna false
            responseData = {
              status: false,
              code: 404,
              message: "No existe el usuario",
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

function validatePassword(userPassword, dbPassword) {
  const secret = "U2FsdGVkX1/7Iu4keisso5JGjrk9lKBLYrHnewcSNRw=";

  // Decrypt userPassword
  let bytesUser = CryptoJS.AES.decrypt(userPassword, secret);
  let decryptUserPassword = bytesUser.toString(CryptoJS.enc.Utf8);

  //Decrypt dbPassword
  var bytesBd = CryptoJS.AES.decrypt(dbPassword, secret);
  var decryptBDPassword = bytesBd.toString(CryptoJS.enc.Utf8);

  if (decryptUserPassword === decryptBDPassword) {
    return true;
  } else {
    return false;
  }
}

module.exports = {
  getApps,
  validateUser,
  registrarAuditoria,
};

function registrarAuditoria(id_usuario, id_tipo_auditoria, id_modulo, mensaje) {
  return new Promise((resolve, reject) => {
    getConnection()
    // obtener la fecha y hora actual
    var fechaActual = new Date();
    var horaActual = fechaActual.toLocaleTimeString();
    fechaActual = fechaActual.toLocaleDateString();

    // crear la consulta SQL de inserción
    var query = "INSERT INTO AUDITORIA (fecha, hora, id_usuario, id_tipo_auditoria, id_modulo, mensaje) VALUES ('" + fechaActual + "', '" + horaActual + "', " + id_usuario + ", " + id_tipo_auditoria + ", " + id_modulo + ", '" + mensaje + "')";

    // crear la solicitud a la base de datos
    const request = new Request(query, function(err, rowCount) {
      if (err) {
        console.error('Error al agregar registro de auditoría: ', err);
        reject(err);
        return;
      }
      console.log('Registro de auditoría agregado correctamente.');
      resolve();
    });

    // ejecutar la solicitud a la base de datos
    connection.execSql(request);
  });
}

