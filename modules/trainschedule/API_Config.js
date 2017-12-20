/* Magic Mirror
 * Module: trainschedule
 * Config file with API Key
 *
 * By Tyvonne
 * Ermont : 87276055
 * Ermont : 87534131
 * Paris Saint-Lazare : 87384008
 * Saint-Ouen : 87271247
 * 
 * Basic call : "http://api.transilien.com/gare/87534131/depart"
 * Second call : "http://api.transilien.com/gare/87534131/depart/87384008"
 * Second call : "http://api.transilien.com/gare/87534131/depart/87271247"
 */


var config = {
    apiConfig: {
        APILogin: 'tnhtn518',
        APIKey: 'Xc5D33ce',
        stationFrom: '87534131',
        stationTo: '87384008'
    }
}

var req = new XMLHttpRequest();
var url = "http://api.transilien.com/gare/"+stationFrom+"/depart/"+stationTo;
// Requête HTTP GET synchrone vers le serveur SNCF
req.open("GET", url, false, config.apiConfig.APILogin, config.apiConfig.APIKey);
req.send(null);

// Affiche la réponse reçue pour la requête
console.log(req.responseText);