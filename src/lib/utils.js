import moment from 'moment';
import firebase from 'firebase';
import conf from '../conf/config';

export function parseTimeString(timeStr) {
  return moment(timeStr, 'YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ');
}

export function formatTimeString(timeStr) {
  let t = parseTimeString(timeStr);
  return t.format('M/D h:mm a');
}

export function cubicFeetToGallons(cuFt) {
  return Math.floor(cuFt * 7.48052);
}

export function formatCost(cost) {
  return cost.toLocaleString('en-US', {style: 'currency',
                                      currency: 'USD'});
}

export function arrangeDataByHour(snapshot) {

  let readings = snapshot.val();

  let keys = Object.keys(snapshot.val());

  let hoursObj = keys.reduce((hours, currentKey, i, arr) => {

    let data = readings[currentKey];

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

    first.consumption = last.consumption - first.consumption;
    first.index = i;

    return first;

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