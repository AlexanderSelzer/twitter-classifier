var natural = require("natural");
var readline = require("readline");
var fs = require("fs");
var colors = require("colors");

if (!fs.existsSync("classifier.json")) {

console.log("Classifier does not exist. Creating one.");
  
var classifier = new natural.BayesClassifier();

classifier.addDocument("I hate you!", "negative");
classifier.addDocument("You suck!", "negative");
classifier.addDocument("You are the most evil person on the planet", "negative");
classifier.addDocument("There is nothing good about you", "negative");
classifier.addDocument("Your JavaScript is bad!", "negative");
classifier.addDocument("I never saw such a bad HTTP server like yours", "negative");

classifier.addDocument("I love your npm module!", "positive");
classifier.addDocument("You have really many cool projects on GitHub.", "positive");
classifier.addDocument("This vector drawing looks really nice. Did you use Inkscape?", "positive");
classifier.addDocument("Great idea of you, buying these BitCoins", "positive");
classifier.addDocument("I like you", "positive");
classifier.addDocument("You are nice", "positive");

classifier.train();
  
classifier.save("classifier.json", function(err, classifier) {
  if (err) console.log(err);
  process.exit();
});

}

natural.BayesClassifier.load("classifier.json", null, function(err, classifier) {

if (err) console.log(err);
  
var read = readline.createInterface(process.stdin, process.stdout);

read.setPrompt("say something ... ");
read.prompt();

var gotLine = false;
var classificationLine;
var classificationResult;

read.on("line", function(line) {
  if (!gotLine) {
    line = line;
    var classifications = classifier.getClassifications(line);
    // Save the line for the next step.
    classificationLine = line;
    classificationResult = classifier.classify(line);
    
    console.log(classificationResult);
    classifications.forEach(function(classification) {
      console.log(classification.value);
    });
    gotLine = true;
    read.setPrompt("Right? (y/n)");
  }
  else {
    var decision;
    if (line.toLowerCase() == "y") {
      // The decision is the result of the algorithm before.
      
      decision = classificationResult;
    }
    else {
      // "You are wrong, computer!"
      if (classificationResult === "positive") {
        // Invert the choice of the algorithm
        decision = "negative";
      }
      else {
        decision = "positive";
      }
    }
    console.log("Your decision was".green, decision, "for the line".green, classificationLine, "which was classified".green, classificationResult);
    classifier.addDocument(classificationLine, decision);
    classifier.train();
    
    read.setPrompt("say something ... ");
    gotLine = false;
  }
  read.prompt();
})
.on("close", function() {
  classifier.save("classifier.json", function(err, classifier) {
    if (err) console.log(err);
    process.exit();
  });
});
  
});