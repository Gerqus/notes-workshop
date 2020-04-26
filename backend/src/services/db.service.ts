import mongoose = require('mongoose');

class dbService {
  private connection: mongoose.Connection;
  private connectionStates = new Map(Object.entries({
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized',
  }));
  private connectingPromise: Promise<void>;

  constructor() {
    this.connection = mongoose.connection;
  }

  public connect(address: string): Promise<void> {
    if(this.connection.readyState === 1) {
      console.log('Already connected');
      return this.connectingPromise;
    }
    if(this.connection.readyState !== 0) {
      console.error(`Current connection state does not allow attempt of connecting. Current state: ${this.connectionStates.get(this.connection.readyState.toString())} (${this.connection.readyState})`);
      return this.connectingPromise;
    }
    return this.connectingPromise = new Promise((resolve, reject) => {
      this.connection.on('open', () => {
        console.error('Connected to MongoDB...');
        resolve();
      });
      this.connection.on('error', err => {
        console.error('connection error:', err);
        reject();
      });
  
      mongoose.connect(address, {useNewUrlParser: true, useUnifiedTopology: true});
      console.error('Connecting to MongoDB...');
    });
  }
}

export default new dbService();
