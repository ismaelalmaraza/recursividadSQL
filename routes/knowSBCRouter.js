var express = require('express'),
middlewareAuth = require('../app/middleware'),
sql = require('../app/database');

var knowRoutes = function() {
    var knowRoutes = express.Router();
    knowRoutes.use(middlewareAuth); //Require Token for all Routes on this Router

    /******************************************************************************************/
    /*        Obtiene los documentos de (PDF; IMG; YOUTUBE) de una sección y el idioma        */
    /******************************************************************************************/
    knowRoutes.get("/:identifier/:lang", function (req, res) {
    
        let sqlparams = {
            Identifier: {
              val: req.params.identifier,
              type: sql.VarChar
            },
            lang: {
                val: req.params.lang,
                type: sql.VarChar
              }
        };
        
        strSql = "DECLARE   @pidentificador varchar(100) =  @Identifier                            " +
                "        , @pidioma varchar(10) = @lang                                            " +
                ";WITH Elementos_cte( Id,Id_Padre,Titulo,Posicion,Categoria,Seccion,Codigo ) AS    " +
                "(                                                                                 " +
                "    SELECT A.Id,A.Id_Padre,A.Titulo,A.Posicion,A.Categoria,A.Seccion,A.Codigo     " +
                "    FROM SmartBD.dbo.Admon_Elementos as A                                         " +
                "    WHERE A.Codigo = @pidentificador                                              " +
                "    UNION ALL                                                                     " +
                "    SELECT B.Id,B.Id_Padre,B.Titulo,B.Posicion,B.Categoria,B.Seccion,B.Codigo     " +
                "    FROM SmartBD.dbo.Admon_Elementos as B                                         " +
                "    INNER JOIN Elementos_cte as C ON (C.Id = B.Id_Padre )                         " +
                ")                                                                                 " +
                "SELECT P.Id,P.Titulo,P.Posicion,ImgPath,ToolTip,Url,UrlType,TituloUrl             " +
                "FROM (                                                                            " +
                "   SELECT B.Id_Idioma,A.Id,A.Id_Padre,A.Titulo,A.Posicion,A.Codigo,B.Clave,B.Valor" +
                "   FROM Elementos_cte as A                                                        " +
                "   LEFT JOIN SmartBD.dbo.Admon_Contenido as B ON (B.Id_Elemento = A.Id)           " +
                ") as C                                                                            " +
                "PIVOT (                                                                           " +
                "max (valor) FOR Clave IN (ImgPath,ToolTip,Url,UrlType,TituloUrl)                  " +
                ") as P                                                                            " +
                "LEFT JOIN SmartBD.dbo.Admon_Elementos as D ON (P.Id_Padre = D.Id)                 " +
                "WHERE P.Id_Idioma = @pidioma                                                      " +
                "ORDER BY P.Id_Padre, P.Posicion;                                                  ";

        sql.execute({  query: strSql, params: sqlparams } )
          .then(
            function (results) {
                if(results.length > 0) {
                    res.status(200).json(results);
                }
                else{
                    res.status(204).send("No data Found");
                }
            },
            function (err) {
              res.status(500).send("Something bad resquest");
              console.log("Something bad happened:", err);
            }
          );
    });
  
    return knowRoutes;  
  }
  module.exports = knowRoutes;