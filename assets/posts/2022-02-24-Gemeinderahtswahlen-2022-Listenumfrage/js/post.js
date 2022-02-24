function createTable(frageNr, data) {
    let table = document.getElementById("table_" + frageNr);
    let head = document.createElement('tr');
    
    let th = document.createElement('th');
    head.appendChild(th);

    for (let i = 1; i < data.length; i++) {
        let th = document.createElement('th');
        th.innerText = data[i][1];
        head.appendChild(th);
    }
    table.appendChild(head);

    let line = document.createElement('tr');

    for (let i = 0; i < data.length; i++) {
        let td = document.createElement('td');
        td.innerText = data[i][frageNr+2];
        line.appendChild(td);
    }
    table.appendChild(line);
}



function getChartColors(){

    const colors =  ["#5dd52e", "#2ed573" ,"#2e8fd5", "#522ed5", "#a62ed5", "#d52eb1", "#0d5412e" ,"#d56b2e" ,"#d5952e"];

    return colors;
}

function createPieGraph(data, id, canvasName, description) {

    let pieData = [];
    for(let i = 1; i < data["data"].length; i++){
        pieData.push(data["data"][i][id]);
    }

    const pieDataDic = {};
    pieData.forEach(function (x) { pieDataDic[x] = (pieDataDic[x] || 0) + 1; });

    new Chart(document.getElementById(canvasName), {
        type: 'pie',
        data: {
          labels: Object.keys(pieDataDic),
          datasets: [{
            label: description,
            backgroundColor: getChartColors(),
            data: Object.values(pieDataDic),
          }]
        },
        options: {
          title: {
            display: true,
            text: description,
          }
        },
    });
}

function createGraph(data){
    createPieGraph(data, 2, "leistbaresWohnenChart", "Leistbares Wohnen für junge Erwachsene");
    createPieGraph(data, 4, "gemeindeVermieter", "Soll die Gemeinde als Vermieter auftreten?");
    createPieGraph(data, 7, "teureGuensiteWohnungen", "Wenn Wohnprojekte geplant sind, handelt es sich dann dabei um günstige oder teure Wohnungen?");
    createPieGraph(data, 9, "projekteJugendliche", "Projekte zugunsten Jugendlicher");
    createPieGraph(data, 11, "gemeindeKinder", "Soll die Gemeinde Kinderbetreuung organisieren bzw. finanzieren?");
    createPieGraph(data, 13, "kinderAnspruch", "Wenn Kinderbetreuung von der Gemeinde aus  geplant ist, wer soll darauf Anspruch haben?");
    createPieGraph(data, 16, "kinderKosten", "Wenn Kinderbetreuung von der Gemeinde aus  geplant ist, wie werden die Kosten gestaltet?");
    createPieGraph(data, 18, "ausbauOeffi", "Ausbau von öffentlichem Nahverkehr?");
    createPieGraph(data, 20, "anreizOeffi", 'Anreize  schaffen für "umweltfreundliche Mobilität"?');
    createPieGraph(data, 31, "transparenz", "Ist Transparenz wichtig?");
    createPieGraph(data, 33, "datenVeroeffentlichen", "Werden Protokolle, Beschlüsse und Daten prokativ veröffentlicht?");
    createPieGraph(data, 35, "digitalesGemeindeamt", "Ausbau Digitalisierung (digitales Gemeindeamt)?");
    createPieGraph(data, 37, "ausbauInternet5G", "Ausbau Internetinfrastruktur (Glasfaser, 5G)?");


    console.log(data);
}

function createOptionalInformation(data, id, divName) {
  for(let i = 1; i < data["data"].length; i++){
    let answer = data["data"][i][id];
    if (answer !== "") {
      let divElement = document.getElementById(divName);
      var tag = document.createElement("p");
      let text = document.createTextNode(data["data"][i][1] + ": " + answer);
      tag.appendChild(text);
      divElement.appendChild(tag);
    }
  }
}

function createAllOptionalInformation(data) {
  createOptionalInformation(data, 3, "leistbaresWohnenOptional");
  createOptionalInformation(data, 5, "gemeindeVermieterOptional");
  createOptionalInformation(data, 8, "teureGuensiteWohnungenOptional");
  createOptionalInformation(data, 10, "projekteJugendlicheOptional");
  createOptionalInformation(data, 12, "gemeindeKinderOptional");
  createOptionalInformation(data, 17, "kinderKostenOptional");
  createOptionalInformation(data, 19, "ausbauOeffiOptional");
  createOptionalInformation(data, 21, "anreizOeffiOptional");
  createOptionalInformation(data, 32, "transparenzOptional");
  createOptionalInformation(data, 34, "datenVeroeffentlichenOptional");
  createOptionalInformation(data, 36, "digitalesGemeindeamtOptional");
}


//setup chart
Chart.defaults.global.defaultFontColor = "#ffffff";
Chart.defaults.global.defaultFontFamily = "Courier New, monospace";
Chart.defaults.global.defaultFontSize = 16;

Papa.parse("/assets/posts/2022-02-24-Gemeinderahtswahlen-2022-Listenumfrage/csv/umfrage.csv", {
	download: true,
    complete: function(results) {
        createTable(0, results.data);
		createGraph(results);
    createAllOptionalInformation(results);
	}
    }
);
/*

const labels = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
];

const data = {
    labels: labels,
    datasets: [{
        label: 'My First dataset',
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgb(255, 99, 132)',
        data: [0, 10, 5, 2, 20, 30, 45],
    }]
};

const config = {
    type: 'line',
    data: data,
    options: {}
};

const myChart = new Chart(
    document.getElementById('chart'),
    config
  );
  */
