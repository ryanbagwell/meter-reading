import firebase from 'firebase';
import Backbone from 'backbone';
import backbonefire from 'backbonefire';
import React from 'react';
import ReactDOM from 'react-dom';
import {Chart} from 'react-d3-core';
import {LineChart} from 'react-d3-basic';
import moment from 'moment';



var config = {
  apiKey: 'AIzaSyDm4pY8-iMZt5WuSzVHH1TZJogQxI48xJI',
  databaseURL: 'https://glaring-fire-6854.firebaseio.com',
};

firebase.initializeApp(config);

//const readings = [];


class ConsumptionChart extends React.Component {

  static propTypes = {
    data: React.PropTypes.array,
  }

  render() {

    let chartSeries = [
      {
        field: 'consumption',
        name: 'Consumption',
        color: 'blue',
      }
    ]

    let width = 800,
      height = 500,
      margins = {left: 100, right: 100, top: 50, bottom: 50};

    let xRange = [0, width - margins.left - margins.right];

    let x = function(d) {

      let t = moment.unix(d.timeStamp);
      console.log(t.format("H"));
      return t.format('H');
      return t.format("M/D H:mm:ss");
    }

    return (<LineChart margins={margins}
                         data={this.props.data}
                         width={width}
                         height={height}
                         chartSeries={chartSeries}
                         x={x}

                       //xRange={xRange}


                       //yRange={this.props.yRange}
                        //yScale="linear"
                        //yLabel="Reading"
                        //xLabel="Time"
                        />);


  }


}


function byHour(snapshot) {

  let readings = snapshot.val();

  let keys = Object.keys(snapshot.val());

  let hoursObj = keys.reduce((hours, currentKey, i, arr ) => {

    let data = readings[currentKey];

    let t = moment.unix(data.timeStamp);

    let hourStr = t.format('YYYY-MM-DD:HH');

    if (!hours.hasOwnProperty(hourStr)) {
      hours[hourStr] = [];
    }

    hours[hourStr].push(data);

    return hours;

  }, {});


  let hoursArr = Object.keys(hoursObj).map((key, i, arr ) => {

    let readings = hoursObj[key];

    let first = readings[0];

    let last = readings[readings.length - 1];

    first.consumption = last.consumption - first.consumption;

    return first;

  }, []);

  return hoursArr;

}




firebase.database().ref('readings/1541531110').limitToLast(500).orderByChild('timeStamp').on('value', function(snapshot) {

  let data = byHour(snapshot);

  console.log(data);

  //let readings = snapshot.val();

  // readings = Object.keys(snapshot.val()).map((key) => {
  //   return readings[key];
  // });

  let consumptionValues = data.map((val) => {
    return val.consumption;
  });

  let yRange = [Math.min.apply(this, consumptionValues), Math.max.apply(this, consumptionValues)];

  console.log(yRange);

  let chart = <ConsumptionChart data={data} />;

  ReactDOM.render(chart, document.getElementsByTagName('main')[0]);


  //document.getElementById('message').textContent = snapshot.val().consumption;
});

// firebase.database().ref('meters').once('value').then(snapshot => {
//   console.log(snapshot.val());
// });

// firebase.database().ref('readings').orderByChild('timeStamp').once('value').then(snapshot => {
//   console.log(snapshot.val());
// });





