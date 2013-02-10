var map;
var layer;
var tableId = '1rgZDIBtzhMZgBqzVwRMOvjs3RbeK2HE74bY9ivY';
var tableIdHeatmap = '1mYQYgSuc3D8RZeklmSLOB2XcOhlETwXqcXXv1DA';
var locationColumn = 'geo_adresse';	  
var apiKey = "AIzaSyBs-9DEpRuxKFYrlbp7VnlTTK1MikDopBU";		
var geocoder = new google.maps.Geocoder();
var germanyBerlin = new google.maps.LatLng(52.524577,13.393501);
var queries = new Array();
var homeIcon = 'img/home.png';

$(function() {
	$( "#date" ).datepicker();
});

//Drop Downs initial aus Fusion Table befüllen
request();

function initialize() {	

	map = new google.maps.Map(document.getElementById('map-canvas'), {
		center: germanyBerlin,
		zoom: 9,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	});
		
	layer = new google.maps.FusionTablesLayer({
		query: {
			select: locationColumn,
			from: tableId
		},					
		map: map
	});
	
	//KML-Daten für Bezriksgrenznen
	layerPolyDescrict = new google.maps.FusionTablesLayer({
		query: {
			select: 'geometry',
			from: tableIdHeatmap
		},
		styles: [{
			polygonOptions: {
				fillColor: "#b10303",
				fillOpacity: 0.00001,
				strokeColor: "#b10303",
				strokeWeight: 1.5,
				strokeOpacity: 0.3,
				zIndex:0
			}
		}]	
	});
										
	//Datum 
	google.maps.event.addDomListener(document.getElementById('dateButton'), 'click', function() {
		updateMap(layer, tableId, locationColumn,"date");
	});				
	
	//Bezirk
	google.maps.event.addDomListener(document.getElementById('destrict'),'change', function() {
		updateMap(layer, tableId, locationColumn,"destrict");
	});

	//Marktsortiment
	google.maps.event.addDomListener(document.getElementById('sortiment'), 'change', function() {
		updateMap(layer, tableId, locationColumn,"sortiment");
	});

	//Checkbox Fahrgeschäfte
	google.maps.event.addDomListener(document.getElementById('stage_technology'), 'change', function() {
		updateMap(layer, tableId, locationColumn,"stage_technology");
	});
	
	//Checkbox freier Eintritt
	google.maps.event.addDomListener(document.getElementById('free_entry'), 'change', function() {
		updateMap(layer, tableId, locationColumn,"free_entry");
	});		

	//Auswertung 
	google.maps.event.addDomListener(document.getElementById('evaluation'),'change', function() {
		updateMapLayer("evaluation");
	});
	
}

// Layer für Statistik erzeugen
function createLayer(layer){
	switch(layer){			
		case "countMarketsDestrict":	
			//Anzeige der Statistik Anzahl Weihnachtsmaerkte					
			dynLayer = new google.maps.FusionTablesLayer({
				query: {
					select: 'geometry',
					from: tableIdHeatmap
				},			
				styleId: 2,
				templateId: 2
			});
			break;	
		case "averageWinePrice":
			//Anzeige der Statistik durchschnittlicher Glühweinpreis
			dynLayer = new google.maps.FusionTablesLayer({
				query: {
					select: 'geometry',
					from: tableIdHeatmap
				},			
				styleId: 5,
				templateId: 6
			});
			break;	
	}
	return dynLayer;
}		

// Weihnachtsmärke ein/ausblenden
function toggle_markets() {
	if(layer.map) {
		layer.setMap(null);
	} else  {
		layer.setMap(map);	  
	}
}

// Bezirksgrenzen ein/ausblenden
function toggle_descrictPolygon() {
	if(layerPolyDescrict.map) {
		layerPolyDescrict.setMap(null);
	} else  {
		layerPolyDescrict.setMap(map);	  								
		//Marker über Layer anzeigen
		if(layer.map) {
			layer.setMap(map);
		}			
	}
}		
		
/* 	Zusammenbau der einzelnen Where-Statements, zu einem SQL Query, um verschiedene Filter zu kombinieren */
function getWhereStatements(){		
	var out = "";	
	var j=0;
	for (var i in queries)
	{
		//debug
		console.log('queries[\''+i+'\'] is ' + queries[i] + " Länge: " + queries[i].length + "Zahl: "+j);
		//mehr als ein element und vorhandener query
		out+= (queries[i].length == 0 || j==0 ? "" : " AND ") + queries[i];			
		//zählen für AND-Kostrukt
		j++
	}
	//Im Fehlerfall das erste AND abschneiden
	if(out.substring(0, 5)== " AND "){
		out = out.replace(' AND ','');
	}
	//Debug
	console.log("QUERY:" + out);
	return out;
}

/* nach Selektion eines Filters erfolgt hier die Fusion-Table-Abfrage und Darstellung*/
function updateMap(layer, tableId, locationColumn, element) {
	var value = document.getElementById(element).value;			
	if (value) {					
			switch(element){
				case "date":		
					var whereStatment = (value=="" ? "" : "von <= '" + value + "' AND bis >= '" + value + "'");						
					queries["date"] = whereStatment;													
					layer.setOptions({						
						query: {
							select: locationColumn,
							from: tableId,
							where: getWhereStatements()
						}
					});			
					break;					
				case "destrict":		
					var whereStatment = (value=="all" ? "" : "bezirk = '" + value + "'");						
					queries["destrict"] = whereStatment;						
					layer.setOptions({						
						query: {
							select: locationColumn,
							from: tableId,
							where: getWhereStatements()
						}
					});									
					break;
				case "sortiment":	
					var whereStatment = (value=="all" ? "" : "sortiment = '" + value + "'");
					queries["sortiment"] = whereStatment;		
					layer.setOptions({	
						query: {
							select: locationColumn,
							from: tableId,
							where: getWhereStatements()
						}
					});	
					break;		
				case "stage_technology":		
					tmp = (document.getElementById(element).checked == true ? 1 : 0);	
					//deaktiviert heißt alle mit oder ohne Fahrgeschäft
					var	whereStatment = (tmp == 0 ? "" : "fahrgeschaefte = '" + tmp + "'");
					
					queries["stage_technology"] = whereStatment;
					layer.setOptions({						
						query: {
							select: locationColumn,
							from: tableId,
							where: getWhereStatements()
						}	
					});																	
					break;									
				case "free_entry":		
					tmp = (document.getElementById(element).checked == true ? 0 : 1);	
					//deaktiviert heißt alle mit oder ohne Eintrittspreis
					var	whereStatment = (tmp == 1 ? "" : "eintrittspreis = '" + tmp + "'");
					
					queries["free_entry"] = whereStatment;
					layer.setOptions({						
						query: {
							select: locationColumn,
							from: tableId,
							where: getWhereStatements()
						}	
					});																	
					break;	
				default:
					layer.setOptions({		
						query: {
							select: locationColumn,
							from: tableId
						}
					});	
				}					
	} else {
		// notwendig für "Alle anzeigen"
		layer.setOptions({	
			query: {
				select: locationColumn,
				from: tableId
			}
		});	
	}	
}
// Darstellung der Heat-Maps
function updateMapLayer(element) {
	var value = document.getElementById(element).value;			
	console.log('updateMapLayer(element)' + value);		
	clearMaps();
	switch(value){			
		case "countMarketsDestrict":
			layer.setMap(null);
			layerEvaluationCountDestricts = createLayer("countMarketsDestrict");
			layerEvaluationCountDestricts.setMap(map);	
			//Text für Legende
			addLegend("Anzahl der Berliner Weihnachtsm&auml;rkte je Bezirk");
			break;	
		case "averageWinePrice":				
			layer.setMap(null);
			layerEvaluationAvarageWinePrice = createLayer("averageWinePrice");
			layerEvaluationAvarageWinePrice.setMap(map);
			//Text für Legende
			addLegend("Durschnittlicher Gl&uuml;hweinpreis je Bezirk");
			break;
		default:
			//Ausblenden der legenden
			$('#legend').remove();
			layer.setMap(map);				
	}								
}

//Statistiklegenden adden
function addLegend(text){
	$('#legend').remove();
	var legend = document.createElement('div');
	legend.id = 'legend';
	var content = [];
	content.push('<p><b>' + text + '</b></p>');
	legend.innerHTML = content.join('');
	legend.index = 1;
	map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(legend)	
}

//Alle Layer ausblenden, sofern sie gesetzt sind.
function clearMaps(){
	(typeof layerPolyDescrict!="undefined") ? layerPolyDescrict.setMap(null) : "";
	(typeof layerEvaluationCountDestricts!="undefined") ? layerEvaluationCountDestricts.setMap(null) : "";
	(typeof layerEvaluationAvarageWinePrice!="undefined") ? layerEvaluationAvarageWinePrice.setMap(null) : "";
}

// REST-Anfrage, Query für initiales Laden
function request(){

	var listDestrictsQuery = "SELECT bezirk FROM " + tableId + " GROUP BY bezirk";
		$.get('https://www.googleapis.com/fusiontables/v1/query?sql=' + listDestrictsQuery + '&key=' + apiKey, function(data) {
		//Bezirke Drop-Down
		for (var i in data['rows'])	{
			$('#destrict').append('<option>' + data['rows'][i] + '</option>');
			//console.log('data[\''+i+'\'] is ' + data['rows'][i]);
		}	
	}, "json");	

	var listSortimentQuery = "SELECT sortiment FROM " + tableId + " GROUP BY sortiment";
		$.get('https://www.googleapis.com/fusiontables/v1/query?sql=' + listSortimentQuery + '&key=' + apiKey, function(data) {
		//Marktsortiment Drop-Down
		for (var i in data['rows']){
			$('#sortiment').append('<option>' + data['rows'][i] + '</option>');
		}	
	}, "json");					
}	  

// Adressen-Zoom
function zoomtoaddress() {
	geocoder.geocode(
		{'address': document.getElementById("address").value + ' .' + 'berlin' }, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				map.setCenter(results[0].geometry.location);
				map.setZoom(15);
				var marker = new google.maps.Marker({
					position: results[0].geometry.location,
					map: map,
					icon: homeIcon					    
				});  			  
			} 
		}
	);
}

google.maps.event.addDomListener(window, 'load', initialize);