/// <reference path="refs.ts"/>

import atom = require("atom");
import promise = require("es6-promise");
import fs = require("fs");
import process = require("child_process");

export class LinterMessage {
    type: string; // "Error" or "Warning"
    text: string;
    html: string;
    filePath: string;
    range: number[][];
    //  trace?: Array<Trace> // We don't care about this so I have this commented out
}

export function activate()
{
  console.log("Starting linting for Author Intrusion.");
}

export function deactivate()
{
  console.log("Stopping linting for Author Intrusion.");
}

export function provideLinter()
{
    var provider = {
        grammarScopes: ['source.gfm'],
        scope: 'file', //  # or 'project'
        lintOnFly: true, // # must be false for scope: 'project'
        lint: analyzeFile
    };

    return provider;
}

function analyzeFile(textEditor: AtomCore.IEditor): Promise<LinterMessage[]>
{
  // We can't handle files that aren't saved to the disk.
  if (!textEditor.buffer.file
      || !textEditor.buffer.file.path
      || !fs.existsSync(textEditor.buffer.file.path)) {
        return Promise.resolve([]);
  }

  // Get the path and build up the command line to hand it over
  // to `author-intrusion-cli`.
  var filePath = textEditor.buffer.file.path;

  // Run the linting process.
  var cliPromise = new Promise<LinterMessage[]>(
      function(resolve, reject) {
        var cli = process.spawn(
          "author-intrusion-cli",
          ["lint", "-f", "json", filePath]);
        var messages = "";

        cli.stdout.on(
          "data",
          data => messages += data.toString());
        cli.stderr.on(
          "data",
          function(data) {
            console.error(data.toString());
          });
        cli.on(
          "close",
          function (code) {
              var results = JSON.parse(messages);
              resolve(results);
          });
      });

  return cliPromise;
}
