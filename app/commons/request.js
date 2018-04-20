'use strict';
let queryString = require('query-string');
let _ = require('lodash');
let request = {};
let config=require('./config');
request.get=function (url,params) {
    if(params){
        url+='?'+queryString.stringify(params);
    }
    return fetch(url).then(response=>response.json()).then(response=>Mock.mock(response))
};
request.post=function (url,body) {
    var params=_.extend(config.header,{
        body:JSON.stringify(body)
    });
    return fetch(url,params).then(response=>response.json()).then(response=>Mock.mock(response))
};
import Mock from "mockjs";
module.exports=request;
/*
fetch('http://rapapi.org/mockjs/33403/api/creations?accessToken=k')
    .then(
        response => response.json()
    )
    .then(
        responseJson => {
            var data = Mock.mock(responseJson);
            console.log(this.state.dataSource);
            if (data.success) {
                this.setState({
                    dataSource: this.state.dataSource.cloneWithRows(data.data)
                })
            }
            console.log(data);
        }
    )
    .catch(
        error => {
            console.error(error);
        });*/
