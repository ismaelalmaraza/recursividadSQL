var sql = require('seriate');


/********************************************************************** */
/*                    Configuración de Base de Datos                    */
/********************************************************************** */
var connectDatabase = function(){
    var dbConnect = {  
        "server": "300.000.000.000",
        "user": "usuario_de_base_de_datos",
        "password": "password",
        "database": "nombre_de_base_de_datos"
    };

    sql.setDefaultConfig( dbConnect );
    return sql;
}

module.exports = connectDatabase();