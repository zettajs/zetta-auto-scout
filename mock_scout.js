var util = require('util');
var Scout = require('zetta').Scout;

var MockScout = module.exports = function(devices) {
  Scout.call(this);

  this.devices = Array.isArray(devices)
                   ? devices
                   : [devices];

};
util.inherits(MockScout, Scout);

MockScout.prototype.init = function(cb) {
  for(var i = 0; i < this.devices.length; i++) {
    var device = this.devices[0];

    var filter = typeof device.filter === 'string'
                   ? { type: device.filter }
                   : device.filter;

    var query = this.server.where(filter);

    var self = this;
    this.server.find(query, function(err, results) {
      if (err) {
        return cb(err);
      };

      if (results.length) {
        results.forEach(function(result) {
          self.provision(result, device.constructor);
        });
      } else {
        self.discover(device.constructor);
      }

      if (i === this.devices.length - 1) {
        cb();
      }
    });
  }
};
