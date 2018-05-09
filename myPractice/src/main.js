var echarts = require('echarts');
/*
export * from 'echarts/src/echarts';
import 'echarts/src/chart/ple';*/
console.log(echarts);
echarts.init(document.getElementById('main')).setOption({
    title: {
        text: 'ECharts 入门示例'
    },
    tooltip: {},
    xAxis: {
        data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子']
    },
    yAxis: {},
    series: [{
        type: 'pie',
        radius: '55%',
        roseType: 'angle',
        data: [
            {name: 'A', value: 1212},
            {name: 'B', value: 2323},
            {name: 'c', value: 1919}
        ]
    }],
    itemStyle: {
        emphasis: {
            shadowBlur: 200,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
    }
});
/*var echarts = require('echarts');

// 基于准备好的dom，初始化echarts实例
var myChart = echarts.init(document.getElementById('main'));
// 绘制图表
myChart.setOption({
    title: {
        text: 'ECharts 入门示例'
    },
    tooltip: {},
    xAxis: {
        data: ['衬衫', '羊毛衫', '雪纺衫', '裤子', '高跟鞋', '袜子']
    },
    yAxis: {},
    series: [{
        name: '销量',
        type: 'pie',
        data: [5, 20, 36, 10, 10, 20]
    }]
});*/
