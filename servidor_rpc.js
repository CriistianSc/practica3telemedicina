var rpc = require("./rpc.js");
var conexionBD = require("./conexion_mysql.js");

rpc.debug = true;

var servidor = rpc.server(3501, function() {
    console.log("Servidor RPC iniciado...");
});

var app = servidor.createApp("gestion_pacientes");

function obtenerCategorias(callback) {
    conexionBD.query("SELECT * FROM categorias", function(error,datos){
        if (error) {
            callback(null)
        }
        else {
            callback(datos)
        }
    })
}

function obtenerModelos(callback) {
    conexionBD.query("SELECT * FROM modelos", function(error,datos){
        if (error) {
            callback(null)
        }
        else {
            callback(datos)
        }
    })
}

function loginSanitario(usuario, contraseña, callback) {
    conexionBD.query("SELECT * FROM sanitarios WHERE usuario = '" + usuario + "' AND contraseña = '" + contraseña + "'", function(error,datos){
        if (error) {
            callback(null)
        }
        else {
            if (datos.length === 1) {
                callback(datos[0].id);
            }
            else {
                callback(null)
            }
        }
    });
   
}

function crearSanitario(nombre, apellidos, usuario, contraseña, callback) {
    conexionBD.query("INSERT INTO sanitarios (nombre,apellidos,usuario,contraseña) VALUES ('"
        + nombre + "', '"
        + apellidos + "', '"
        + usuario + "', '"
        + contraseña + "')",
        function(error,datos){
            if (error) {
                callback(null)
            }
            else {
                callback(datos.insertId);
            }
        }
    )
}

function editarDatos(idSanitario, datosSanitario, callback) {
    conexionBD.query("UPDATE sanitarios SET nombre = '"
        + datosSanitario.nombre + "', apellidos = '"
        + datosSanitario.apellidos + "', usuario = '"
        + datosSanitario.usuario + "', contraseña = '"
        + datosSanitario.contraseña + "' WHERE id = " + idSanitario,
        function(error,datos){
            if(error){
                callback(null)
            }
            else {
                if (datos.affectedRows ===0){
                    callback(null)
                }
                else {
                    callback(true)
                }
            }
        }
    )
}

function obtenerSanitario(idSanitario, callback) {
    conexionBD.query(
        "SELECT id, nombre, apellidos, usuario FROM sanitarios WHERE id = " + idSanitario,
        function(error, datos) {
            if (error) {
                callback(null);
            } else {
                if (datos.length === 1) {
                    callback(datos[0]);
                } else {
                    callback(null);
                }
            }
        }
    );
}

function obtenerRecursos(idModelo, callback) {
    conexionBD.query("SELECT * FROM recursos WHERE modelo = '"+idModelo+"' AND estado = "+ 0 +"",
        function(error,datos){
            if (error) {
                callback(null)
            }
            else {
                callback(datos)
            }
        }
    )
}

function obtenerRecurso(idRecurso, callback) {
    conexionBD.query(
        "SELECT * FROM recursos WHERE id = " + idRecurso,
        function(error, datos) {
            if (error) {
                callback(null);
            } else {
                if (datos.length === 1) {
                    callback(datos[0]);
                } else {
                    callback(null);
                }
            }
        }
    );
}

function obtenerReservas(idSanitario, callback) {
    conexionBD.query(
        "SELECT r.*, "
        + "re.numero_serie, "
        + "m.nombre modelo, "
        + "c.nombre categoria, "
        + "u.nombre ubicacion "
        + "FROM reservas r, recursos re, modelos m, categorias c, ubicaciones u "
        + "WHERE r.recurso = re.id "
        + "AND re.modelo = m.id "
        + "AND m.categoria = c.id "
        + "AND re.ubicacion = u.id "
        + "AND r.sanitario = " + idSanitario,
        function(error, datos) {
            if (error) {
                callback(null);
            } else {
                callback(datos);
            }
        }
    );
}

function obtenerResenyas(idRecurso, callback) {
    conexionBD.query(
        "SELECT * FROM resenyas WHERE recurso = " + idRecurso,
        function(error, datos) {
            if (error) {
                callback(null);
            } else {
                callback(datos);
            }
        }
    );
}

function obtenerRecursosDisponibles(idModelo, callback) {
    conexionBD.query(
        "SELECT r.id, r.numero_serie, u.nombre ubicacion, "
        + "IFNULL(AVG(v.valor), 0) valoracion, "
        + "'Disponible' horas_restantes "
        + "FROM recursos r "
        + "JOIN ubicaciones u ON r.ubicacion = u.id "
        + "LEFT JOIN resenyas v ON v.recurso = r.id "
        + "WHERE r.modelo = " + idModelo + " AND r.estado = 0 "
        + "GROUP BY r.id, r.numero_serie, u.nombre",
        function(error, datos) {
            if (error) {
                callback(null);
            } else {
                callback(datos);
            }
        }
    );
}

function reservarRecurso(idRecurso, idSanitario, horasEstimadas, callback) {
    conexionBD.query(
        "INSERT INTO reservas "
        + "(recurso, sanitario, horas_estimadas, fecha_peticion, fecha_inicio, fecha_fin) "
        + "VALUES ("
        + idRecurso + ", "
        + idSanitario + ", "
        + horasEstimadas + ", NOW(), NULL, NULL)",
        function(error, datos) {
            if (error) {
                callback(null);
            } else {
                callback(datos.insertId);
            }
        }
    );
}

function iniciarReserva(idReserva, callback) {
    conexionBD.query(
        "UPDATE reservas SET fecha_inicio = NOW() "
        + "WHERE id = " + idReserva + " AND fecha_inicio IS NULL",
        function(error, datos) {
            if (error) {
                callback(null);
            } else {
                if (datos.affectedRows === 0) {
                    callback(null);
                } else {
                    callback(true);
                }
            }
        }
    );
}

function finalizarReserva(idReserva, callback) {
    conexionBD.query(
        "UPDATE reservas SET fecha_fin = NOW() "
        + "WHERE id = " + idReserva
        + " AND fecha_inicio IS NOT NULL "
        + "AND fecha_fin IS NULL",
        function(error, datos) {
            if (error) {
                callback(null);
            } else {
                if (datos.affectedRows === 0) {
                    callback(null);
                } else {
                    callback(true);
                }
            }
        }
    );
}

function cancelarReserva(idReserva, callback) {
    conexionBD.query("DELETE FROM reservas WHERE id = " + idReserva , 
        function(error,datos){
            if (error) {
                callback(null)
            }
            else {
                if (datos.affectedRows === 0) {
                    callback(null)
                }
                else {
                    callback(true)
                }
            }
        }
    )
}


function crearResenya(idRecurso, idSanitario, valoracion, descripcion, callback) {
    conexionBD.query(
        "INSERT INTO resenyas "
        + "(recurso, sanitario, fecha, valor, descripcion) "
        + "VALUES ("
        + idRecurso + ", "
        + idSanitario + ", NOW(), "
        + valoracion + ", '"
        + descripcion + "')",
        function(error, datos) {
            if (error) {
                callback(null);
            } else {
                callback(datos.insertId);
            }
        }
    );
}

function tiempoPendiente(idRecurso, callback) {
    conexionBD.query(
        "SELECT horas_estimadas, fecha_inicio FROM reservas "
        + "WHERE recurso = " + idRecurso
        + " AND fecha_fin IS NULL ORDER BY fecha_peticion",
        function(error, datos) {
            if (error) {
                callback(null);
            } else {
                var ahora = new Date();
                var tiempoRestante = 0;

                for (var i = 0; i < datos.length; i++) {
                    if (datos[i].fecha_inicio != null) {
                        var inicio = new Date(datos[i].fecha_inicio);

                        var finEstimado =
                            inicio.getTime()
                            + datos[i].horas_estimadas * 60 * 60 * 1000;

                        var diferenciaHoras =
                            (finEstimado - ahora.getTime())
                            / (1000 * 60 * 60);

                        if (diferenciaHoras > 0) {
                            tiempoRestante += diferenciaHoras;
                        }
                    } else {
                        tiempoRestante += datos[i].horas_estimadas;
                    }
                }

                callback(tiempoRestante);
            }
        }
    );
}

function calcularTiempoReserva(idReserva, callback) {
    conexionBD.query(
        "SELECT TIMESTAMPDIFF(HOUR, fecha_inicio, fecha_fin) tiempo "
        + "FROM reservas WHERE id = " + idReserva,
        function(error, datos) {
            if (error) {
                callback(null);
            } else {
                if (datos.length === 1) {
                    callback(datos[0].tiempo);
                } else {
                    callback(null);
                }
            }
        }
    );
}

function contarReservasPendientes(callback) {
    conexionBD.query(
        "SELECT COUNT(*) total FROM reservas "
        + "WHERE fecha_inicio IS NULL AND fecha_fin IS NULL",
        function(error, datos) {
            if (error) {
                callback(null);
            } else {
                callback(datos[0].total);
            }
        }
    );
}

function duplicarReserva(idReserva, callback) {
    conexionBD.query(
        "INSERT INTO reservas "
        + "(recurso, sanitario, horas_estimadas, fecha_peticion, fecha_inicio, fecha_fin) "
        + "SELECT recurso, sanitario, horas_estimadas, NOW(), NULL, NULL "
        + "FROM reservas WHERE id = " + idReserva,
        function(error, datos) {
            if (error) {
                callback(null);
            } else {
                if (datos.affectedRows === 0) {
                    callback(null);
                } else {
                    callback(datos.insertId);
                }
            }
        }
    );
}

function obtenerSanitariosPendientes(idRecurso, callback) {
    conexionBD.query(
        "SELECT sanitario FROM reservas "
        + "WHERE recurso = " + idRecurso
        + " AND fecha_inicio IS NULL "
        + "AND fecha_fin IS NULL",
        function(error, datos) {
            if (error) {
                callback(null);
            } else {
                var sanitariosPendientes = [];

                for (var i = 0; i < datos.length; i++) {
                    sanitariosPendientes.push(datos[i].sanitario);
                }

                callback(sanitariosPendientes);
            }
        }
    );
}

function obtenerSanitariosNoFinalizados(
    idRecurso,
    idSanitarioExcluir,
    callback
) {
    conexionBD.query(
        "SELECT DISTINCT sanitario FROM reservas "
        + "WHERE recurso = " + idRecurso
        + " AND fecha_fin IS NULL "
        + "AND sanitario <> " + idSanitarioExcluir,
        function(error, datos) {
            if (error) {
                callback(null);
            } else {
                var resultado = [];

                for (var i = 0; i < datos.length; i++) {
                    resultado.push(datos[i].sanitario);
                }

                callback(resultado);
            }
        }
    );
}

app.registerAsync("obtenerCategorias", obtenerCategorias);
app.registerAsync("obtenerModelos", obtenerModelos);
app.registerAsync("loginSanitario", loginSanitario);
app.registerAsync("crearSanitario", crearSanitario);
app.registerAsync("editarDatos", editarDatos);
app.registerAsync("obtenerSanitario", obtenerSanitario);
app.registerAsync("obtenerRecursos", obtenerRecursos);
app.registerAsync("obtenerRecurso", obtenerRecurso);
app.registerAsync("obtenerReservas", obtenerReservas);
app.registerAsync("obtenerResenyas", obtenerResenyas);
app.registerAsync("obtenerRecursosDisponibles", obtenerRecursosDisponibles);
app.registerAsync("reservarRecurso", reservarRecurso);
app.registerAsync("iniciarReserva", iniciarReserva);
app.registerAsync("finalizarReserva", finalizarReserva);
app.registerAsync("cancelarReserva", cancelarReserva);
app.registerAsync("crearResenya", crearResenya);
app.registerAsync("tiempoPendiente", tiempoPendiente);
app.registerAsync("calcularTiempoReserva", calcularTiempoReserva);
app.registerAsync("contarReservasPendientes", contarReservasPendientes);
app.registerAsync("duplicarReserva", duplicarReserva);
app.registerAsync("obtenerSanitariosPendientes", obtenerSanitariosPendientes);
app.registerAsync("obtenerSanitariosNoFinalizados", obtenerSanitariosNoFinalizados);