const simpleGit = require('simple-git/promise');
const _ = require('lodash');

function Git({ wdir, useName }) {
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

  return {
    codeOwnership,
    committer
  };
}

module.exports = {
  Git
};
