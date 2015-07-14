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

AutoScout.prototype._generateHash = function() {
  var stringifiedParams = JSON.stringify(this.params);
  var hash = crypto.createHash('sha1');
  hash.update(stringifiedParams);
  return hash.digest('hex');
};

AutoScout.prototype.init = function(cb) {
  var filter = typeof this.filter === 'string'
                 ? { type: this.filter }
                 : this.filter;
  var deviceHash = this._generateHash();
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
        device.hash = self._generateHash();
        device.save();
      }
    } else {
      var machine = self._deviceInstance.instance;
      machine.hash = self._generateHash();

      machine._generate(self._deviceInstance.config);

      // update in-memory representation with any saved properties
      if (results.length) {
        var base = results[0];
        Object.keys(base).forEach(function(key) {
          machine[key] = base[key];
        });
      }

      self.server.registry.save(machine, function(err){
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
