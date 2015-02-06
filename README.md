# Zetta Auto Scout

Zetta Auto Scout is a way to initiate a zetta device driver without having to build a generic scout that looks for only a device type.

## Install

`npm install zetta-auto-scout`

## Usage

```js

var zetta = require('zetta');
var AutoScout = require('zetta-auto-scout');
var LED = require('zetta-led-mock-driver');

zetta()
  .use(AutoScout, 'led', LED)
  .use(AutoScout, 'led', LED, arg1, arg2) // arg1, arg2 are passed to led driver
  .listen(1337)

```

## Limitation

```js
zetta()
  .use(AutoScout, 'led', LED)
  .use(AutoScout, 'led', LED)
  .listen(1337)
```

Will only initialize one led driver, zetta thinks that it already exists. You can get around this with adding separate args for each device.

```js
zetta()
  .use(AutoScout, 'led', LED, 1)
  .use(AutoScout, 'led', LED, 2)
  .listen(1337)
```

## Licence

MIT
