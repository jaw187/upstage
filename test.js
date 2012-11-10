var upstage = require('upstage');

var GOOGLE = upstage.create({
    entryurl: 'http://google.com',
    name: 'google',
    stageroot: './'
  }, function (err,site) {
    if (err) {
      console.log("ERROR creating upstage site");
      console.log(err);
      return false;
    }

    site.start(function (err,data) {
        console.log("CALLBACK");
      });

  });

