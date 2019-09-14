const figlet = require('figlet');
const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');
const _ = require('lodash');
const { Git } = require('./git');

function println(str) {
  process.stdout.write(`${str}\n`);
}
function print(str) {
  process.stdout.write(str);
}
function sortObject(obj) {
  return _(obj)
    .toPairs()
    .orderBy([1], 'desc')
    .fromPairs()
    .value();
}

async function main() {
  console.log(argv);
  const gitClient = Git({ wdir: argv.repo, useName: !argv.email });
  const ownership = await gitClient.codeOwnership();
  const sum = {};
  ownership
    .map(obj => obj.count)
    .forEach(oo => {
      const authors = Object.keys(oo);
      authors.forEach(a => {
        sum[a] = (sum[a] || 0) + oo[a];
      });
    });
  const sortedSum = sortObject(sum);

  ownership.forEach(ow => {
    println('\n');
    println(chalk.bold(ow.filename));
    const sortedCount = sortObject(ow.count);
    Object.keys(sortedCount).forEach(c => {
      println(`\t${chalk.yellow(c)}: ${chalk.bold(sortedCount[c])}`);
    });
  });

  println('\n\n');
  println(chalk.black.bgGreen('<<SUMMARY>>'));
  println('\n');

  Object.keys(sortedSum).forEach(s => {
    println(`${chalk.yellow(s)}: ${chalk.bold(sum[s])}`);
  });

  await gitClient.commiters();
}

const bootstrap = function() {
  figlet('G i t A l y z e r', (err, data) => {
    if (err) {
      println('Something went wrong...');
      return;
    }
    println(data);
    main();
  });
};

bootstrap();
