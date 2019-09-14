const figlet = require('figlet');
const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');
const _ = require('lodash');
const { Git } = require('./git');

function sortObject(obj) {
  return _(obj)
    .toPairs()
    .orderBy([1], 'desc')
    .fromPairs()
    .value();
}

async function main() {
  const gitClient = Git({ wdir: argv._[0], useName: true });
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
    console.log('\n');
    console.log(chalk.bold(ow.filename));
    const sortedCount = sortObject(ow.count);
    Object.keys(sortedCount).forEach(c => {
      console.log(`\t${chalk.yellow(c)}: ${chalk.bold(sortedCount[c])}`);
    });
  });

  console.log('\n\n');
  console.log(chalk.black.bgGreen('<<SUMMARY>>'));
  console.log('\n');

  Object.keys(sortedSum).forEach(s => {
    console.log(`${chalk.yellow(s)}: ${chalk.bold(sum[s])}`);
  });
}

const bootstrap = function() {
  figlet('G i t A l y z e r', (err, data) => {
    if (err) {
      console.log('Something went wrong...');
      return;
    }
    console.log(data);
    main();
  });
};

bootstrap();
