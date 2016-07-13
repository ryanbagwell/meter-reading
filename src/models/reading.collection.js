import Backbone from 'backbone';
import backbonefire from 'backbonefire';
import ReadModel from './reading.model';




class ReadingCollection extends Backbone.Firebase.Collection {

    url: 'https://glaring-fire-6854.firebaseio.com/readings',

    model: ReadingModel,

}

export default ReadingCollection;