/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, {Component} from 'react';
import Icons from 'react-native-vector-icons/Ionicons'
import {
    Platform,
    StyleSheet,
    Text,
    View,
    TabBarIOS,
    NavigatorIOS
} from 'react-native';

const instructions = Platform.select({
    ios: 'Press Cmd+R to reload,\n' +
    'Cmd+D or shake for dev menu',
    android: 'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});
type Props = {};
import List from './app/creations/index'
import Edit from './app/edit/index'
import Account from './app/account/index'

export default class App extends Component<Props> {
    constructor() {
        super();
        this.state = {
            selectedTab: 'list',
        }
    }

    render() {
        return (
            <TabBarIOS tintColor="#ee735c">
                <Icons.TabBarItem
                    iconName='ios-videocam-outline'
                    selectedIconName='ios-videocam'
                    selected={this.state.selectedTab === 'list'}
                    onPress={() => {
                        this.setState({
                            selectedTab: 'list',
                        });
                    }}>
                    <NavigatorIOS
                        initialRoute={{
                            title: '列表页',
                            component: List,
                            passProps: {index: ''},
                        }}
                        style={{flex: 1}}
                    />
                </Icons.TabBarItem>
                <Icons.TabBarItem
                    iconName='ios-recording-outline'
                    selectedIconName='ios-recording'
                    selected={this.state.selectedTab === 'edit'}
                    onPress={() => {
                        this.setState({
                            selectedTab: 'edit',
                        });
                    }}>
                    <Edit/>
                </Icons.TabBarItem>
                <Icons.TabBarItem
                    iconName='ios-more-outline'
                    selectedIconName='ios-more'
                    selected={this.state.selectedTab === 'account'}
                    onPress={() => {
                        this.setState({
                            selectedTab: 'account',
                        });
                    }}>
                    <Account/>
                </Icons.TabBarItem>
            </TabBarIOS>
        );
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
