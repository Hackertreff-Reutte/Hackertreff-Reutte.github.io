function createTable(frageNr, data, possibleAnswers) {
  let table = document.getElementById("table_" + frageNr);

  let head = document.createElement('tr');
  let th = document.createElement('th');
  head.appendChild(th);
  for (let i = 0; i < possibleAnswers.length; i++) {
    let th = document.createElement('th');
    th.innerText = possibleAnswers[i];
    head.appendChild(th);
  }
  table.appendChild(head);

  for (let i = 1; i < data.length; i++) {// loop through partys
    let line = document.createElement('tr');
    let th = document.createElement('th');
    th.innerText = data[i][1];
    line.appendChild(th);

    for (let j = 0; j < possibleAnswers.length; j++) { // loop through answers
      let td = document.createElement('td');
      td.innerText = data[i][frageNr] == possibleAnswers[j] ? "X" : "";
      line.appendChild(td);
    }
    table.appendChild(line);
  }
}

function getChartColors() {

  const colors = ["#5dd52e", "#2ed573", "#2e8fd5", "#522ed5", "#a62ed5", "#d52eb1", "#0d5412e", "#d56b2e", "#d5952e"];

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
            display: false,
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
Chart.defaults.color = "#ddd";
Chart.defaults.font.family = "Courier New, monospace";
Chart.defaults.font.size = 15;


let possibleAnswers = [
  [
    "Gegen Umsetzung",
    "Nicht geplant",
    "Unschlüssig",
    "Geplant",
    "Priorisierte Umsetzung",

  ],
  [
    "Nein auf keinem Fall",
    "Nein",
    "Unschlüssig",
    "Ja",
    "Ja sehr wichtig",
  ],
  [
    "Nein - Gemeinde ist alleiniger Bauträger",
    "Ja - zusätzliche Staatliche Bauträger",
    "Ja - zusätzliche Private Bauträge",
  ],
  [
    "Keine Projekte geplannt",
    "Eher teure Wohnungen (>70% der neu gebauten Wohnungen sind teurer)",
    "Fast nur teure Wohnungen (> 85% der neu gebauten Wohnungen sind teurer)",
    "Eher günstige Wohnungen (> 70% der neu gebauten Wohnungen sind günstiger)",
    "Fast nur günstige Wohnungen (> 85% der neu gebauten Wohnungen sind günstiger)",
    "Ausgeglichen (ca. 50% - 50% günstige und teure Wohnungen)",
  ],
  [
    "Gegen Umsetzung",
    "Nicht geplant",
    "Unschlüssig",
    "Geplant",
    "Priorisierte Umsetzung",
  ],
  [
    "Nein - vorhandenes soll reduziert",
    "werden",
    "Nicht geplant",
    "Unschlüssig",
    "Geplant",
    "Ja - existierendes Angebot soll",
    "ausgebaut werden",
  ],
  [
    "Alle haben Anspruch auf die",
    "Kinderbetreuung",
    "Nur Bedürftige haben Anspruch auf die",
    "Kinderbetreuung (z.B.: Alleinerziehende)",
    "Nur Gemeinde Angestellte haben",
    "Anspruch auf die Kinderbetreuung",
    "Keine Meinung",
  ],
  [
    "0-3 Ganztagsbetreuung",
    "0-3 nur Vormittagsbetreuung",
    "3-6 Ganztagsbetreuung",
    "3-6 nur Vormittagsbetreuung",
    "6-10 Nachmittagsbetreuung",
    "10-14 Nachmittagsbetreuung",
    "Keine",
  ], [
    "0-3",
    "0-3",
    "3-6",
    "3-6",
    "6-10",
    "10-14",
    "Keine",
  ], [
    "Die Betreuung ist kostenlos",
    "Die Betreuung wird finanziell unterstützt > 50 %",
    "Die Betreuung wird finanziell unterstützt < 50 %",
    "Die Betreuung wird nicht finanziell unterstützt",
    "Dieses gilt es mit den Zuständigen abzuklären, eine Bedarfserhebung ist hier der essenzielle Grundstein",
    "Geringe Kindergartenbeiträge",
  ],
  [
    "Gegen Umsetzung",
    "Nicht geplant",
    "Unschlüssig",
    "Geplant",
    "Priorisierte Umsetzung",
  ],
  [
    "Gegen Umsetzung",
    "Nicht geplant",
    "Unschlüssig",
    "Geplant",
    "Priorisierte Umsetzung",
  ],
  [
    "Keine",
    "Geringe",
    "Durchschnittliche",
    "Spezielle Förderung",
  ],
  [
    "Unwichtig",
    "Unschlüssig",
    "Wichtig",
    "Sehr wichtig",
  ],
  [
    "Nein",
    "Nicht geplant",
    "Unschlüssig",
    "Geplant - aber nur auf Nachfrage",
    "Geplant - proaktive auf z.B. Webseite",
  ],
  [
    "Gegen Umsetzung",
    "Nicht geplant",
    "Unschlüssig",
    "Geplant",
    "Priorisierte Umsetzung",
  ],
  [
    "Gegen Umsetzung",
    "Nicht geplant",
    "Unschlüssig",
    "Geplant",
    "Priorisierte Umsetzung",
  ],
  [
    "Privatfinanzierung",
    "Partei-Gelder",
    "Spenden",
    "Viel ehrenamtlicher",
    "Arbeitseinsatz",
  ]


]

function createTables(data) {
  createTable(2, data, possibleAnswers[0]);
  createTable(4, data, possibleAnswers[1]);
  createTable(7, data, possibleAnswers[2]);
  createTable(9, data, possibleAnswers[3]);
  createTable(11, data, possibleAnswers[4]);
  createTable(13, data, possibleAnswers[5]);
  createTable(16, data, possibleAnswers[6]);
  createTable(18, data, possibleAnswers[7]);
  createTable(20, data, possibleAnswers[8]);
  createTable(31, data, possibleAnswers[9]);
  createTable(33, data, possibleAnswers[10]);
  createTable(35, data, possibleAnswers[11]);
  createTable(37, data, possibleAnswers[12]);
}

Papa.parse("/assets/posts/2022-02-24-Gemeinderahtswahlen-2022-Listenumfrage/csv/umfrage.csv", {
	download: true,
  complete: function(results) {
    createTables(results.data);
		createGraph(results);
    createAllOptionalInformation(results);
	}
});
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
