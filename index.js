var natural = require("natural");
var ntwitter = require("ntwitter");
var fs = require("fs");

var readline = require("readline");

var credentials = require("./credentials.json");
var twitter = new ntwitter(credentials);

natural.BayesClassifier.load("classifier.json", null, function(err, classifier) {

  var tweets = [];
  var results = [];

  twitter.
  verifyCredentials(function(err, data) {
    if (err) console.log(err);
  })
  .stream("statuses/sample", {
    language: "en",
    filter_level: "medium" // removes not-so-nice tweets
  }, function(stream) {
    stream.on("error", function(err) {
      return console.log("Problem:", err);
    });

    if (process.argv[2] === "analyze") {
      stream.on("data", analyze);
    }
    else {
      stream.on("data", interactive);
    }

    function analyze(data) {
      var classifications = classifier.getClassifications(data.text);
      var label = classifications.sort(function(a, b) {
        return a < b;
      })[0].label;

      results.push({
        classifications: classifications,
        content: data.text,
        label: label
      });
      
      if (results.length > 600) {
        fs.writeFileSync("results.json", JSON.stringify(results, null, 2));
        var readable =
          "Text | Label\n" +
          "------|------\n" +
          results.reduce(function(results, result) {
            if (result)
              return results + "\n" + "`" + result.content.replace(/\n/g, " ").replace(/\|/g, "\\|") + "`" + " | " + result.label;
            else
              return "";
          });
        fs.writeFileSync("results.md", readable);
        stream.destroy();
      }
    }

    function interactive(data) {
      var classifications = classifier.getClassifications(data.text);
      if (data.lang === "en") {
        tweets.push({
          content: data.text,
          classifications: classifications
        });
      }
      if (tweets.length > 100) {
        stream.destroy();  
        console.log(tweets);

        var rl = readline.createInterface(process.stdin, process.stdout);
        
        var i = 0;
        (function getResult() {  

          var classification = tweets[i].classifications;
          console.log(tweets[i].content);
          console.log(classification);

          i++;
          rl.question("Positive or negative? (p/n): ", function(answer) {
            console.log("Answer:", answer);

            var decision;
            
            if (/p/.test(answer)) 
              decision = "positive";
            else if (/n/.test(answer))
              decision = "negative";

            if (decision) {
              classifier.addDocument(tweets[i].content, decision);
              classifier.train();
            }

            classifier.save("classifier.json", function(err, classifier) {
              if (err) console.log(err);
            });

            getResult();
          });
          if (i === tweets.length) {
            process.exit();
          }
        })();
      }

    }
  });
});
