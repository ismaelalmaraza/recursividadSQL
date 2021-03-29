var express = require('express'),
middlewareAuth = require('../app/middleware'),
sql = require('../app/database');
const bcrypt = require('bcrypt');

var orgRoutes = function ()
  {

    var orgRouter = express.Router();

    orgRouter.use(middlewareAuth); //Require Token for all Routes on this Router
  
    /******************************************************************************************/
    /*    Obtiene un socio y realiza burqueda recursiva para obtener su árbol de asociados    */
    /******************************************************************************************/
    orgRouter.route('/:id_head').get(function(req,res) {

        let sqlparams = {
            IdSuscriber: {
              val: req.params.id_head,
              type: sql.Int
            }
        };

        strQuery = "DECLARE @pId_Suscriber int = @IdSuscriber " +
                  ";WITH cte_Network (Level,Id_Suscriber, Id_Parther,Promueve) AS ( " +
                    "SELECT  ROW_NUMBER() OVER (PARTITION BY e.id_frontal ORDER BY e.id_frontal) Level " +
                    "       ,e.id_suscriber as 'Id_Suscriber', e.id_frontal as 'Id_Parther', e.Promueve " +
                    "FROM SmartBD.dbo.Frontales AS e " +
                    "WHERE id_suscriber = @pId_Suscriber " +
                    "UNION ALL " +
                    "SELECT  d.Level+1 as 'Level' " +
                    "        , e.id_suscriber as 'Id_Suscriber', e.id_frontal  as 'Id_Parther', e.Promueve " +
                    "FROM SmartBD.dbo.Frontales AS e " +
                    "INNER JOIN cte_Network AS d ON e.id_suscriber = d.Id_Parther  " +
                    ") " +
                    "SELECT  A.Level,A.[from],A.[to], count(DISTINCT B.id_frontal) as Directos " +
                    "       ,C.NAME, C.LASTNAME, C.slastname, C.email, C.telephone,C.IDNIVEL as 'EsEMaster' " +
                    "       ,CASE WHEN D.ID_Asignado IS NOT NULL THEN 1 ELSE 0 END as 'EsAsignado' " +
                    "       ,CASE WHEN SUM(CASE WHEN type NOT LIKE 'M' THEN 1 ELSE 0 END) > 0 THEN 1 ELSE 0 END as 'ConInversion' " +
                    "       ,A.Promueve,D.Asigna_Fec as 'FechaAsignado' " +
                    "       ,C.FECNIVEL as 'FecEMaster' " +
                    "       ,MIN(CASE WHEN type LIKE 'M' THEN fec_contrat ELSE NULL END) as 'FechaContrato' " +
                    "       ,CASE WHEN Level = 0 THEN NULL " +
                    "	          WHEN Level > 0 AND D.ID_Asignado IS NOT NULL THEN 'Asignado' " +
                    "		      WHEN Level > 0 AND A.Promueve = 1 THEN 'Me promueve' " +
                    "		      WHEN Level = 1 THEN 'Afiliado Directo' " +
                    "		      ELSE 'Afiliado' " +
                    "        END as 'TipoSocio' " +
                    "FROM( " +
                    "SELECT 0 as Level , @pId_Suscriber 'from', @pId_Suscriber 'to', NULL as Promueve " +
                    "UNION ALL " +
                    "SELECT A.Level, A.Id_Suscriber 'from' , A.Id_Parther 'to', A.Promueve " +
                    "FROM cte_Network as A " +
                    ") as A " +
                    "LEFT JOIN SmartBD.dbo.Frontales as B ON (B.id_suscriber = A.[to]) " +
                    "JOIN SmartBD.dbo.users as C ON (C.IDSUSCRIBER = A.[to]) " +
                    "LEFT JOIN SmartBD.dbo.Asignados as D ON ( D.id_deposita = @pId_Suscriber AND D.ID_Asignado = A.[to]) " +
                    "LEFT JOIN SmartBD.dbo.Cuenta as E ON (E.Id_suscriber =  A.[to]) " +
                    "GROUP BY  A.Level,A.[from],A.[to],A.Promueve, C.NAME, C.LASTNAME, C.slastname, C.email, C.telephone,C.IDNIVEL " +
                    "          ,C.FECNIVEL ,D.ID_Asignado , D.Asigna_Fec " +
                    "ORDER BY Level ASC, Directos DESC,[from] ASC ";
            
      // console.log(strQuery)
          
        sql.execute({
            query: strQuery
            , params: sqlparams }
        ).then( function( results ) {
            if(results.length > 0) {
                res.status(200).json(results);

            } else {
                res.status(204).send("No organization Found");
            }              
            }, function( err ) {
                res.status(500).send("Something bad resquest");
                console.log( "Something bad happened:", err );
            });
    });

    /******************************************************************************************/
    /*                         Obtiene los detalles de un prospecto                           */
    /******************************************************************************************/
    orgRouter.get("/prospects/:idsuscriber", function (req, res) {
  
    
    let SQL = `SELECT ID,NAME,LASTNAME,SLASTNAME,EMAIL,COUNTRY_CODE,TELEPHONE,FECNIVEL 
    FROM users 
    WHERE SPONSOR = ${req.params.idsuscriber} AND ISPROSPECT=0 
    ORDER BY ID DESC`

    console.log(SQL);
    sql
      .execute({  query: SQL} )
      .then(
        function (results) {
            if(results.length > 0) {
                res.status(200).json(results);
            }
            else{
                res.status(204).send("No prospects Found");
            }
        },
        function (err) {
          res.status(500).send("Something bad resquest");
          console.log("Something bad happened:", err);
        }
      );
    });

    /******************************************************************************************/
    /*                         Obtiene los detalles de un suscriptor                          */
    /******************************************************************************************/
    orgRouter.get("/guest/:idsuscriber", function (req, res) {
  
            let sqlparams = {
                IdSuscriber: {
                  val: req.params.idsuscriber,
                  type: sql.BigInt
                }
            };
            
            let SQL = "SELECT id,nombre,email,id_suscriber,format( convert(datetime,fecha,101),'yyyy-MM-dd') as fecha FROM invitados Where id_suscriber = @IdSuscriber order by id desc";
            console.log(SQL);
            sql
              .execute({  query: SQL, params: sqlparams } )
              .then(
                function (results) {

                    if(results.length > 0){
                        res.status(200).json(results);
                    } else {
                        res.status(204).send("No Guest Found");
                    }        

                },
                function (err) {
                  res.status(500).send("Something bad resquest");
                  console.log("Something bad happened:", err);
                }
              );
    });

    /******************************************************************************************/
    /*                                 Crea un nuevo invitado                                 */
    /******************************************************************************************/
    orgRouter.post("/newGuest", function (req, res) {
    
            let sqlparams = {
                              Name: {
                                val: req.body.nombre,
                                type: sql.VarChar
                              },
                              Email: {
                                val: req.body.email,
                                type: sql.VarChar
                              },
                              IdSuscriber: {
                                val: req.body.id_suscriber,
                                type: sql.Int
                              }
                          };
        
            let sqlstr="INSERT INTO invitados (nombre, email, fecha,id_suscriber) " +
                      "values(@Name,@Email, format(getdate(),'yyyy-MM-dd HH:mm:ss.fff'),@IdSuscriber)" 
            console.log(sqlstr)
            sql.execute({  query: sqlstr,
                        params: sqlparams
                    })
            .then(function (results) {
                console.log(results);
                res.status(201).json({
                  success: true,
                  message: "Succefull.",
                });
              },
              function (err) {
                res.status(500).send("Something bad happened");  
                console.log("Something bad happened:", err);
              }
            ); 
    });

    /******************************************************************************************/
    /*                                 Crea un nuevo prospecto                                */
    /******************************************************************************************/
    orgRouter.post("/newPropect", function (req, res) {
            console.log(req.body)
            let hash = bcrypt.hashSync(req.body.password, 10);

            let sqlparams = {
                Email: {
                    val: req.body.email,
                    type: sql.VarChar
                  },
                Country: {
                    val: req.body.Pais,
                    type: sql.VarChar
                  },
                Hash: {
                    val: hash,
                    type: sql.VarChar
                  },
                  IdValidator: {
                    val: req.body.idValidator,
                    type: sql.VarChar
                  },
                  Sponsor: {
                    val: req.body.idSuscriberInv ,
                    type: sql.BigInt
                  },
            };

            
            let sqlstr =
              "INSERT INTO users(EMAIL,COUNTRY,STATE,REFERENCE,ISPROSPECT,ISEMAILVAL,LD001,IDEMAILVAL,SPONSOR,FECNIVEL) " +
              "VALUES(@email,@country,,0,0,0,0,@Hash,@IdValidator,@Sponsor,GETDATE());";
              
            sql.execute({query: sqlstr, 
                        params: sqlparams
                        })
              .then(
                function (results) {
                  console.log(results);
                  res.status(201).json({
                                        success: true,
                                        message: "Succefull.",
                                      });
                },
                function (err) {
                  console.log("Something bad happened:", err);
                }
              );
    });

    /******************************************************************************************/
    /*                                   Elimina un invitado                                  */
    /******************************************************************************************/
    orgRouter.delete("/deleteGuest"  , function (req, res) {
        let sqlparams = {
                          Id: {
                            val: req.body.id_head,
                            type: sql.BigInt
                          },
                          Idsuscriber: {
                            val: req.body.id_suscriber,
                            type: sql.BigInt
                          }
                        };

      let sqlstr="DELETE FROM invitados WHERE (Id= @Id AND id_suscriber = @Idsuscriber);" 
  
      sql.execute({  query: sqlstr,params: sqlparams })
        .then(function (results) {
                console.log(results);
                res.status(200).json({
                    success: true,
                    message: "Succefull.",
                  });
              },
              function (err) {
                res.status(500).send("Something bad happened");  
                console.log("Something bad happened:", err);
              }
            ); 
    });

    /******************************************************************************************/
    /*                                   Elimina un prospecto                                 */
    /******************************************************************************************/
    orgRouter.delete("/deleteProspect"  , function (req, res) {
      let sqlparams = {
        Id: {
          val: req.body.id_head,
          type: sql.BigInt
        },
        Idsuscriber: {
          val: req.body.id_suscriber,
          type: sql.BigInt
        }
      };
      
      let sqlstr="DELETE FROM users WHERE (Id= @Id AND SPONSOR =@IdSuscriber AND ISPROSPECT=0);" 
      console.log(sqlstr)
      
      sql.execute({ query: sqlstr,params: sqlparams })
        .then(function (results) {
              console.log(results);
              res.status(201).json({
                                    success: true,
                                    message: "Succefull.",
                                  });
          },
        function (err) {
              res.status(500).send("Something bad happened");  
              console.log("Something bad happened:", err);
          }
        ); 
    });

    return orgRouter;  
  }
module.exports = orgRoutes;
