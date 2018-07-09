var appRoot = 'server/';
var outputRoot = 'dist/';

module.exports = {
  root: appRoot,
  yaml: appRoot + '**/*.yaml',
  json: appRoot + '**/*.json',
  source: appRoot + '**/*.ts',
  data: appRoot + '**/*.json',
  html: appRoot + '**/*.html',
  css: appRoot + '**/*.css',
  content: appRoot + '**/*.png',
  swagger: appRoot + 'swagger/' + '**/*',
  output: outputRoot,
  doc: './doc',
  e2eSpecsSrc: 'test/e2e/src/*.js',
  e2eSpecsDist: 'test/e2e/dist/'
};