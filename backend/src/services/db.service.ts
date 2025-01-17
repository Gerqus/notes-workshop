import mongoose = require('mongoose');

interface dbResponse {
  response: any,
  error?: string,
  affectedCount?: number,
}

class dbService {
  private connection: mongoose.Connection = mongoose.connection;;
  private connectionStates = new Map(Object.entries({
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized',
  }));
  private connectingPromise: Promise<void>;

  constructor() { }

  public connect(address: string): Promise<void> {
    if (this.connection.readyState === 1) {
      console.log('Already connected');
      return this.connectingPromise;
    }
    if (this.connection.readyState !== 0) {
      console.error(`Current connection state does not allow attempt of connecting. Current state: ${this.connectionStates.get(this.connection.readyState.toString())} (${this.connection.readyState})`);
      return this.connectingPromise;
    }
    return this.connectingPromise = new Promise((resolve, reject) => {
      this.connection.on('open', () => {
        console.log('Connected to MongoDB...');
        resolve();
      });
      this.connection.on('error', err => {
        console.error('connection error:', err);
        reject();
      });
  
      mongoose.connect(address, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
      });
      console.log('Connecting to MongoDB...');
    });
  }

  public save<T extends mongoose.Document>(object: T): Promise<dbResponse> {
    return new Promise((resolve, reject) => {
      object.save((error: string, response: T) => {
        if (error) {
          console.error(error);
          reject({error});
        } else {
          resolve({response});
        }
      });
    });
  }

  public find<T extends mongoose.Model<any>>(object: T, filter: mongoose.FilterQuery<T> = {}): Promise<dbResponse> {
    return new Promise((resolve, reject) => {
      object.find(filter, (error: string, response: T, affectedCount: number) => {
        if (error) {
          console.error(error);
          reject({error});
        } else {
          resolve({response, affectedCount});
        }
      });
    });
  }

  public delete<T extends mongoose.Model<any>>(object: T, objectId: string): Promise<dbResponse> {
    return new Promise((resolve, reject) => {
      object.deleteOne({_id: objectId}, (error: string) => {
        if (error) {
          console.error(error);
          reject({error});
        } else {
          resolve({response: null});
        }
      });
    });
  }
}

export default new dbService();
