var express = require("express");
var app = express();

var { createClient } = require("@supabase/supabase-js");

var supabaseUrl = "https://oiahxmovltfkqonigyru.supabase.co";
var supabaseKey = "sb_publishable_P5Mc_045UU-GUFB_FbyayA__CZjDVLJ";

var supabase = createClient(supabaseUrl, supabaseKey);

var jwt = require("jwt-simple");
var clave = "MICLAVEDETELEMED26-27";


app.use("/appCliente", express.static("cliente_rest"));
app.use(express.json());

app.use("/api", function(req, res, next) {
    // El login y el registro pueden utilizarse sin token.
    if (
        req.method === "POST" &&
        (req.path === "/gestores/login" || req.path === "/gestores")
    ) {
        next();
        return;
    }

    var token = req.query.token;

    if (!token) {
        res.status(401).json("No se ha encontrado token");
        return;
    }

    try {
        var contenido = jwt.decode(token, clave, false, "HS256");
    } catch (error) {
        res.status(401).json("El token es incorrecto");
        return;
    }

    if (
        !contenido ||
        !Number.isInteger(contenido.usuario) ||
        typeof contenido.expira !== "number" ||
        !Number.isFinite(contenido.expira)
    ) {
        res.status(401).json("El formato del token no es válido");
        return;
    }

    if (contenido.expira <= Date.now()) {
        res.status(401).json("El token ha caducado");
        return;
    }

    next();
});


app.get("/api/ubicaciones", function (req, res) {
  var sql = "SELECT * FROM ubicaciones";
  conexion.query(sql,function(err,ubicaciones) {
      if (err) {
        console.log("Error al realizar la select",err);
        res.status(500).json("Error al realizar la consulta");
    } else {
      console.log("Ubicaciones:", ubicaciones);
      res.json(ubicaciones)
    }
    });
});

app.get("/api/categorias", function (req, res) {
  var sql = "SELECT * FROM categorias";
  conexion.query(sql, function(err, categorias) {
    if (err) {
      console.log("Error al realizar la select", err);
      res.status(500).json("Error al realizar la consulta");
    } else {
      console.log("Categorias:", categorias);
      res.json(categorias);
    }
  });
});

app.get("/api/modelos", function (req, res) {
  var sql = "SELECT * FROM modelos";
  conexion.query(sql, function(err , modelos) {
    if (err) {
      console.log("Error al realizar la select", err);
      res.status(500).json("Error al realizar la consulta");
    } else {
      console.log("Categorias:", modelos);
      res.json(modelos);
    }
  })
});

app.post("/api/gestores/login", function(req, res) {
    var usuario = req.body.usuario;
    var contraseña = req.body.contraseña;

    var sql = "SELECT id FROM gestores WHERE usuario = ? AND contraseña = ?";

    conexion.query(sql, [usuario, contraseña], function(err, login) {
        if (err) {
            console.log("Error al iniciar sesión", err);
            res.status(500).json("Error al iniciar sesión");
            return;
        }

        if (login.length === 1) {
            var contenido = {
                usuario: login[0].id,
                expira: Date.now() + 60 * 60 * 1000
            };

            var token = jwt.encode(contenido, clave);

            res.status(200).json({
                id: login[0].id,
                token: token
            });
        } else {
            res.status(403).json("Credenciales incorrectas");
        }
    });
});

app.post("/api/gestores", function(req, res) {
  var gestor = req.body;
  var sql = "INSERT INTO gestores (nombre, apellidos, usuario, contraseña) VALUES ('"
    + gestor.nombre + "','"
    + gestor.apellidos + "','"
    + gestor.usuario + "','"
    + gestor.contraseña + "')";
  conexion.query(sql, function(err, resultado) {
    if (err) {
      if (err.code === "ER_DUP_ENTRY"){
        console.log("Gestor duplicado" , err);
        res.status(409).json("Gestor duplicado");
      }
      else {
        console.log("Error al crear el gestor", err);
        res.status(500).json("Error al crear el gestor");
      }
    }
    else {
      console.log("Gestor creado correctamente", resultado);
      res.status(201).json(resultado.insertId);
    }
  });
});

app.put("/api/gestores/:id", function(req, res) {
  var id = req.params.id;
  var gestor = req.body;
  var sql = "UPDATE gestores SET nombre = '"
      + gestor.nombre + "', apellidos = '"
      + gestor.apellidos + "', usuario = '"
      + gestor.usuario + "', contraseña = '"
      + gestor.contraseña + "' WHERE id = " + id;
  conexion.query(sql, function(err, resultado){
    if (err) {
      if (err.code === "ER_DUP_ENTRY" ){
        console.log("Gestor duplicado",err);
        res.status(409).json("Gestor duplicado")
      }
      else {
        console.log("Error al actualizar el gestor", err)
        res.status(500).json("Error al actualizar el gestor");
      }
    }
    else {
    if (resultado.affectedRows === 0) {
        res.status(404).json("Gestor no encontrado");
    } else {
        console.log("Gestor actualizado con éxito", resultado);
        res.status(200).json("Gestor actualizado correctamente");
    }
}
  })    
});

app.get("/api/gestores/:id", function(req, res) {
  var id = req.params.id;
  var sql = "SELECT id,nombre,apellidos,usuario FROM gestores WHERE id = " + id;
  conexion.query(sql, function(err, resultado){
    if (err) {
      console.log("Error al realizar la consulta", err);
      res.status(500).json("Error al realizar la consulta")
    }
    else {
      if (resultado.length === 1) {
        console.log(resultado[0])
        res.status(200).json(resultado[0])
      } else {
        console.log("No se ha encontrado un gestor con el id " + id);
        res.status(404).json("No se ha encontrado el gestor")
      }
    }
  })
});

app.get("/api/sanitarios/:id", function(req, res) {
  var id = req.params.id;
  var sql = "SELECT id,nombre,apellidos,usuario FROM sanitarios WHERE id = " + id;
    conexion.query(sql, function(err, resultado){
    if (err) {
      console.log("Error al realizar la consulta", err);
      res.status(500).json("Error al realizar la consulta")
    }
    else {
      if (resultado.length === 1) {
        console.log(resultado[0])
        res.status(200).json(resultado[0])
      } else {
        console.log("No se ha encontrado un sanitario con el id " + id);
        res.status(404).json("No se ha encontrado el sanitario")
      }
    }
  })
});

app.get("/api/recursos", function(req, res) {
  var categoria = req.query.categoria;
  var modelo = req.query.modelo;
  var ubicacion = req.query.ubicacion;
  var estado = req.query.estado;
  var sql = "SELECT r.id,m.categoria,r.modelo,r.ubicacion,r.numero_serie,r.estado "
    + "FROM recursos r, modelos m "
    + "WHERE r.modelo = m.id";
  if (categoria) {
    sql += " AND m.categoria = " + categoria;
  }
  if (modelo) {
    sql += " AND r.modelo = " + modelo;
  }
  if (ubicacion) {
    sql += " AND r.ubicacion = " + ubicacion;
  }
  if (estado) {
    sql += " AND r.estado = " + estado;
  }
  conexion.query(sql, function(err, resultado){
    if (err) {
      console.log("Error en la consulta", err);
      res.status(500).json("Error en la consulta")
    } else {
      console.log(resultado);
      res.status(200).json(resultado)
    }
  })
});

app.get("/api/recursos/:id", function(req, res) {
  var id = req.params.id
  var sql = "SELECT * FROM recursos WHERE id = " + id + " OR numero_serie = " + id;
  conexion.query(sql,function(err,resultado){
    if (err) {
      console.log("Error al realizar la consulta", err);
      res.status(500).json("Error al realizar la consulta");
    } else {
      if (resultado.length === 1){
        console.log(resultado[0]);
        res.status(200).json(resultado[0])
      } else {
        console.log("Recurso no encontrado")
        res.status(404).json("Recurso no encontrado")
      }
    }
  })
});

app.post("/api/recursos", function(req, res) {
  var recurso = req.body;
  var sql = "INSERT INTO recursos (modelo,ubicacion,numero_serie,estado) VALUES ('"
    + recurso.modelo + "','"
    + recurso.ubicacion + "','"
    + recurso.numero_serie + "','"
    + recurso.estado + "')";
  conexion.query(sql, function(err,resultado){
    if (err) {
      console.log("Error al crear el recurso", err);
      res.status(500).json("Error al crear el recurso")
    } else {
      console.log(resultado.insertId)
      res.status(201).json(resultado.insertId)
    }
  })
});

app.put("/api/recursos/:id", function(req, res) {
  var id = req.params.id;
  var recurso = req.body;
  var sql = "UPDATE recursos SET modelo = "
      + recurso.modelo + ", ubicacion = "
      + recurso.ubicacion + ", estado = "
      + recurso.estado + " WHERE id = " + id + " OR numero_serie = " + id;
  conexion.query(sql, function(err, resultado){
    if (err) {
        console.log("Error al actualizar el recurso", err)
        res.status(500).json("Error al actualizar el recurso");
      }
    else {
      if (resultado.affectedRows === 0){
        console.log("Recurso no encontrado");
        res.status(404).json("Recurso no encontrado")
      }
      else {
        console.log("Recurso actualizado correctamente", resultado);
        res.status(200).json("Recurso actualizado correctamente")
      } 
    }
    })
});

app.delete("/api/recursos/:id", function(req, res) {
  var id = req.params.id;
  var sql = "DELETE FROM recursos WHERE id = " + id + " OR numero_serie = " + id;
  conexion.query(sql, function(err, resultado){
    if (err) {
      console.log("Error al borrar el recurso", err);
      res.status(500).json("Error al borrar el recurso")
    }
    else {
      if (resultado.affectedRows === 0) {
        console.log("Recurso no encontrado")
        res.status(404).json("Recurso no encontrado")
      }
      else {
        console.log("Recurso borrado con éxito")
        res.status(200).json("Recurso borrado con éxito")
      }
    }
  })
});

app.get("/api/recursos/:id/reservas", function(req, res) {
  var id = req.params.id;
  var sql = "SELECT * FROM reservas WHERE recurso = " + id;
  conexion.query(sql, function(err,resultado){
    if (err) {
      console.log("Error al realizar la consulta", err)
      res.status(500).json("Error al realizarla consulta")
    }
    else {
      console.log(resultado)
      res.status(200).json(resultado)
    }
  })
});

app.get("/api/recursos/:id/resenyas", function(req, res) {
  var id = req.params.id;
  var sql = "SELECT * FROM resenyas WHERE recurso = " + id;
  conexion.query(sql, function(err,resultado){
    if (err) {
      console.log("Error al realizar la consulta", err)
      res.status(500).json("Error al realizarla consulta")
    }
    else {
      console.log(resultado)
      res.status(200).json(resultado)
    }
  })
  
});

app.post("/api/area_salud", function(req, res) {
  var area = req.body;
  var sql = "INSERT INTO area (codigo_postal,nombre) VALUES ('"
    + area.codigo_postal + "','"
    + area.nombre + "'";
  conexion.query(sql, function(err,resultado){
    if (err) {
      console.log("Error al crear el area", err);
      res.status(500).json("Error al crear el area")
    } else {
      console.log(resultado.insertId)
      res.status(201).json(resultado.insertId)
    }
  })
});


app.listen(3000, () => {
  console.log('Servidor en http://localhost:3000');
});
