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
      td.innerText = data[i][frageNr].includes(possibleAnswers[j]) ? "X" : "";
      line.appendChild(td);
    }
    table.appendChild(line);
  }
}

function getChartColors() {

  const colors = ["#5dd52e", "#2ed573", "#2e8fd5", "#522ed5", "#a62ed5", "#d52eb1", "#0d5412e", "#d56b2e", "#d5952e"];

  for(let i = 0; i < colors.length; i++){
    colors[i] += "77";
  }

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
          },
          plugins: {
            htmlLegend: {
              // ID of the container to put the legend in
              containerID: 'legend-container' + "-" + id,
            },
            legend: {
              display: false,
            }
          },
        },
        plugins: [htmlLegendPlugin],
    });
}


function createRadarGraph(data){

  const dataLabels = []
  for(let i = 22; i < 30; i++){
    let temp = data["data"][0][i].substr(data["data"][0][i].indexOf('[') + 1);
    dataLabels.push(temp.substr(0, temp.indexOf(']')));
  }

  const dataSets = [];

  for(let j = 1; j < data["data"].length; j++){

    const listData = [];

    for(let i = 22; i < 30; i++){
      let temp = data["data"][j][i];
      switch(temp){
      case "Keine":
        listData.push(0);
        break;
      case "Geringe":
        listData.push(1);
        break;
      case "Durchschnittliche":
        listData.push(2);
        break;
      case "Spezielle Förderung":
        listData.push(3);
        break;
      }
    }

    let set = {
      label: data["data"][j][1],
      backgroundColor: getChartColors()[j],
      data: listData
    };

    dataSets.push(set);
  }

  console.log(dataLabels)

  new Chart(document.getElementById("vereine"), {
    type: 'radar',
    data: {
      labels: dataLabels,
      datasets: dataSets
    },
    options: {
      scales: {
        r: {
            angleLines: {
                display: true,
                color: "#888"
            },
            grid: {
              color: "#888"
            },
            ticks: {
              display: false,
              stepSize: 1
            },
            suggestedMin: 0,
            suggestedMax: 3
        }
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


    createRadarGraph(data);

    console.log(data);
}

function createOptionalInformation(data, id, divName) {
  for(let i = 1; i < data["data"].length; i++){
    let answer = data["data"][i][id];
    if (answer !== "") {
      let divElement = document.getElementById(divName);

      var tag1 = document.createElement("span");
      var tag2 = document.createElement("span");
      let text1 = document.createTextNode(data["data"][i][1] + ": ");
      let text2 = document.createTextNode(answer);
      tag1.appendChild(text1);
      tag2.appendChild(text2);
      tag1.style.color = "#2ed573";
      var par = document.createElement("p");
      par.appendChild(tag1);
      par.appendChild(tag2);
      divElement.appendChild(par);
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
    "Ja - zusätzliche Private Bauträger",
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
  ],
  [
    "0-3",
    "0-3",
    "3-6",
    "3-6",
    "6-10",
    "10-14",
    "Keine",
  ], [
    "Die Betreuung ist kostenlos",
    "Die Betreuung wird finanziell unterstützt > 50%",
    "Die Betreuung wird finanziell unterstützt < 50%",
    "Die Betreuung wird nicht finanziell unterstützt",
    "Dieses gilt es mit den Zuständigen abzuklären, eine Bedarfserhebung ist hier der essenzielle Grundstein.",
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
  /* [
    "Keine",
    "Geringe",
    "Durchschnittliche",
    "Spezielle Förderung",
  ], */
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
  createTable(6, data, possibleAnswers[2]);
  createTable(7, data, possibleAnswers[3]);
  createTable(9, data, possibleAnswers[4]);
  createTable(11, data, possibleAnswers[5]);
  createTable(13, data, possibleAnswers[6]);
  createTable(14, data, possibleAnswers[7]);
  createTable(15, data, possibleAnswers[8]);
  createTable(16, data, possibleAnswers[9]);
  createTable(18, data, possibleAnswers[10]);
  createTable(20, data, possibleAnswers[11]);
  createTable(31, data, possibleAnswers[12]);
  createTable(33, data, possibleAnswers[13]);
  createTable(35, data, possibleAnswers[14]);
  createTable(37, data, possibleAnswers[15]);
}

Papa.parse("/assets/posts/2022-02-24-Gemeinderahtswahlen-2022-Listenumfrage/csv/umfrage.csv", {
	download: true,
  complete: function(results) {
    createTables(results.data);
		createGraph(results);
    createAllOptionalInformation(results);
	}
});

const getOrCreateLegendList = (chart, id) => {
  const legendContainer = document.getElementById(id);
  let listContainer = legendContainer.querySelector('ul');

  if (!listContainer) {
    listContainer = document.createElement('ul');
    listContainer.style.display = 'flex';
    listContainer.style.flexDirection = 'row';
    listContainer.style.margin = 0;
    listContainer.style.padding = 0;

    legendContainer.appendChild(listContainer);
  }

  return listContainer;
};

const htmlLegendPlugin = {
  id: 'htmlLegend',
  afterUpdate(chart, args, options) {
    const ul = getOrCreateLegendList(chart, options.containerID);

    // Remove old legend items
    while (ul.firstChild) {
      ul.firstChild.remove();
    }

    // Reuse the built-in legendItems generator
    const items = chart.options.plugins.legend.labels.generateLabels(chart);

    items.forEach(item => {
      const li = document.createElement('li');
      li.style.alignItems = 'center';
      li.style.cursor = 'pointer';
      li.style.display = 'flex';
      li.style.flexDirection = 'row';
      li.style.marginLeft = '10px';

      li.onclick = () => {
        const {type} = chart.config;
        if (type === 'pie' || type === 'doughnut') {
          // Pie and doughnut charts only have a single dataset and visibility is per item
          chart.toggleDataVisibility(item.index);
        } else {
          chart.setDatasetVisibility(item.datasetIndex, !chart.isDatasetVisible(item.datasetIndex));
        }
        chart.update();
      };

      // Color box
      const boxSpan = document.createElement('span');
      boxSpan.style.background = item.fillStyle;
      boxSpan.style.borderColor = item.strokeStyle;
      boxSpan.style.borderWidth = item.lineWidth + 'px';
      boxSpan.style.display = 'inline-block';
      boxSpan.style.height = '20px';
      boxSpan.style.marginRight = '10px';
      boxSpan.style.width = '20px';

      // Text
      const textContainer = document.createElement('p');
      textContainer.style.color = item.fontColor;
      textContainer.style.margin = 0;
      textContainer.style.padding = 0;
      textContainer.style.textDecoration = item.hidden ? 'line-through' : '';

      const text = document.createTextNode(item.text);
      textContainer.appendChild(text);

      li.appendChild(boxSpan);
      li.appendChild(textContainer);
      ul.appendChild(li);
    });
  }
};
