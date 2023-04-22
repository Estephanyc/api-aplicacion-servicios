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

function getApp(idApp) {
  console.log("id app ", idApp);

  return new Promise((resolve, reject) => {
    const query = `select * from APLICACION where id_app = '${idApp}'`;
    getConnection();

    connection.connect((err) => {
      if (err) {
        reject(err);
      }
      const response = executeStatement(query)
        .then((res) => {
          const responseData = {
            status: true,
            code: 200,
            message: "ok",
            data: res[0],
          };
          resolve(responseData);
        })
        .catch((err) => {
          const responseData = {
            status: false,
            code: 403,
            message: "Error al obtener la app",
            data: err,
          };
          resolve(responseData);
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

          //Valida si hay resultados
          if (res.length > 0) {
            //Valida que las contraseñas desencriptadas coincidan
            const passwordDb = res[0].clave;
            let flagValidatePassword = validatePassword(password, passwordDb);

            // Si la contraseña es valida retorna true
            if (flagValidatePassword) {
              //Validar si el usuario esta activo
              const estadoUsuario = res[0].estado;
              if (estadoUsuario == 1) {
                responseData = {
                  status: true,
                  code: 200,
                  message: "ok",
                  data: res[0],
                };
              } else {
                //Si no esta activo false
                responseData = {
                  status: false,
                  code: 401,
                  message: "Usuario no esta activo",
                  data: res,
                };
              }
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

function registrarAuditoria(body) {
  const { id_usuario, tipo_auditoria, modulo, mensaje } = body;

  return new Promise((resolve, reject) => {
    // obtener la fecha y hora actual
    var fechaActual = new Date();
    var horaActual = fechaActual.toLocaleTimeString();
    fechaActual = fechaActual.toLocaleDateString();

    // crear la consulta SQL de inserción
    const query = `INSERT INTO AUDITORIA (fecha, hora, id_usuario, tipo_auditoria, modulo, mensaje) values(
      '${fechaActual}', '${horaActual}', ${id_usuario}, '${tipo_auditoria}', '${modulo}', '${mensaje}'
    )`;

    //Obtener la conexión
    getConnection();

    connection.connect((err) => {
      if (err) {
        console.log(err);
        reject(err);
      }
      const response = executeStatement(query)
        .then((res) => {
          let responseData = {
            status: true,
            code: 200,
            message: "Registro actualizado correctamente",
            data: res,
          };
          resolve(responseData);
        })
        .catch((err) => {
          let responseData = {
            status: false,
            code: 500,
            message: "Registro no se pudo actualizar",
            data: err,
          };
          resolve(responseData);
        });
    });
  });
}

module.exports = {
  getApp,
  validateUser,
  registrarAuditoria,
};
