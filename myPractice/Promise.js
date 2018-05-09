function Promise(executor) {
    let self = this;
    self.status = 'pending';
    self.value = undefined;
    self.reason = undefined;
    self.onResolvedCallBacks = [];
    self.onRejectedCallBacks = [];

    function resolve(value) {
        if (self.status === 'pending') {
            self.value = value;
            self.status = 'resolved';
            self.onResolvedCallBacks.forEach(item => item(value));
        }
    }

    function reject(reason) {
        if (self.status === 'pending') {
            self.reason = reason;
            self.status = 'rejected';
            self.onRejectedCallBacks.forEach(item => item(reason));
        }
    }

    try {
        executor(resolve, reject);
    } catch (e) {
        reject(e);
    }
}

Promise.prototype.then = function (onFulfilled, onRejected) {
    let self = this;
    let promise2;
    if (self.status === 'resolved') {
        return promise2 = new Promise(function (resolve, reject) {
            let x = onFulfilled(self.value);
            if (x instanceof Promise) {
                x.then(resolve, reject);
            } else {
                resolve(x);
            }
        });
        //onFulfilled(self.value);
    }
    if (self.status === 'rejected') {
        return promise2 = new Promise(function (resolve, reject) {
            let x = onRejected(self.value);
            if (x instanceof Promise) {
                x.then(resolve, reject);
            } else {
                reject(x);
            }
        });
        //onRejected(self.reason);
    }
    if (self.status.padding === 'pending') {
        return Promise2 = new Promise(function (resolve, reject) {
            self.onResolvedCallBacks.push(function (resolve, reject) {
                let x = onFulfilled(self.value);
                if (x instanceof Promise) {
                    x.then(resolve, reject);
                } else {
                    resolve(x)
                }
            });
            self.onRejectedCallBack.push(function (resolve, reject) {
                let x = onRejected(self.value);
                if (x instanceof Promise) {
                    x.then(resolve, reject);
                } else {
                    reject(x);
                }
            })
        });
    }
    self.onResolvedCallBacks.push(onFulfilled);
    self.onRejectedCallBacks.push(onRejected);
};
