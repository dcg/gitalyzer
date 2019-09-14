const figlet = require('figlet');
const argv = require('minimist')(process.argv.slice(2));
const chalk = require('chalk');

const { Git } = require('./git');

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

  ownership.forEach(ow => {
    console.log('\n');
    console.log(chalk.bold(ow.filename));
    Object.keys(ow.count).forEach(c => {
      console.log(`\t${chalk.yellow(c)}: ${chalk.bold(ow.count[c])}`);
    });
  });

  console.log('\n\n');
  console.log(chalk.black.bgGreen('<<SUMMARY>>'));
  console.log('\n');

  Object.keys(sum).forEach(s => {
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
