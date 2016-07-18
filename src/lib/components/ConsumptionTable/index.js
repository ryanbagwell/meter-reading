import React from 'react';
import {formatTimeString, formatCost} from '../../utils';

export default class ConsumptionTable extends React.Component {

  render() {

    return (
      <table>
        <thead>
        <tr>
          <th>Hour</th>
          <th>Consumption ({this.props.units})</th>
          <th>Cost</th>
        </tr>
        </thead>
        <tbody>
        {
          this.props.data.map((reading) => {
            return (
              <tr>
                <td>
                  {formatTimeString(reading.timeString)}
                </td>
                <td>
                  {reading.consumption}
                </td>
                <td>
                  {formatCost(reading.consumption * this.props.costPerUnit)}
                </td>
              </tr>
            );

          })
        }
        </tbody>
      </table>
    );

  }

}