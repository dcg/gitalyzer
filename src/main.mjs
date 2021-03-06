import figlet from 'figlet';
import minimist from 'minimist';
import chalk from 'chalk';
import lodash from 'lodash';
import Git from './git.mjs';

const argv = minimist(process.argv.slice(2));
const ignoredFiles = ['package.json', '.gitignore', 'package-lock.json'];
const ignoredPattern = [/.*\.md$/, /^\./];

function println(str) {
  process.stdout.write(`${str}\n`);
}

function sortObject(obj) {
  return lodash(obj)
    .toPairs()
    .orderBy([1], 'desc')
    .fromPairs()
    .value();
}

async function main() {
  console.log(argv.repo);
  const gitClient = Git({
    wdir: argv.repo,
    useName: !argv.email,
    ignoredFiles,
    ignoredPattern
  });
  let ownership = await gitClient.codeOwnership();
  const sum = {};
  ownership = ownership
    .filter(res => {
      return ignoredFiles.indexOf(res.filename) === -1;
    })
    .filter(res => {
      const bools = ignoredPattern.map(
        pattern => !!res.filename.match(pattern)
      );
      const x = bools.reduce((a, b) => a || b, false);
      return !x;
    });
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

  const comitters = await gitClient.committer();
  const sortedComitters = sortObject(comitters);
  println('\n\n');
  println(chalk.black.bgGreen('<<COMMITS>>'));
  println('\n');

  Object.keys(sortedComitters).forEach(s => {
    println(`${chalk.yellow(s)}: ${chalk.bold(sortedComitters[s])}`);
  });

  const changes = await gitClient.changesAllTime();
  const sumChanges = {};
  changes.forEach(oo => {
    const authors = Object.keys(oo);
    authors.forEach(a => {
      sumChanges[a] = (sumChanges[a] || 0) + oo[a];
    });
  });
  const sortedChanges = sortObject(sumChanges);
  println('\n\n');
  println(chalk.black.bgGreen('<<CHANGES ALL TIME>>'));
  println('\n');

  Object.keys(sortedChanges).forEach(s => {
    println(`${chalk.yellow(s)}: ${chalk.bold(sortedChanges[s])}`);
  });
}

const bootstrap = function bootstrap() {
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
