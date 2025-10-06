import { v4 as uuidv4 } from 'uuid';

class SubscriberSettings {
    constructor() {
        this.subId = uuidv4();
        this.topic = '';
        this.qos = 0;
        this.addedOn = +(new Date());
        this.updatedOn = +(new Date());
        this.subscribedMessages = [];
    }
}

export default SubscriberSettings;