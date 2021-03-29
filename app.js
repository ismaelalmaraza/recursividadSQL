var express = require('express'),
    bodyParser = require('body-parser'),
    appRootDir = require('app-root-dir').get(),
    path = require('path');
var https = require('https');
var http = require('http');
var fs = require('fs');
var cors = require("cors");
var app = express();

/******************************************************************************************/
/*                                Configuración de seguridad HTTP                         */
/******************************************************************************************/
var privateKey  = fs.readFileSync('privkey.key', 'utf8');
var certificate = fs.readFileSync('certificado.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};


/******************************************************************************************/
/*                                Configuración de cabeceros y CORS                       */
/******************************************************************************************/
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});
app.use(cors());

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

/******************************************************************************************/
/*                                    Configuración de rutas                              */
/******************************************************************************************/
orgRouter = require("./routes/organizationRouter")();
knowRouter = require("./routes/knowSBCRouter")();
app.use("/api/organization", orgRouter);
app.use("/api/knowSBC", knowRouter);


/******************************************************************************************/
/*                              Configuración de acceso http y https                      */
/******************************************************************************************/
//var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);
//httpServer.listen(PORT);
httpsServer.listen(6000);