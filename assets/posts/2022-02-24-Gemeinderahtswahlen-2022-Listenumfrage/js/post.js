
function pieLeistbaresWohnen(data) {

    let pieData = [];
    for(let i = 1; i < data["data"].length; i++){
        pieData.push(data["data"][i][2]);
    }

    const pieDataDic = {};
    pieData.forEach(function (x) { pieDataDic[x] = (pieDataDic[x] || 0) + 1; });

    new Chart(document.getElementById("leistbaresWohnenChart"), {
        type: 'pie',
        data: {
          labels: Object.keys(pieDataDic),
          datasets: [{
            label: "Leistbares Wohnen für junge Erwachsene",
            backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f","#e8c3b9","#c45850"], //TODO change this
            data: Object.values(pieDataDic),
          }]
        },
        options: {
          title: {
            display: true,
            text: 'Leistbares Wohnen für junge Erwachsene'
          }
        }
    });
}


function pieGemeindeVermieter(data) {

    let pieData = [];
    for(let i = 1; i < data["data"].length; i++){
        pieData.push(data["data"][i][4]);
    }

    const pieDataDic = {};
    pieData.forEach(function (x) { pieDataDic[x] = (pieDataDic[x] || 0) + 1; });

    new Chart(document.getElementById("gemeindeVermieter"), {
        type: 'pie',
        data: {
          labels: Object.keys(pieDataDic),
          datasets: [{
            label: "Soll die Gemeinde als Vermieter auftreten?",
            backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f","#e8c3b9","#c45850"], //TODO change this
            data: Object.values(pieDataDic),
          }]
        },
        options: {
          title: {
            display: true,
            text: 'Soll die Gemeinde als Vermieter auftreten?'
          }
        }
    });
}


function pieBautraegerWohnprojekte(data) {

    let pieData = [];
    for(let i = 1; i < data["data"].length; i++){
        pieData.push(data["data"][i][6]);
    }

    const pieDataDic = {};
    pieData.forEach(function (x) { pieDataDic[x] = (pieDataDic[x] || 0) + 1; });

    new Chart(document.getElementById("bautraegerWohnprojekte"), {
        type: 'pie',
        data: {
          labels: Object.keys(pieDataDic),
          datasets: [{
            label: "Wenn Wohnprojekte geplant sind, gibt es zusätzliche Bauträger?",
            backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f","#e8c3b9","#c45850"], //TODO change this
            data: Object.values(pieDataDic),
          }]
        },
        options: {
          title: {
            display: true,
            text: 'Wenn Wohnprojekte geplant sind, gibt es zusätzliche Bauträger?'
          }
        }
    });
}

function createGraph(data){
    pieLeistbaresWohnen(data);
    pieGemeindeVermieter(data);
    pieBautraegerWohnprojekte(data);
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
