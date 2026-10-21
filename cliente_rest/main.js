var seccionActual = "acceso";
var idGestorActual = null;
var idRecursoActual = null;
var conexionWS = null;
var tokenGestor = null;

var listaModelos = [];
var listaCategorias = [];
var listaUbicaciones = [];

function cambiarSeccion(seccion){ 
    document.getElementById(seccionActual).style.display = "none";
    document.getElementById(seccion).style.display = "block";
    seccionActual = seccion;
}

function salir() {
    tokenGestor = null;
    idGestorActual = null;

    if (conexionWS) {
        conexionWS.close();
        conexionWS = null;
    }

    cambiarSeccion("acceso");
}

function getNombreModelo(id) {
    for (var i = 0; i < listaModelos.length; i++) {
        if (listaModelos[i].id == id) return listaModelos[i].nombre;
    }
    return id;
}

function getNombreCategoria(id) {
    for (var i = 0; i < listaCategorias.length; i++) {
        if (listaCategorias[i].id == id) return listaCategorias[i].nombre;
    }
    return id;
}

function getNombreUbicacion(id) {
    for (var i = 0; i < listaUbicaciones.length; i++) {
        if (listaUbicaciones[i].id == id) return listaUbicaciones[i].nombre;
    }
    return id;
}

function getNombreEstado(val) {
    if (val == 0) return "Operativo";
    if (val == 1) return "De baja o defectuoso";
    if (val == 2) return "En mantenimiento";
    return val;
}

function cargarListados() {
    rest.get("/api/modelos?token=" + tokenGestor, function(estado, respuesta) {
        if (estado == 200) listaModelos = respuesta;
    });

    rest.get("/api/categorias?token=" + tokenGestor, function(estado, respuesta) {
        if (estado == 200) listaCategorias = respuesta;
    });

    rest.get("/api/ubicaciones?token=" + tokenGestor, function(estado, respuesta) {
        if (estado == 200) listaUbicaciones = respuesta;
    });
}

function login() {
    var gestor = {
        usuario: document.getElementById("usuario").value,
        contraseña: document.getElementById("contraseña").value
    };

    rest.post("/api/gestores/login", gestor, function(estado, respuesta) {
        if(estado == 200) {
            idGestorActual = respuesta.id;
            tokenGestor = respuesta.token;
            cargarListados();
            cambiarSeccion('home');
            obtenerDatosYBienvenida(idGestorActual);
            mostrarRanking();
            seccionActual = 'home';
        } else {
            alert("Credenciales incorrectas.");
        }
    });
}

function obtenerDatosYBienvenida(id) {
    rest.get("/api/gestores/" + id + "?token=" + tokenGestor, function(estado, respuesta) {
        if (estado == 200) {
            var nombreCompleto = respuesta.nombre + " " + respuesta.apellidos;
            document.getElementById("texto_bienvenida").innerHTML = "Bienvenido/a " + nombreCompleto;

            conexionWS = new WebSocket("ws://localhost:4445", "avisos");
            conexionWS.addEventListener("open", function() {
                conexionWS.send(JSON.stringify({
                    operacion: "identificar",
                    rol: "gestor",
                    id: idGestorActual,
                    nombre: nombreCompleto
                }));
            });

            conexionWS.addEventListener("message", function(msg) {
                var aviso = JSON.parse(msg.data);
                var tbody = document.getElementById("tbody_avisos");
                var fila = "<tr>"
                    + "<td style='background-color:" + aviso.color + ";'>" + new Date(aviso.fecha).toLocaleString() + "</td>"
                    + "<td style='background-color:" + aviso.color + ";'>" + aviso.origen + "</td>"
                    + "<td style='background-color:" + aviso.color + ";'>" + aviso.texto + "</td>"
                    + "</tr>";
                tbody.innerHTML += fila;
            });
        } 
    });
}

function registrarUsuario() {
    var gestor = {
        nombre: document.getElementById("reg_nombre").value,
        apellidos: document.getElementById("reg_apellidos").value,
        usuario: document.getElementById("reg_usuario").value,
        contraseña: document.getElementById("reg_contraseña").value
    }
    rest.post("/api/gestores", gestor, function (estado, respuesta) {
        if (estado == 201) {
            alert("Gestor añadido correctamente a la base de datos.");
            cambiarSeccion('acceso');
            seccionActual = 'acceso';
        } else {
            alert("Error al introducir gestor en la base de datos.")
        }
    });
}

function editarDatos(){
    cambiarSeccion('editarDatos');
    seccionActual = "editarDatos";
}

function modificarUsuario() {
    var gestor = {
        id: idGestorActual,
        nombre: document.getElementById("mod_nombre").value,
        apellidos: document.getElementById("mod_apellidos").value,
        usuario: document.getElementById("mod_usuario").value,
        contraseña: document.getElementById("mod_contraseña").value
    }
    rest.put("/api/gestores/" + idGestorActual + "?token=" + tokenGestor, gestor, function(estado, respuesta) {
        if (estado == 200) {
            alert("Se han actualizado correctamente los datos.");
            idGestorActual = respuesta.id;
            cambiarSeccion('home');
        } else {
            alert("No se han actualizado los datos del gestor.")
        } 
    });
}

function mostrarRecursos() {
    var categoria = document.getElementById("home_categoria").value;
    var modelo = document.getElementById("home_modelo").value;
    var ubicacion = document.getElementById("home_ubicacion").value;
    var estadoVal = document.getElementById("home_estado").value;

    var url = "/api/recursos?token=" + tokenGestor + "&";
    if (categoria != "0") url += "categoria=" + categoria + "&";
    if (modelo != "0") url += "modelo=" + modelo + "&";
    if (ubicacion != "0") url += "ubicacion=" + ubicacion + "&";
    if (estadoVal != "-1") url += "estado=" + estadoVal + "&";

    rest.get(url, function(estado, respuesta) {
        if (estado == 200) {
            var tbody = document.querySelector("#home table tbody");
            tbody.innerHTML = "";
            for (var i = 0; i < respuesta.length; i++) {
                var r = respuesta[i];
                var fila = "<tr>"
                    + "<td>" + r.numero_serie + "</td>"
                    + "<td>" + getNombreCategoria(r.categoria) + "</td>"
                    + "<td>" + getNombreModelo(r.modelo) + "</td>"
                    + "<td>" + getNombreUbicacion(r.ubicacion) + "</td>"
                    + "<td>" + getNombreEstado(r.estado) + "</td>"
                    + "<td>"
                    + "<button onclick=\"abrirRecursoConDatos(" + r.numero_serie + ")\">Abrir</button>"
                    + "<button onclick=\"borrarRecurso(" + r.numero_serie + ", this)\">X</button>"
                    + "</td>"
                    + "</tr>";
                tbody.innerHTML += fila;
            }
        } else {
            alert("No se han podido cargar los recursos.");
        }
    });
}

function añadirRecurso() {
    var recurso = {
        modelo: document.getElementById("rec_modelo").value,
        ubicacion: document.getElementById("rec_ubicacion").value,
        numero_serie: document.getElementById("rec_num_serie").value,
        estado: document.getElementById("rec_estado").value
    }

    rest.post("/api/recursos?token=" + tokenGestor, recurso, function(estado, respuesta) {
        if(estado == 201) {
            alert("Recurso añadido correctamente a la base de datos.");

            var selectCategoria = document.getElementById("rec_categoria");
            var selectModelo = document.getElementById("rec_modelo");
            var selectUbicacion = document.getElementById("rec_ubicacion");
            var selectEstado = document.getElementById("rec_estado");

            var textoCategoria = selectCategoria.options[selectCategoria.selectedIndex].text;
            var textoModelo = selectModelo.options[selectModelo.selectedIndex].text;
            var textoUbicacion = selectUbicacion.options[selectUbicacion.selectedIndex].text;
            var textoEstado = selectEstado.options[selectEstado.selectedIndex].text;
            var numSerie = document.getElementById("rec_num_serie").value;

            if (conexionWS) {
                conexionWS.send(JSON.stringify({
                    operacion: "recursoCreado",
                    nombreCategoria: textoCategoria,
                    nombreModelo: textoModelo,
                    numeroSerie: numSerie
                }));
            }

            var tbody = document.querySelector("#home table tbody");
            var nuevaFila = "<tr>"
                + "<td>" + numSerie + "</td>"
                + "<td>" + textoCategoria + "</td>"
                + "<td>" + textoModelo + "</td>"
                + "<td>" + textoUbicacion + "</td>"
                + "<td>" + textoEstado + "</td>"
                + "<td>"
                + "<button onclick=\"abrirRecursoConDatos(" + numSerie + ")\">Abrir</button>"
                + "<button onclick=\"borrarRecurso(" + numSerie + ", this)\">X</button>"
                + "</td>"
                + "</tr>";
            tbody.innerHTML += nuevaFila;

            cambiarSeccion('home');
            seccionActual = 'home';
        } else {
            alert("El recurso no se ha podido añadir correctamente.");
        }
    });
}

function actualizarRecurso() {
    var numSerieRecurso = document.getElementById("añadir_num_serie").value;

    var recurso = {
        categoria: document.getElementById("añadir_categoria").options[document.getElementById("añadir_categoria").selectedIndex].text,
        modelo: document.getElementById("añadir_modelo").options[document.getElementById("añadir_modelo").selectedIndex].text,
        ubicacion: document.getElementById("añadir_ubicacion").options[document.getElementById("añadir_ubicacion").selectedIndex].text,
        estado: document.getElementById("añadir_estado").options[document.getElementById("añadir_estado").selectedIndex].text,
        id_modelo: document.getElementById("añadir_modelo").value,
        id_ubicacion: document.getElementById("añadir_ubicacion").value,
        id_estado: document.getElementById("añadir_estado").value
    }

    rest.put("/api/recursos/" + numSerieRecurso + "?token=" + tokenGestor, {
        modelo: recurso.id_modelo,
        ubicacion: recurso.id_ubicacion,
        estado: recurso.id_estado
    }, function(estado, respuesta) {
        if(estado == 200) {
            alert("Recurso actualizado en la base de datos.");
            var filas = document.querySelectorAll("#home table tbody tr");
            filas.forEach(function(fila) {
                if (fila.cells[0].innerText == numSerieRecurso) {
                    fila.cells[1].innerText = recurso.categoria;
                    fila.cells[2].innerText = recurso.modelo;
                    fila.cells[3].innerText = recurso.ubicacion;
                    fila.cells[4].innerText = recurso.estado;
                }
            });
            cambiarSeccion('home');
        } else {
            alert("El recurso no se ha actualizado.");
        }
    });
}

function borrarRecurso(numSerie, boton) {
    if (confirm("¿Estás seguro de que deseas eliminar el recurso con Nº Serie: " + numSerie + "?")) {
        rest.delete("/api/recursos/" + numSerie + "?token=" + tokenGestor, function(estado, respuesta) {
            if (estado == 200) {
                alert(respuesta);
                var fila = boton.parentNode.parentNode;
                fila.parentNode.removeChild(fila);
                cambiarSeccion('home');
                seccionActual = 'home';
            } else {
                alert("Error al borrar el recurso.");
            }
        });
    }
}

function abrirRecursoConDatos(numSerie) {
    rest.get("/api/recursos/" + numSerie + "?token=" + tokenGestor, function(estado, recurso) {
        if (estado == 200) {
            document.getElementById("añadir_num_serie").value = recurso.numero_serie;
            document.getElementById("añadir_modelo").value = recurso.modelo;
            document.getElementById("añadir_ubicacion").value = recurso.ubicacion;
            document.getElementById("añadir_estado").value = recurso.estado.toString();
            cargarTablaReservas(recurso.id);
            cargarTablaResenyas(recurso.id);
            cambiarSeccion('actualizarRecurso');
        } else {
            alert("Error al cargar el recurso. El servidor no lo encuentra.");
        }
    });
}

function cargarTablaReservas(idRecurso) {
    rest.get("/api/recursos/" + idRecurso + "/reservas?token=" + tokenGestor, function(estado, reservas) {
        var tbody = document.getElementById("tabla_reservas_body");
        tbody.innerHTML = "";
        if (estado == 200) {
            reservas.forEach(function(r) {
                rest.get("/api/sanitarios/" + r.sanitario + "?token=" + tokenGestor, function(st, san) {
                    var nombre = (st == 200) ? (san.nombre + " " + san.apellidos) : "ID: " + r.sanitario;
                    var colorFondo;
                    if (r.fecha_fin) {
                        colorFondo = "#ffffff";
                    } else if (r.fecha_inicio) {
                        var inicio = new Date(r.fecha_inicio);
                        var ahora = new Date();
                        var horasTranscurridas = (ahora - inicio) / (1000 * 60 * 60);
                        if (horasTranscurridas > r.horas_estimadas) {
                            colorFondo = "#fecaca";
                        } else {
                            colorFondo = "#bfdbfe";
                        }
                    } else {
                        colorFondo = "#d9f99d";
                    }
                    var fila = "<tr>"
                        + "<td style='background-color:" + colorFondo + ";'>" + nombre + "</td>"
                        + "<td style='background-color:" + colorFondo + ";'>" + r.horas_estimadas + "</td>"
                        + "<td style='background-color:" + colorFondo + ";'>" + new Date(r.fecha_peticion).toLocaleDateString() + "</td>"
                        + "<td style='background-color:" + colorFondo + ";'>" + (r.fecha_inicio ? new Date(r.fecha_inicio).toLocaleDateString() : "-") + "</td>"
                        + "<td style='background-color:" + colorFondo + ";'>" + (r.fecha_fin ? new Date(r.fecha_fin).toLocaleDateString() : "-") + "</td>"
                        + "</tr>";
                    tbody.innerHTML += fila;
                });
            });
        }
    });
}

function cargarTablaResenyas(idRecurso) {
    rest.get("/api/recursos/" + idRecurso + "/resenyas?token=" + tokenGestor, function(estado, resenyas) {
        var tbody = document.getElementById("tabla_resenas_body");
        tbody.innerHTML = "";
        if (estado == 200) {
            resenyas.forEach(function(r) {
                rest.get("/api/sanitarios/" + r.sanitario + "?token=" + tokenGestor, function(st, san) {
                    var nombre = (st == 200) ? (san.nombre + " " + san.apellidos) : "ID: " + r.sanitario;
                    var fila = "<tr><td>"+new Date(r.fecha).toLocaleDateString()+"</td><td>"+nombre+"</td><td>"+r.valor+"</td><td>"+r.descripcion+"</td></tr>";
                    tbody.innerHTML += fila;
                });
            });
        }
    });
}

function enviarDatosMinisterio() {
    rest.get("/api/recursos?token=" + tokenGestor, function(estado, recursos) {
        if (estado != 200 || !Array.isArray(recursos)) {
            alert("Error al obtener los recursos");
            return;
        }

        if (recursos.length == 0) {
            alert("No hay recursos");
            return;
        }

        var reservasObtenidas = [];
        var recursosTerminados = 0;

        // Obtener las reservas de todos los recursos.
        recursos.forEach(function(recurso) {
            rest.get("/api/recursos/" + recurso.id + "/reservas?token=" + tokenGestor,
                function(estadoReservas, reservas) {
                    if (estadoReservas != 200 || !Array.isArray(reservas)) {
                        alert("Error al obtener reservas. No se enviarán los datos");
                        return;
                    }

                    reservas.forEach(function(reserva) {
                        reservasObtenidas.push({
                            reserva: reserva,
                            categoria: getNombreCategoria(recurso.categoria)
                        });
                    });

                    recursosTerminados++;

                    // Esperar a tener las reservas de todos los recursos.
                    if (recursosTerminados != recursos.length) {
                        return;
                    }

                    if (reservasObtenidas.length == 0) {
                        alert("No hay reservas para enviar");
                        return;
                    }

                    var datos = [];
                    var sanitariosTerminados = 0;

                    // Obtener el sanitario de cada reserva.
                    reservasObtenidas.forEach(function(elemento) {
                        var reserva = elemento.reserva;

                        rest.get("/api/sanitarios/" + reserva.sanitario + "?token=" + tokenGestor,
                            function(estadoSanitario, sanitario) {
                                if (estadoSanitario != 200 || !sanitario ||
                                    typeof sanitario.nombre != "string" ||
                                    typeof sanitario.apellidos != "string" ||
                                    typeof elemento.categoria != "string") {
                                    alert("Error en los datos del sanitario o la categoría. No se enviarán los datos");
                                    return;
                                }

                                // Campos exactos que pide el Ministerio.
                                datos.push({
                                    nombre: sanitario.nombre,
                                    apellidos: sanitario.apellidos,
                                    "categoría": elemento.categoria,
                                    horas_estimadas: reserva.horas_estimadas,
                                    fec_pet: reserva.fecha_peticion,
                                    fec_ini: reserva.fecha_inicio,
                                    fecha_fin: reserva.fecha_fin
                                });

                                sanitariosTerminados++;

                                // Esperar a que estén preparadas todas las reservas.
                                if (sanitariosTerminados != reservasObtenidas.length) {
                                    return;
                                }

                                // Fecha de hoy en formato YYYY-MM-DD.
                                var hoy = new Date();
                                var fecha = hoy.getFullYear() + "-" +
                                    ("0" + (hoy.getMonth() + 1)).slice(-2) + "-" +
                                    ("0" + hoy.getDate()).slice(-2);

                                var envio = {
                                    id_area: 4,
                                    fecha: fecha,
                                    datos: datos
                                };

                                // Un único POST con todas las reservas.
                                rest.post(
                                    "https://undefined.ua.es/telemedicina/api/datos",
                                    envio,
                                    function(estadoPost, respuesta) {
                                        if (estadoPost >= 200 && estadoPost < 300) {
                                            alert("Enviadas " + datos.length + " reservas al Ministerio");
                                        } else {
                                            console.log(respuesta);
                                            alert("Error al enviar los datos. Estado: " + estadoPost);
                                        }
                                    }
                                );
                            }
                        );
                    });
                }
            );
        });
    });
}

function mostrarRanking() {
    var tabla = document.getElementById("tabla_ranking");
    tabla.innerHTML = '<tr><td colspan="3">Cargando ranking...</td></tr>';

    // Cada posición coincide con el id_area del enunciado.
    var areas = [
        "",
        "Alergología",
        "Anestesiología",
        "Cardiología",
        "Cirugía General",
        "Dermatología",
        "Aparato Digestivo",
        "Endocrinología",
        "Ginecología",
        "Hematología",
        "Medicina Interna",
        "Neumología",
        "Neurología",
        "Oftalmología",
        "Oncología",
        "Pediatría",
        "Psiquiatría",
        "Traumatología",
        "Urología"
    ];

    rest.get(
        "https://undefined.ua.es/telemedicina/api/datos",
        function(estado, envios) {
            if (estado != 200 || !Array.isArray(envios)) {
                tabla.innerHTML =
                    '<tr><td colspan="3">Error al obtener el ranking</td></tr>';
                return;
            }

            var ranking = [];

            // Empezamos con cero reservas para cada área.
            for (var i = 1; i < areas.length; i++) {
                ranking.push({
                    area: areas[i],
                    total: 0
                });
            }

            // Sumar las reservas de cada envío a su área.
            envios.forEach(function(envio) {
                if (
                    !envio ||
                    !Number.isInteger(envio.id_area) ||
                    envio.id_area < 1 ||
                    envio.id_area >= areas.length ||
                    !Array.isArray(envio.datos)
                ) {
                    return;
                }

                ranking[envio.id_area - 1].total += envio.datos.length;
            });

            // Ordenar de mayor a menor número de reservas.
            ranking.sort(function(a, b) {
                return b.total - a.total;
            });

            // Mostrar una fila por área.
            tabla.innerHTML = "";

            var medallas = ["🥇", "🥈", "🥉"];

            for (var i = 0; i < ranking.length; i++) {
                var posicion = i + 1;

                if (i < 3) {
                    posicion = medallas[i];
                }

                tabla.innerHTML +=
                    "<tr>" +
                        "<td>" + posicion + "</td>" +
                        "<td>" + ranking[i].area + "</td>" +
                        "<td>" + ranking[i].total + "</td>" +
                    "</tr>";
            }
        }
    );
}
