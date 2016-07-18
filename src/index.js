import React from 'react';
import ReactDOM from 'react-dom';
import Meter from './lib/components/Meter';
import conf from './conf/config';


export default class Dashboard extends React.Component {


  render() {
    return (
      <span>
        {
          conf.devices.map((device) => {
            return <Meter {...device} />;
          })
        }
      </span>
    );
  }


}

let dashBoard = <Dashboard />;

ReactDOM.render(dashBoard, document.getElementsByTagName('main')[0]);
