import firebase from 'firebase';


var config = {
  apiKey: "AIzaSyDm4pY8-iMZt5WuSzVHH1TZJogQxI48xJI",
  databaseURL: "https://glaring-fire-6854.firebaseio.com",
};

firebase.initializeApp(config);

firebase.database().ref('meters').once('value').then(snapshot => {
  console.log(snapshot.val());
});

firebase.database().ref('readings').orderByChild('timestamp').once('value').then(snapshot => {
  console.log(snapshot.val());
})

