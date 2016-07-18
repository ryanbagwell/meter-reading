import React from 'react';
import {LineChart} from 'react-d3-basic';
import {formatTimeString} from '../../utils';


export default class ConsumptionChart extends React.Component {

  static propTypes = {
    category: React.PropTypes.string,
    deviceId: React.PropTypes.string,
    msgType: React.PropTypes.string,
    units: React.PropTypes.string,
    costPerUnit: React.PropTypes.number,
    data: React.PropTypes.array,
    color: React.PropTypes.string,
  }

  static defaultProps = {
    color: 'blue',
  }

  render() {

    let chartSeries = [
      {
        field: 'consumption',
        name: 'Consumption',
        color: this.props.color,
      },
    ];

    let width = 800,
      height = 500,
      margins = {left: 100, right: 100, top: 50, bottom: 50};

    let getXValue = function(d) {
      return d.index;
    };

    let xTickFormat = function(d) {
      d = this.props.data[d];
      return formatTimeString(d.timeString);
    };

    return (<LineChart margins={margins}
                         data={this.props.data}
                         width={width}
                         height={height}
                         chartSeries={chartSeries}
                         x={getXValue}
                         yLabel={this.props.units}
                         xLabel="Time"
                         xTickFormat={xTickFormat.bind(this)} />);

  }

}
