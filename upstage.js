var httpAgent = require('http-agent'),
    jsdom = require('jsdom'),
    fs = require('fs'),
    url = require('url');

var ROOT = './',
    DEFAULTPAGE = 'index.html';

exports.create = function (options,cb) {
      //  options = {
      //    entryurl,
      //    name,
      //    stageroot
      //    defaultpage
      //  }
  if (!options.stageroot) options.stageroot = ROOT;
  if (!options.defaultpage) options.defaultpage = DEFAULTPAGE;

  // CHECK ALL ARGUMENTS
  if (options.stageroot.substring(options.stageroot.length-1,options.stageroot.length) !== '/') {
    options.stageroot += "/";
  }

  if (!options.entryurl || !options.name) {
    cb("ENTRYURL and NAME required");
    return false;
  }

  cb('',new Site(options));
}

var Site = function (options) {
  this.url = url.parse(options.entryurl);
  this.root = options.stageroot + options.name;
  this.files = [];

  var self = this;

  this.crawl = function (host,paths,cb) {
    var files = paths.slice(0);

    var agent = httpAgent.create(host,paths);
  
    function reviewFile(file,agent) {
    
      file = file.replace(/^\//,"");

      for (var i=0;i<files.length;i++) {
        if (files[i] === file) {
          break;
        }
      }

      if (i === files.length) {
        files.push(file);
        agent.addUrl(file);
      }
    }

    function evaluateLink(href,agent) {
      var urltest = url.parse(href);
      if (!urltest.host) {
        if (/^mailto/.test(href) === false) {
          if (href.substring(0,1) != "#") {
            reviewFile(href,agent);
          }
        }
      }
    }

    function createFile(agent,partialpath) {
      if (!partialpath) var partialpath = '';

      var path = agent.response.req.path.split("/"),
          ppath = partialpath.split("/");


      if (path[path.length-1] === '') {
        //REPLACE WITH DEFAULT PAGE
        path[path.length-1] = options.defaultpage;
        ppath[path.length-1] = options.defaultpage;
      }   

      var filepath = self.root;
      for (var i=1; i < path.length; i++) {
        filepath += "/" + path[i];
      }

      fs.writeFile(filepath,agent.body,function (err) {
          if (err && (err.code === 'ENOTDIR' || err.code === 'ENOENT')) {
            for (var i=1; i < path.length-1; i++) {
              if (path[i] !== ppath[i]) {
                partialpath += "/" + path[i];
                fs.mkdir(self.root + partialpath, function (err) {
                    createFile(agent,partialpath)
                  });
                break;
              }
            }
          }

          else if (err) {
            console.log("ERROR while saving file --- " + filepath);
            console.log(err);
          }

          else {
            console.log("SAVED --- " + filepath);
            //FILE SAVED
          }

        });

    }

    agent.addListener('next', function (err, agent) {
        if (err) {
          //CATCH ERRORS ON REFUSED CONNECTIONS ... ETC ...
          console.log("ERROR in Agent");
          console.log(err);
          return false;
        }
        
        //DATA RECEIVED, CREATE FILE
        createFile(agent);

        if (agent.response.headers['content-type'].match('text/html') === null) {
          //IF DOCUMENT IS ANYTHING OTHER THAN HTML MOVE ON AND EXIT
          agent.next();
          return false;
        }
        jsdom.env({
            html: agent.body,
            scripts: ['http://code.jquery.com/jquery.min.js']
          }, function (err, window) {
            if (!window || !window.jQuery) return false;

            var $ = window.jQuery;

            $("a").each(function () {
                evaluateLink($(this).attr("href"),agent);
              });

            $("img").each(function () {
                evaluateLink($(this).attr("src"),agent);
              });

            $("iframe").each(function () {
                evaluateLink($(this).attr("src"),agent);
              }); 

            $("script").each(function () {
                evaluateLink($(this).attr("src"),agent);
              });

            $("link").each(function () {
                evaluateLink($(this).attr("href"),agent);
              });
          
            agent.next();
          });
      });

    agent.addListener('stop', function () {
        console.log('Agent Stopped');
        cb(false);
      });

    agent.start();
  }

//START BY CREATING ROOT DIRECTORY AND THEN START REQUEST
  this.start = function (cb) {
    fs.mkdir(this.root, function (err) {
        if (err === null || err.code === 'EEXIST') {
          self.crawl(self.url.host,[self.url.pathname.replace(/^\//,"")],cb)
        }   

        else {
          console.log("ERROR when creating root");
          console.log(err);
          cb(err);
        }   
      });
  }
}
