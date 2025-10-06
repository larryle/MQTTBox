import { v4 as uuidv4 } from 'uuid';

class PublisherSettings {
    constructor() {
        this.pubId = uuidv4();
        this.topic = '';
        this.qos = 0;
        this.retain = false;
        this.payloadType = '0';
        this.payload = '';
        this.addedOn = +(new Date());
        this.updatedOn = +(new Date());
        this.publishedMessages = [];
    }
}

export default PublisherSettings;