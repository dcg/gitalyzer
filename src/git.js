const simpleGit = require('simple-git/promise');
const _ = require('lodash');

function Git({ wdir, useName, ignoredFiles, ignoredPattern }) {
  const git = simpleGit(wdir);
  function countAuthors(filename) {
    const filterAuthorRx = useName ? /^author / : /^author-mail/;
    return git
      .raw(['blame', '--line-porcelain', filename])
      .then(s => s.split('\n'))
      .then(lines =>
        lines
          .filter(l => l.match(filterAuthorRx))
          .map(l => l.replace(filterAuthorRx, ''))
      )
      .then(authors => _.countBy(authors))
      .then(count => ({ filename, count }))
      .catch(e => {
        console.error(`Coudn't process file:  ${filename}`, e);
        return { filename, count: {} };
      });
  }
  async function codeOwnership() {
    const files = await git
      .raw(['ls-files'])
      .then(s => s.split('\n').filter(l => l.length > 1));
    return Promise.all(files.map(countAuthors));
  }
  async function committer() {
    const log = await git.log();
    const names = log.all.map(x => (useName ? x.author_name : x.author_email));
    return _.countBy(names);
  }

  async function changesAllTime() {
    const log = await git.log({ '--stat': null });
    const changes = log.all.map(commit => {
      if (!commit || !commit.diff) {
        // this is a e.g. a merge, lets ignore
        return {
          [`[MERGE] ${useName ? commit.author_name : commit.author_email}`]: 1
        };
      }
      let { files } = commit.diff;
      files = files.filter(f => ignoredFiles.indexOf(f.file) === -1);
      // eslint-disable-next-line no-restricted-syntax
      for (const pattern of ignoredPattern) {
        files = files.filter(f => !f.file.match(pattern));
      }
      files = files.filter(f => ignoredFiles.indexOf(f.file) === -1);

      const changesPerCommit = files.reduce((a, b) => a + b.changes, 0);
      return {
        [useName ? commit.author_name : commit.author_email]: changesPerCommit
      };
    });
    return changes;
  }
  return {
    codeOwnership,
    committer,
    changesAllTime
  };
}

module.exports = {
  Git
};
