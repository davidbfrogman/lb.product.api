import { Identity.ClientPage } from './app.po';

describe('identity.client App', () => {
  let page: Identity.ClientPage;

  beforeEach(() => {
    page = new Identity.ClientPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
