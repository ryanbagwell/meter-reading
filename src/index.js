import firebase from 'firebase';
import Backbone from 'backbone';
import backbonefire from 'backbonefire';
import React from 'react';
import ReactDOM from 'react-dom';
import ReactCharts from 'react-chartjs';


var config = {
  apiKey: "AIzaSyDm4pY8-iMZt5WuSzVHH1TZJogQxI48xJI",
  databaseURL: "https://glaring-fire-6854.firebaseio.com",
};

firebase.initializeApp(config);

firebase.database().ref('meters').once('value').then(snapshot => {
  console.log(snapshot.val());
});

firebase.database().ref('readings').orderByChild('timeStamp').once('value').then(snapshot => {
  console.log(snapshot.val());
});

class Charts extends React.Component {

  render() {


  }


}


let charts = <Charts />;


ReactDOM.render(<Charts />, document.getElementsByTagName('main')[0]);

