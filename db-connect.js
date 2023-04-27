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
        console.log(err);
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
    const query = `select * from USUARIOS u 
    join APLICACION a on a.id_app = u.id_app
    join EMPRESA e on e.id_app = u.id_app
    join ROLES_USUARIOS ro on ro.id_usuario = u.id_usuario
    join ROLES R on r.id_rol = ro.id_rol
    where u.nombre_usuario = '${user}'`;

    getConnection();

    connection.connect((err) => {
      if (err) {
        reject(err);
      }
      const response = executeStatement(query)
        .then((res) => {
          let responseData;

          //Valida si hay resultados
          if (res.length > 0) {
            //Valida que las contraseñas desencriptadas coinciden
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
                resolve(responseData);
              } else {
                //Si no esta activo false
                responseData = {
                  status: false,
                  code: 401,
                  message: "Usuario no esta activo",
                  data: res,
                };
                resolve(responseData);
              }
            } else {
              //Si no es valida retorna false
              responseData = {
                status: false,
                code: 403,
                message: "Contraseña invalida",
                data: res,
              };

              //id de usuario
              const id_usuario = res[0].id_usuario;

              //Registrar inicio invalido
              registrarLoginIncorrecto(id_usuario)
                .then((response) => {
                  //Validar si es el 3 intento de inicio de sesion invalido
                  obtenerIntentosFallidos(id_usuario)
                    .then((intentosFallidos) => {
                      if (intentosFallidos >= 3) {
                        responseData = {
                          status: false,
                          code: 405,
                          message:
                            "El usuario ha sido bloqueado, intente iniciar más tarde",
                          data: res,
                        };
                      }
                      resolve(responseData);
                    })
                    .catch((err) => {
                      reject(err);
                    });
                })
                .catch((err) => {
                  reject(err);
                });
            }
          } else {
            //Si no hay resultados retorna false
            responseData = {
              status: false,
              code: 404,
              message: "No existe el usuario",
              data: res,
            };
            resolve(responseData);
          }
        })
        .catch((err) => {
          reject(err);
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
    const horaActual = fechaActual.toLocaleTimeString();

    // crear la consulta SQL de inserción
    const query = `INSERT INTO AUDITORIA (fecha, hora, id_usuario, tipo_auditoria, modulo, mensaje) values(
      getdate(), '${horaActual}', ${id_usuario}, '${tipo_auditoria}', '${modulo}', '${mensaje}'
    )`;

    //Obtener la conexión
    getConnection();

    connection.connect((err) => {
      if (err) {
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

function registrarLoginIncorrecto(id_usuario) {
  return new Promise((resolve, reject) => {
    const query = `UPDATE USUARIOS 
    SET intentos_fallidos = (SELECT U2.intentos_fallidos + 1 FROM USUARIOS U2 WHERE U2.id_usuario = ${id_usuario})
    where id_usuario = ${id_usuario}`;

    getConnection();

    connection.connect((err) => {
      if (err) {
        reject(err);
      }
      const response = executeStatement(query)
        .then((res) => {
          resolve(true);
        })
        .catch((err) => {
          reject(err);
        });
    });
  });
}

function obtenerIntentosFallidos(id_usuario) {
  return new Promise((resolve, reject) => {
    const query = `select intentos_fallidos from USUARIOS where id_usuario = ${id_usuario}`;

    getConnection();

    connection.connect((err) => {
      if (err) {
        reject(err);
      }
      const response = executeStatement(query)
        .then((res) => {
          resolve(res[0].intentos_fallidos);
        })
        .catch((err) => {
          reject(err);
        });
    });
  });
}

function getModules(idApp, idUsuario) {
  return new Promise((resolve, reject) => {
    const query = `select
      m.id_modulo,
      m.nombre_modulo,
      m.estado,
      m.icono,
      o.id_opcion,
      o.nombre_opcion,
      o.componente
    from MODULOS m
        join OPCIONES o ON o.id_modulo = m.id_modulo
        join USUARIOS u on id_usuario = '${idUsuario}'
        join ROLES_USUARIOS ru on ru.id_usuario = u.id_usuario
        join ROLES_OPCIONES ro on ru.id_rol = ro.id_rol and ro.id_opcion = o.id_opcion
    where m.id_app = '${idApp}'`;

    console.log(query);
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
            data: res,
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

module.exports = {
  getApp,
  validateUser,
  registrarAuditoria,
  getModules,
};
