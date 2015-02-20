var util = require('util');
var crypto = require('crypto');
var Scout = require('zetta-scout');

var AutoScout = module.exports = function() {
  var args = Array.prototype.slice.call(arguments);

  this.filter = args[0];
  this.constructor = args[1];
  this.params = args.slice(2);

  if (!(this instanceof AutoScout)) {
    var scout = new AutoScout();
    scout.filter = this.filter;
    scout.constructor = this.constructor;
    scout.params = this.params;

    return scout;
  }

  Scout.call(this);
};
util.inherits(AutoScout, Scout);

AutoScout.prototype._hash = function() {
  var stringifiedParams = JSON.stringify(this.params);
  var hash = crypto.createHash('sha1');
  hash.update(stringifiedParams);
  return hash.digest('hex');
};

AutoScout.prototype.init = function(cb) {
  var filter = typeof this.filter === 'string'
                 ? { type: this.filter }
                 : this.filter;
  var deviceHash = this._hash();
  filter.hash = deviceHash;
  var query = this.server.where(filter);

  var applyArgs = [].concat(this.params || []);
  applyArgs.unshift(this.constructor);

  var self = this;

  this.server.find(query, function(err, results) {
    if (err) {
      return cb(err);
    };

    if (!self._deviceInstance) {
      if (results.length) {
        var result = results[0];
        applyArgs.unshift(result);
        var device = self.provision.apply(self, applyArgs);
      } else {
        var device = self.discover.apply(self, applyArgs);
      }

      // device is not always populated in the case of .provision
      if (device) {
        device.hash = deviceHash;
        device.save(function() {
          delete device.hash;
        });
      }
    } else {
      var machine = self._deviceInstance.instance;
      machine.hash = deviceHash;

      if (results.length) {
        machine.id = results[0].id; // must set id before machine_config runs
        machine.name = results[0].name;
      }

      machine._generate(self._deviceInstance.config);

      self.server.registry.save(machine, function(err){
        delete machine.hash;
        self.server._jsDevices[machine.id] = machine;
        self.server.emit('deviceready', machine);
        if (results.length) {
          self.server._log.emit('log','scout', 'Device (' + machine.type + ') ' + machine.id + ' was provisioned from registry.' );
        } else {
          self.server._log.emit('log','scout', 'Device (' + machine.type + ') ' + machine.id + ' was discovered' );
        }
      });
    }

    cb();
  });
};
