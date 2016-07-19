import moment from 'moment';
import firebase from 'firebase';
import conf from '../conf/config';

export function parseTimeString(timeStr) {
  return moment(timeStr, 'YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ');
}

export function formatTimeString(timeStr) {
  let t = parseTimeString(timeStr);
  return t.format('M/D h a');
}

export function cubicFeetToGallons(cuFt) {
  return Math.floor(cuFt * 7.48052);
}

export function formatCost(cost) {
  return cost.toLocaleString('en-US', {style: 'currency',
                                      currency: 'USD'});
}

export function addDecimalPlaces(number, decimalPlaces = 0) {

  number = number.toString();

  number = `${number.slice(0, number.length - decimalPlaces)}.${number.slice(number.length - decimalPlaces)}`;

  return parseFloat(number);

}


export function arrangeDataByHour(snapshot, decimalPlaces = 0) {

  let values = snapshot.val();

  let keys = Object.keys(snapshot.val());

  let hoursObj = keys.reduce((hours, currentKey, i, arr) => {

    let data = values[currentKey];

    let hourStr = parseTimeString(data.timeString).format('YYYY-MM-DD:HH');

    if (!hours.hasOwnProperty(hourStr)) {
      hours[hourStr] = [];
    }

    hours[hourStr].push(data);

    return hours;

  }, {});

  let hoursArr = Object.keys(hoursObj).map((key, i, arr) => {

    let readings = hoursObj[key];

    let first = readings[0];

    let last = readings[readings.length - 1];

    let final = Object.assign({}, first);

    final.consumption = addDecimalPlaces(last.consumption - first.consumption, decimalPlaces);

    final.index = i;

    return final;

  }, []);

  return hoursArr;

}

export function getFirebase() {

  if (!window.firebaseInstance) {
    window.firebaseInstance = firebase.initializeApp(conf);
  }

  return window.firebaseInstance;

}

export function getMeterRef(meterId) {
  let fb = getFirebase();

  return fb.database().ref('readings/' + meterId);

}