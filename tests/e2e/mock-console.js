function myError(err) {
  //console.dir(err);
  if (err.includes("ECONNREFUSED")) { jest.fn() } else { console.dir(err) };
};

global.console = {
        log: jest.fn(),
        dir: console.dir,
        error: myError,
//      error: console.error,
        warn: console.warn,
        info: jest.fn(),
        debug: console.debug
};
