//需要的引入
//========================================================
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, {Component} from 'react';
import Icons from 'react-native-vector-icons/Ionicons';
import request from '../commons/request';
import config from '../commons/config';
import Detail from '../commons/details';
import {
    StyleSheet,
    Text,
    View,
    ListView,
    TouchableHighlight,
    Dimensions,
    ImageBackground,
    ActivityIndicator,
    RefreshControl,
    AlertIOS,
} from 'react-native';

var width = Dimensions.get('window').width;
//公共变量
var cachedResults = {
    nextPage: 1,
    items: [],
    total: 0
};
//=====================================================
type Props = {};
//每一条列表的组件
class Item extends Component<Props> {
    constructor() {
        super();
        this.state = {
            up: false,
            row: {}
        }
    }

    /*getDefaultProps(...props){
        console.log(props);
    }*/
    componentWillMount(...props) {
        //console.log(props,'dsadasdasdasdadsadsadsadada');
        console.log(this.props);
        this.setState({
            row: this.props.row,
            up: this.props.row.voted
        })
    }

    //点赞功能
    _up = () => {
        var up = !this.state.up;
        var row = this.state.row;
        var url = config.api.base + config.api.up;
        var body = {
            id: row._id,
            up: up ? 'yes' : 'no',
            accessToken: 'abce'
        };
        console.log(body);
        request.post(url, body).then(data => {
            console.log(data);
            if (data && data.success) {
                this.setState({
                    up: up
                })
            } else {
                AlertIOS.alert('点赞失败，稍后重试')
            }
        }).catch(err => {
            console.log(err);
            AlertIOS.alert(err + '点赞失败，稍后重试')
        })
    };
    //渲染每一条列表
    render() {
        return (
            <TouchableHighlight onPress={this.props.onSelect}>
                <View style={styles.item}>
                    <Text style={styles.title}>{this.props.row.title}</Text>
                    <ImageBackground
                        source={{uri: this.props.row.thumb}}
                        style={styles.thumb}>
                        <Icons
                            name='ios-play'
                            size={28}
                            style={styles.play}
                        />
                    </ImageBackground>
                    <View style={styles.itemFooter}>
                        <View style={styles.handleBox}>
                            <Icons
                                name={this.state.up ? 'ios-heart' : 'ios-heart-outline'}
                                size={28}
                                style={[styles.up, this.state.up ? null : styles.down]}
                                onPress={this._up}
                            />
                            <Text style={styles.handleText} onPress={this._up}>喜欢</Text>
                        </View>
                        <View style={styles.handleBox}>
                            <Icons
                                name='ios-chatboxes-outline'
                                size={28}
                                style={styles.commentIcon}
                            />
                            <Text style={styles.handleText}>评论</Text>
                        </View>
                    </View>
                </View>
            </TouchableHighlight>
        )
    }
}
//整个列表的组件
export default class List extends Component<Props> {
    constructor() {
        super();
        var ds = new ListView.DataSource({
            rowHasChanged: (r1, r2) => r1 !== r2
        });
        console.log(ds.cloneWithRows([]));
        this.state = {
            isRefreshing: false,
            isLoadingTail: false,
            dataSource: ds.cloneWithRows([]),
        }
    }

    //列表样式   上面的每一条的样式会执行多次
    renderRow = (row) => {
        return (
            <Item
                key={row._id}
                onSelect={() => {
                    this._loadPage(row)
                }}
                row={row}/>
        )
    };

    //组件挂载
    componentDidMount() {
        this._fetchData()
    }

    //获取数据
    _fetchData(page) {
        if (page !== 0) {
            this.setState({
                isLoadingTail: true
            });
        } else {
            this.setState({
                isRefreshing: true
            });
        }

        console.log(request);
        return request.get(config.api.base + config.api.creations, {
            accessToken: 'k',
            page: page,
        }).then(data => {
            //var data = Mock.mock(responseJson);
            console.log(this.state.dataSource);
            if (data.success) {
                console.log(data);
                var items = cachedResults.items.slice();
                if (page !== 0) {
                    items = items.concat(data.data);
                    cachedResults.nextPage += 1;
                } else {
                    items = data.data;
                    cachedResults.nextPage = 1;
                }
                cachedResults.items = items;
                cachedResults.total = data.total;
                setTimeout(item => {
                    if (page !== 0) {
                        this.setState({
                            isLoadingTail: false,
                            dataSource: this.state.dataSource.cloneWithRows(cachedResults.items)
                        })
                    } else {
                        this.setState({
                            isRefreshing: false,
                            dataSource: this.state.dataSource.cloneWithRows(cachedResults.items)
                        })
                    }
                }, 2000)
            }
            console.log(data);
        }).catch(
            error => {
                console.error(error);
                if (page !== 0) {
                    this.setState({
                        isLoadingTail: false
                    });
                } else {
                    this.setState({
                        isRefreshing: false
                    });
                }
            });
    }

    //验证是否还有更多数据
    _hasMore = () => {
        return cachedResults.items.length < cachedResults.total
    };
    //下拉加载
    _fetchMoreData = () => {
        if (!this._hasMore() || this.state.isLoadingTail) {
            return
        }
        var page = cachedResults.nextPage;
        this._fetchData(page)
    };
    //底部loading样式
    _renderFooter = () => {
        if (!this._hasMore() && cachedResults.total !== 0) {
            return (
                <View style={styles.loadingMore}>
                    <Text style={styles.loadingText}>
                        没有更多了
                    </Text>
                </View>
            )
        }
        if (!this.state.isLoadingTail) {
            return <View style={styles.loadingMore}/>
        }
        return <ActivityIndicator style={styles.loadingMore}/>
    };
    //下拉刷新
    _onRefresh = () => {
        if (!this._hasMore() || this.state.isRefreshing) {
            return
        }
        this.setState({
            isRefreshing: true
        });
        this._fetchData(0);
    };
    //跳转详情页
    _loadPage = (row) => {
        console.log(this.props, 'dsadsadasdsadsadasdasdas');
        this.props.navigator.push({
            title: '详情页',
            component: Detail,
            row: row
        })
    };
    //渲染整个列表
    render() {
        console.log(this.state.dataSource);
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>列表</Text>
                </View>
                <ListView
                    onEndReached={this._fetchMoreData}//上拉加载
                    onEndReachedThreshold={20}//预加载，距离底部20
                    renderFooter={this._renderFooter}
                    //style={{marginBottom: 59}}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.isRefreshing}
                            onRefresh={this._onRefresh}
                            tintColor='#ff6600'
                            title='拼命加载中'
                        />
                    }
                    dataSource={this.state.dataSource}
                    renderRow={this.renderRow}
                    enableEmptySections={true}
                    automaticallyAdjustContentInsets={false}
                />
            </View>
        )
    }
}
//样式
var styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FCFF',
    },
    header: {
        paddingTop: 25,
        paddingBottom: 12,
        backgroundColor: '#ee735c'
    },
    headerTitle: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '600',
    },
    item: {
        width: width,
        marginBottom: 10,
        backgroundColor: '#fff',
    },
    thumb: {
        width: 375,
        height: width * 0.56,
        //resizeMode : 'cover'
    },
    title: {
        padding: 10,
        fontSize: 18,
        color: '#333',
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#eee'
    },
    handleBox: {
        padding: 10,
        flexDirection: 'row',
        width: width / 2 - 0.5,
        justifyContent: 'center',
        backgroundColor: '#fff'
    },
    play: {
        position: 'absolute',
        bottom: 14,
        right: 14,
        width: 46,
        height: 46,
        paddingTop: 9,
        paddingLeft: 18,
        backgroundColor: 'transparent',
        borderColor: '#fff',
        borderWidth: 1,
        borderRadius: 23,
        color: '#ed7b66'
    },
    handleText: {
        paddingLeft: 12,
        fontSize: 18,
        color: '#333'
    },
    up: {
        fontSize: 22,
        color: '#ed7b66'
    },
    down: {
        fontSize: 22,
        color: '#333'
    },
    commentIcon: {
        fontSize: 22,
        color: '#333',
    },
    loadingMore: {
        marginVertical: 20
    },
    loadingText: {
        color: '#777',
        textAlign: 'center',
    },
    tab: {}
});
