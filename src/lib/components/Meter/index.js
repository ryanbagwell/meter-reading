import React from 'react';
import ConsumptionChart from '../ConsumptionChart';
import ConsumptionTable from '../ConsumptionTable';
import {getMeterRef, arrangeDataByHour} from '../../utils';
import titlecase from 'titlecase';

export default class Meter extends React.Component {

  static propTypes = {
    category: React.PropTypes.string,
    deviceId: React.PropTypes.string,
    msgType: React.PropTypes.string,
    units: React.PropTypes.string,
    costPerUnit: React.PropTypes.number,
    data: React.PropTypes.array,
  }

  static defaultProps = {
    data: [],
  }

  constructor(props) {
    super(props);

    this.state = props;

  }

  componentWillMount() {

    let db = getMeterRef(this.props.deviceId);

    db.orderByChild('timeStamp').limitToLast(1000).on('value', (snapshot) => {

      let data = arrangeDataByHour(snapshot);

      this.setState({data: data});

    });

  }

  render() {

    return (
      <span>
        <h2>{titlecase(this.props.category + ' Consumption')}</h2>
        <ConsumptionChart {...this.state} />
        <ConsumptionTable {...this.state} />
      </span>
    );

  }

}
