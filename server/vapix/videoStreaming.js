var vapix = require('../lib/vapix');

//http://192.168.1.155:80/view/viewer_index.shtml?id=2
var camera = vapix.createCamera({
  address: '192.168.1.155',
  port: '80',
  username: 'root',
  password: 'root'
});

module.exports.camera = camera;