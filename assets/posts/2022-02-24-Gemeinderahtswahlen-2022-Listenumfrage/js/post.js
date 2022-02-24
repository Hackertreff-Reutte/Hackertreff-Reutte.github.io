
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
            backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f","#e8c3b9","#c45850"], //TODO change this
            data: Object.values(pieDataDic),
          }]
        },
        options: {
          title: {
            display: true,
            text: description
          }
        }
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


Papa.parse("/assets/posts/2022-02-24-Gemeinderahtswahlen-2022-Listenumfrage/csv/umfrage.csv", {
	download: true,
    complete: function(results) {
		createGraph(results);
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
