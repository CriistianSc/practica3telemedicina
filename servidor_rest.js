// Copiar el contenido de este archivo en servidor_rest.js de GitHub.
// Esta copia utiliza Express 5 y Supabase; conserva la autenticacion JWT.
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
        res.status(401).json("El formato del token no es valido");
        return;
    }

    if (contenido.expira <= Date.now()) {
        res.status(401).json("El token ha caducado");
        return;
    }

    next();
});

app.get("/api/ubicaciones", async function(req, res) {
    var { data, error } = await supabase
        .from("ubicaciones")
        .select("*")
        .order("id");

    if (error) throw error;
    res.status(200).json(data);
});

app.get("/api/categorias", async function(req, res) {
    var { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("id");

    if (error) throw error;
    res.status(200).json(data);
});

app.get("/api/modelos", async function(req, res) {
    var { data, error } = await supabase
        .from("modelos")
        .select("*")
        .order("id");

    if (error) throw error;
    res.status(200).json(data);
});

app.post("/api/gestores/login", async function(req, res) {
    var usuario = req.body && req.body.usuario;
    var contraseña = req.body && req.body.contraseña;

    if (typeof usuario !== "string" || typeof contraseña !== "string") {
        res.status(400).json("Introduce usuario y contraseña");
        return;
    }

    var { data: gestores, error } = await supabase
        .from("gestores")
        .select("id")
        .eq("usuario", usuario)
        .eq("contraseña", contraseña);

    if (error) throw error;

    if (gestores.length !== 1) {
        res.status(403).json("Credenciales incorrectas");
        return;
    }

    var contenido = {
        usuario: gestores[0].id,
        expira: Date.now() + 60 * 60 * 1000
    };

    var token = jwt.encode(contenido, clave);

    res.status(200).json({
        id: gestores[0].id,
        token: token
    });
});

app.post("/api/gestores", async function(req, res) {
    var gestor = req.body;

    var { data, error } = await supabase
        .from("gestores")
        .insert({
            nombre: gestor.nombre,
            apellidos: gestor.apellidos,
            usuario: gestor.usuario,
            "contraseña": gestor.contraseña
        })
        .select("id")
        .single();

    if (error && error.code === "23505") {
        res.status(409).json("Gestor duplicado");
        return;
    }

    if (error) throw error;
    res.status(201).json(data.id);
});

app.put("/api/gestores/:id", async function(req, res) {
    var gestor = req.body;

    var { data, error } = await supabase
        .from("gestores")
        .update({
            nombre: gestor.nombre,
            apellidos: gestor.apellidos,
            usuario: gestor.usuario,
            "contraseña": gestor.contraseña
        })
        .eq("id", req.params.id)
        .select("id");

    if (error && error.code === "23505") {
        res.status(409).json("Gestor duplicado");
        return;
    }

    if (error) throw error;

    if (data.length === 0) {
        res.status(404).json("Gestor no encontrado");
        return;
    }

    res.status(200).json({ id: data[0].id });
});

app.get("/api/gestores/:id", async function(req, res) {
    var { data, error } = await supabase
        .from("gestores")
        .select("id,nombre,apellidos,usuario")
        .eq("id", req.params.id)
        .maybeSingle();

    if (error) throw error;

    if (data === null) {
        res.status(404).json("No se ha encontrado el gestor");
        return;
    }

    res.status(200).json(data);
});

app.get("/api/sanitarios/:id", async function(req, res) {
    var { data, error } = await supabase
        .from("sanitarios")
        .select("id,nombre,apellidos,usuario")
        .eq("id", req.params.id)
        .maybeSingle();

    if (error) throw error;

    if (data === null) {
        res.status(404).json("No se ha encontrado el sanitario");
        return;
    }

    res.status(200).json(data);
});

app.get("/api/recursos", async function(req, res) {
    var consulta = supabase
        .from("recursos")
        .select("id,modelo,ubicacion,numero_serie,estado,modelos!inner(categoria)");

    if (req.query.categoria) {
        consulta = consulta.eq("modelos.categoria", req.query.categoria);
    }
    if (req.query.modelo) {
        consulta = consulta.eq("modelo", req.query.modelo);
    }
    if (req.query.ubicacion) {
        consulta = consulta.eq("ubicacion", req.query.ubicacion);
    }
    if (req.query.estado) {
        consulta = consulta.eq("estado", req.query.estado);
    }

    var { data, error } = await consulta.order("id");
    if (error) throw error;

    // Mantener categoria al mismo nivel que los otros campos, como espera main.js.
    var recursos = data.map(function(recurso) {
        return {
            id: recurso.id,
            categoria: recurso.modelos.categoria,
            modelo: recurso.modelo,
            ubicacion: recurso.ubicacion,
            numero_serie: recurso.numero_serie,
            estado: recurso.estado
        };
    });

    res.status(200).json(recursos);
});

app.get("/api/recursos/:id", async function(req, res) {
    var id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        res.status(400).json("Identificador de recurso no valido");
        return;
    }

    var { data, error } = await supabase
        .from("recursos")
        .select("*")
        .or("id.eq." + id + ",numero_serie.eq." + id)
        .limit(2);

    if (error) throw error;

    if (data.length === 0) {
        res.status(404).json("Recurso no encontrado");
        return;
    }

    if (data.length > 1) {
        res.status(409).json("El identificador coincide con varios recursos");
        return;
    }

    res.status(200).json(data[0]);
});

app.post("/api/recursos", async function(req, res) {
    var recurso = req.body;

    var { data, error } = await supabase
        .from("recursos")
        .insert({
            modelo: recurso.modelo,
            ubicacion: recurso.ubicacion,
            numero_serie: recurso.numero_serie,
            estado: recurso.estado
        })
        .select("id")
        .single();

    if (error) throw error;
    res.status(201).json(data.id);
});

app.put("/api/recursos/:id", async function(req, res) {
    var id = Number(req.params.id);
    var recurso = req.body;

    if (!Number.isSafeInteger(id) || id <= 0) {
        res.status(400).json("Identificador de recurso no valido");
        return;
    }

    // Resolver primero el ID o numero de serie para actualizar un solo recurso.
    var { data: coincidencias, error: errorBusqueda } = await supabase
        .from("recursos")
        .select("id")
        .or("id.eq." + id + ",numero_serie.eq." + id)
        .limit(2);

    if (errorBusqueda) throw errorBusqueda;

    if (coincidencias.length === 0) {
        res.status(404).json("Recurso no encontrado");
        return;
    }

    if (coincidencias.length > 1) {
        res.status(409).json("El identificador coincide con varios recursos");
        return;
    }

    var { data, error } = await supabase
        .from("recursos")
        .update({
            modelo: recurso.modelo,
            ubicacion: recurso.ubicacion,
            estado: recurso.estado
        })
        .eq("id", coincidencias[0].id)
        .select("id");

    if (error) throw error;

    if (data.length === 0) {
        res.status(404).json("Recurso no encontrado");
        return;
    }

    res.status(200).json("Recurso actualizado correctamente");
});

app.delete("/api/recursos/:id", async function(req, res) {
    var id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        res.status(400).json("Identificador de recurso no valido");
        return;
    }

    var { data: coincidencias, error: errorBusqueda } = await supabase
        .from("recursos")
        .select("id")
        .or("id.eq." + id + ",numero_serie.eq." + id)
        .limit(2);

    if (errorBusqueda) throw errorBusqueda;

    if (coincidencias.length === 0) {
        res.status(404).json("Recurso no encontrado");
        return;
    }

    if (coincidencias.length > 1) {
        res.status(409).json("El identificador coincide con varios recursos");
        return;
    }

    var { data, error } = await supabase
        .from("recursos")
        .delete()
        .eq("id", coincidencias[0].id)
        .select("id");

    if (error) throw error;

    if (data.length === 0) {
        res.status(404).json("Recurso no encontrado");
        return;
    }

    res.status(200).json("Recurso borrado con exito");
});

app.get("/api/recursos/:id/reservas", async function(req, res) {
    var { data, error } = await supabase
        .from("reservas")
        .select("*")
        .eq("recurso", req.params.id)
        .order("id");

    if (error) throw error;
    res.status(200).json(data);
});

app.get("/api/recursos/:id/resenyas", async function(req, res) {
    var { data, error } = await supabase
        .from("resenyas")
        .select("*")
        .eq("recurso", req.params.id)
        .order("id");

    if (error) throw error;
    res.status(200).json(data);
});

// Se conserva la ruta antigua; solo se puede utilizar si existe la tabla area.
app.post("/api/area_salud", async function(req, res) {
    var area = req.body;

    var { data, error } = await supabase
        .from("area")
        .insert({
            codigo_postal: area.codigo_postal,
            nombre: area.nombre
        })
        .select("id")
        .single();

    if (error) throw error;
    res.status(201).json(data.id);
});

// Express 5 envia aqui los errores lanzados por las rutas async.
app.use(function(error, req, res, next) {
    console.error("Error en el servicio REST:", error);

    if (res.headersSent) {
        next(error);
        return;
    }

    if (error.code === "23505") {
        res.status(409).json("Ya existe un registro con ese valor unico");
    } else if (error.code === "23503") {
        res.status(409).json("La operacion incumple una relacion entre tablas");
    } else if (error.code === "22P02" || error.type === "entity.parse.failed") {
        res.status(400).json("Los datos enviados no tienen un formato valido");
    } else {
        res.status(500).json("Error al realizar la operacion en la base de datos");
    }
});

var puerto = process.env.PORT || 3000;

app.listen(puerto, "0.0.0.0", function() {
    console.log("Servidor REST iniciado en el puerto " + puerto);
});
