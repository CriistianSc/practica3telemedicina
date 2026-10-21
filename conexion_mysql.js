const mysql = require('mysql');
const database = {
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'telemed26-27'
};

const conexion = mysql.createConnection(database);

conexion.connect(function (err) {
    if (err) {
        console.error('Error en la conexión de la base de datos:',err);
        process.exit();
    }
    console.log('Conectado correctamente a MySQL');
});

module.exports = conexion;  