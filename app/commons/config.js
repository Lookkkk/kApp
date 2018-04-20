'use strict';

module.exports = {
    header: {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    },
    api: {
        base: 'http://rapapi.org/mockjs/33403',
        creations: '/api/creations',
        up:'/api/up'
    }
};