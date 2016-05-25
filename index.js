#!/usr/bin/env babel-node --plugins transform-es2015-destructuring
'use strict';

const childProcess = require('child_process'),
    Firebase = require('firebase'),
    Q = require('q');

const devices = [
  {
    msgType: 'scm',
    deviceId: '43000657',
    category: 'electric',
  },
  {
    msgType: 'r900',
    deviceId: '1541531110',
    category: 'water',
  },
];


let conn = new Firebase('https://glaring-fire-6854.firebaseio.com');


let read = function(device) {

  let deferred = Q.defer();

  let {msgType, deviceId, category} = device;

  let cmd = `rtlamr -filterid=${deviceId} -msgtype=${msgType} -single=true -quiet -format=json`;

  childProcess.exec(cmd, function(err, stdout, stderr) {

    if (err) {

      deferred.reject(new Error(err));

    } else {

      let data = JSON.parse(stdout);
      data.category = category;

      deferred.resolve(data);

    }

  });

  return deferred.promise;

};

let save = function(data) {

  let deferred = Q.defer();

  data = Object.assign({timeStamp: data.Time, category: data.category}, data.Message);

  conn.push(data, (err) => {
    let dataStr = JSON.stringify(data);

    if (err) {
      console.log(`Error when saving ${dataStr}`, err);
    } else {
      console.log(`Saved ${dataStr}`);
    }
    deferred.resolve();
  });

  return deferred.promise;

};

let readDevices = function() {

  Q(null).then(read.bind(null, devices[0]))
    .then(save)
    .then(read.bind(null, devices[1]))
    .then(save)
    .done(readDevices);
};

readDevices();
