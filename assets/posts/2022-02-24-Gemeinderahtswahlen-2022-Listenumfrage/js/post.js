
function pie_leistbares_wohnen(data) {


    let pie_data = [];
    for(let i = 1; i < data["data"].length; i++){
        pie_data.push(data["data"][i][2]);
    }

    const pie_data_dic = {};
    pie_data.forEach(function (x) { pie_data_dic[x] = (pie_data_dic[x] || 0) + 1; });

    new Chart(document.getElementById("leistbares_wohnen_chart"), {
        type: 'pie',
        data: {
          labels: Object.keys(pie_data_dic),
          datasets: [{
            label: "Leistbares Wohnen für junge Erwachsene",
            backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f","#e8c3b9","#c45850"],
            data: Object.values(pie_data_dic),
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

function create_graph(data){
    pie_leistbares_wohnen(data);
    console.log(data);
}


Papa.parse("/assets/posts/2022-02-24-Gemeinderahtswahlen-2022-Listenumfrage/csv/umfrage.csv", {
	download: true,
    complete: function(results) {
		create_graph(results);
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
