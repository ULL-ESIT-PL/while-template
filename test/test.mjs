import * as util from 'util';
import transpile from "../src/transpile.js";
import assert from 'assert';
import * as fs from "fs";
import {
  dirname
} from 'path';
import {
  fileURLToPath
} from 'url';
//import * as shell from 'shelljs';
import exec from "shelljs.exec"

const __dirname = dirname(fileURLToPath(import.meta.url));
import Tst from './test-description.mjs';

import 'dotenv/config'
const SkipJSComparison = process.env.SkipJSComparison==='true';
const DangerouslySkipJSComparison = process.env.DangerouslySkipJSComparison==='true';

const Test = Tst.map(t => {
  let result = {
    input: __dirname + '/data/input/' + t.input,
    actualjs: __dirname + '/data/actualjs/' + t.actualjs,
    expectedjs: __dirname + '/data/expectedjs/' + t.expectedjs,
    expectedout: false
  };
  if (t.expectedout) {
    result.expectedout = __dirname + '/data/expectedout/' + t.expectedout;
  }
  return result;
})

function removeSpaces(s) {
  return s.replace(/\s/g, '');
}

function removeDependencies(s) {
  const SEPARATION_STRING = '\n/* End of support code */\n\n'
  const REGULAR_SEPARATION = /^(.|\n)*\n\/\* End of support code \*\/\n\n/
  const pruned = s.replace(REGULAR_SEPARATION, '')
  //console.log(pruned)

  return removeSpaces(pruned);
}


for (let i = 0; i < Test.length; i++) {
  it(`transpile(${Tst[i].input}, ${Tst[i].actualjs}) (No errors: ${Boolean(Tst[i].expectedout)})`, async () => {

    // Compile the input and check the actualjs program is what expected
    let actualjs = await transpile(Test[i].input, Test[i].actualjs);

    let expectedjs = fs.readFileSync(Test[i].expectedjs, 'utf-8')
    //console.log(`*********expectedjs ${Test[i].expectedjs}******\n`, expectedjs);

    if (SkipJSComparison) {
      // Copy the actualjs to the expectedjs
      console.warn(`Skipping comparison of ${Test[i].actualjs} with ${Test[i].expectedjs}`)
      if (DangerouslySkipJSComparison){
        console.warn(`Dangerously copying ${Test[i].actualjs} to ${Test[i].expectedjs}`)
        fs.copyFileSync(Test[i].actualjs, Test[i].expectedjs);
      }
    }
    else {
      let trimActualJS = removeDependencies(actualjs)
      //console.log(trimActualJS)
      let trimExpectedJS = removeDependencies(expectedjs)
      assert.equal(trimActualJS, trimExpectedJS);
    }

    // Run the output program and check the logged output is what expected


    if (Test[i].expectedout) {
      let expectedout = fs.readFileSync(Test[i].expectedout, 'utf-8')

      let result = exec(`node ${Test[i].actualjs}`, {
        silent: false
      });

      assert.equal(removeSpaces(result.stdout), removeSpaces(expectedout))

    }

    //fs.unlinkSync(Test[i].actualjs);

  });
}