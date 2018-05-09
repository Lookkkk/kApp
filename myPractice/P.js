let p = new Promise(function (resolve, reject) {
    resolve('dsadsadsa')
});
let p2=p.then(function (data) {
    return new Promise(function (resolve,reject) {
        resolve('p');
    })
});
p2.then(function (data) {
    console.log(data);
})