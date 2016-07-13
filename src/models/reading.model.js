import Backbone from 'backbone';
import backbonefire from 'backbonefire';


class ReadingModel extends Backbone.Firebase.Model {

  defaults: {
    timeStamp: '',
    timeString: '',
    category: '',
    id: '',
    consumption: '',
  }

}

export default ReadingModel;