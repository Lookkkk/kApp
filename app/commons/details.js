/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, {Component} from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Video from 'react-native-video';

type Props = {};
export default class Detail extends Component<Props> {
    constructor() {
        super();
        this.state = {
            rate:1,
            muted:true
        }
    }
    componentWillMount(...arg){
        console.log(this.props);
        this.setState({

        })
    }
    _backToList = () => {
        console.log(this);
        console.log(this.props);
        this.props.navigator.pop();
    };

    render() {
        console.log(this.props, 'dsadsadas');
        return (
            <View style={styles.container}>
                <Text onPress={this._backToList}>详情页面</Text>
                <View style={styles.videoBox}>
                    <Video ref='videoPlayer'
                           //播放路径
                           source={{uri:row.video}}
                           style={style.video}
                           //声音放大倍数
                           volume={5}
                           //是否暂停
                           paused={false}
                           //0暂停1正常
                           rate={this.state.rate}
                           //true静音false正常
                           muted={this.state.muted}
                    />
                </View>
            </View>
        )
    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
    },
    welcome: {
        fontSize: 20,
        textAlign: 'center',
        margin: 10,
    },
    instructions: {
        textAlign: 'center',
        color: '#333333',
        marginBottom: 5,
    },
    tab: {}
});
