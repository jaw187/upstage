Upstage
=======
  Utility to crawl an entry URL and produce a static copy of the site.

Install
-------
```
npm install upstage
```

Example
-------
The example below will crawl google.com and save each html file and all of the assets that are associated with the host.

```
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
```

Comments
--------
It's slow.
