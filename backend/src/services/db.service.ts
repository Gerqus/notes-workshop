import mongoose = require('mongoose');

class dbService {
  public foo = 'bar';
  constructor() {
    mongoose.connect('mongodb://localhost:27017', {useNewUrlParser: true});
  }
}


export default new dbService();
