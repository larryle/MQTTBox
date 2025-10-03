import React from 'react';

import MqttClientActions from '../../actions/MqttClientActions';
import MqttClientConstants from '../../utils/MqttClientConstants';
import CommonActions from '../../actions/CommonActions';
import MqttClientService from '../../services/MqttClientService';

const style = {
    subscriberPaper: {
        height: '600px',
        width: '100%',
        display: 'inline-block',
        border: '1px solid #eea236',
        padding:10,
        overflow: 'auto',
        wordBreak:'break-all'
    },
    removeStyle:{
        position: 'absolute',
        right: '20px',
        top: 0,
        cursor: 'pointer',
        color:'#eea236'
    }
};

export default class MqttClientSubscriber extends React.Component {

    constructor(props) {
        super(props);

        this.onTargetValueChange = this.onTargetValueChange.bind(this);
        this.saveSubscriberSettings = this.saveSubscriberSettings.bind(this);
        this.deleteSubscriber = this.deleteSubscriber.bind(this);
        this.subscribeToTopic = this.subscribeToTopic.bind(this);
        this.unSubscribeToTopic = this.unSubscribeToTopic.bind(this);
        this.updatePageData = this.updatePageData.bind(this);

        this.state = {
            qos:this.props.subscriberSettings.qos,
            topic:this.props.subscriberSettings.topic
        }
    }

    onTargetValueChange(event) {
        var newState = {};
        newState[event.target.name] = event.target.value;
        this.setState(newState);
    }

    saveSubscriberSettings() {
        var subSettings = {subId: this.props.subscriberSettings.subId,
                           topic: this.state.topic,
                           qos: this.state.qos};
        MqttClientActions.saveSubscriberSettings({mcsId:this.props.mcsId,subscriber:subSettings});
    }

    deleteSubscriber() {
        MqttClientActions.deleteSubscriber({mcsId:this.props.mcsId,subId:this.props.subscriberSettings.subId});
    }

    subscribeToTopic() {
        // 以最新的 Store 状态为准，避免 props 还未更新导致的误判
        var currentState = MqttClientService.getMqttClientStateByMcsId(this.props.mcsId);
        if(currentState==MqttClientConstants.CONNECTION_STATE_CONNECTED) {
            if(this.state.topic!=null && this.state.topic.trim().length>0) {
                var t = (this.state.topic||'').trim();
                MqttClientActions.subscribeToTopic(this.props.mcsId,this.props.subscriberSettings.subId,t,this.state.qos);
            } else {
                CommonActions.showMessageToUser({message:'Please enter valid topic to subscribe'});
            }
        } else {
            CommonActions.showMessageToUser({message:'MQTT Client is not connected to broker. Please check client settings'});
        }
    }

    unSubscribeToTopic() {
        MqttClientActions.unSubscribeToTopic(this.props.mcsId,this.props.subscriberSettings.subId,this.state.topic);
    }

    updatePageData(data) {
        if(data.subId == this.props.subscriberSettings.subId) {
            this.setState({updated:+(new Date())});
        }
    }

    componentDidMount() {
        MqttClientService.addChangeListener(MqttClientConstants.EVENT_MQTT_CLIENT_SUBSCRIBED_DATA_RECIEVED,this.updatePageData);
    }

    componentWillUnmount() {
        MqttClientService.removeChangeListener(MqttClientConstants.EVENT_MQTT_CLIENT_SUBSCRIBED_DATA_RECIEVED,this.updatePageData);
    }

    render() {
        var subData = MqttClientService.getSubscribedData(this.props.mcsId,this.props.subscriberSettings.subId);
        var component ='';
        var messageList = [];

        if(subData!=null && subData.receivedMessages!=null && subData.receivedMessages.length>0) {
            var len = subData.receivedMessages.length;
            for (var i=len-1; i>=0;i--) {
                // 兼容不同形态的 payload：Buffer、Uint8Array、{ type:'Buffer', data:[] }、string
                var pkt = subData.receivedMessages[i].packet || {};
                var bytes = [];
                try {
                    if (pkt && pkt.payload && Array.isArray(pkt.payload.data)) {
                        bytes = pkt.payload.data;
                    } else if (pkt && pkt.payload && (pkt.payload instanceof Uint8Array || Array.isArray(pkt.payload))) {
                        bytes = Array.prototype.slice.call(pkt.payload);
                    } else if (pkt && pkt.payload && typeof pkt.payload === 'string') {
                        try {
                            if (typeof TextEncoder !== 'undefined') {
                                bytes = Array.prototype.slice.call(new TextEncoder().encode(pkt.payload));
                            } else {
                                bytes = pkt.payload.split('').map(function(ch){ return ch.charCodeAt(0) & 0xff; });
                            }
                        } catch(__) {}
                    }
                } catch(_) {}
                function decimalToHex(d) {
                    var hex = Number(d).toString(16);
                    while (hex.length < 2) { hex = "0" + hex; }
                    return hex;
                }
                var rawPayload = bytes.map(decimalToHex);
                messageList.push(
                    <div key={this.props.subscriberSettings.subId+i}  className="panel" style={{border:'1px solid #e1e1e8'}}>
                        <div style={{cursor:'pointer'}} data-toggle="collapse" data-target={"#collapse"+this.props.subscriberSettings.subId+i} className="panel-heading">
                            <div className="panel-title">
                                <a className="accordion-toggle">
                                    {subData.receivedMessages[i].message}
                                </a>
                            </div>
                        </div>
                        <div id={"collapse"+this.props.subscriberSettings.subId+i} className="panel-collapse collapse in">
                            <div className="panel-body">
                                <div>
                                    <div>
                                        <b>qos</b> : {(pkt.qos!=null?pkt.qos:'')},
                                        <b> retain</b> : {((pkt.retain!=null?pkt.retain:false).toString())},
                                        <b> cmd</b> : {(pkt.cmd||'')},
                                        <b> dup</b> : {((pkt.dup!=null?pkt.dup:false).toString())},
                                        <b> topic</b> : {(pkt.topic||'')},
                                        <b> messageId</b> : {(pkt.messageId!=null?pkt.messageId:'')},
                                        <b> length</b> : {(pkt.length!=null?pkt.length:'')},
                                        <b> Raw payload</b> : <span>{rawPayload}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
        }

        if(subData!=null && subData.isSubscribed==true) {
            component = <div>
                            <div style={{marginBottom:10}}>
                                <button onClick={this.unSubscribeToTopic} title="Unsubscribe" type="button" className="btn btn-warning btn-sm btn-block">
                                  <span style={{marginRight:10}} className="glyphicon glyphicon-remove" aria-hidden="true"></span>{this.state.topic}
                                </button>
                            </div>
                            <div>
                                {messageList}
                            </div>
                        </div>
        } else {
            component = <div>
                            <div className="form-group">
                                <label htmlFor="topic">Topic to subscribe</label>
                                <input type="text" className="form-control" name="topic"
                                    onBlur={this.saveSubscriberSettings} placeholder="Topic to subscribe" onChange={this.onTargetValueChange} value={this.state.topic}/>
                            </div>
                            <div className="form-group">
                                <label htmlFor="qos">QoS</label>
                                <select onBlur={this.saveSubscriberSettings} name="qos" onChange={this.onTargetValueChange} value={this.state.qos} className="form-control">
                                    <option value="0">0 - Almost Once</option>
                                    <option value="1">1 - Atleast Once</option>
                                    <option value="2">2 - Exactly Once</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <button type="button" onClick={this.subscribeToTopic}  className="btn btn-warning">Subscribe</button>
                            </div>
                            <div>
                                <div className="panel-group">
                                    {messageList}
                                </div>
                            </div>
                        </div>;
        }

        return (
            <div className="col-xs-12 col-sm-6 col-md-4">
                <div style={style.subscriberPaper} className="thumbnail">
                    {component}
                </div>
                { (subData==null || subData.isSubscribed !=true) ?
                    <div>
                        <span onClick={this.deleteSubscriber} className="remove" style={style.removeStyle}>
                            <span className="glyphicon glyphicon-remove" aria-hidden="true"></span>
                        </span>
                    </div>: null
                }
            </div>
        );
    }
}
