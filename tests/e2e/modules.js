const jsdom = require("jsdom");
// const fetch = require("node-fetch");
const helpers = require("./global-setup");
let app = null;

describe("Display of modules", function () {
        beforeAll(function () {
                // todo: require is not defined ...
                //              jest.mock("logger");
                app = helpers.startApplication("tests/configs/modules/display.js");
                //                app = helpers.startApplication("config/config.js");
        });
        afterAll(function () {
                helpers.stopApplication(app);
        });

        it("should show the test header", function (done) {
                jsdom.JSDOM.fromURL("http://localhost:8080", { resources: "usable", runScripts: "dangerously" }).then((dom) => {
                        //                      console.log(dom.serialize());
                        dom.window.onload = function () {
                                const doc = dom.window.document;
                                let elem = doc.querySelector("title");
                                expect(elem).not.toBe(null);
                                expect(elem.textContent).toBe("MagicMirror²");
/*
                                const children = doc.body.getElementsByTagName("*");
                                for (var i = 0, length = children.length; i < length; i++) {
                                        child = children[i];
                                        if (child.id !== "") console.dir(child.id);
                                }
*/
                                elem = doc.querySelector("#module_0_helloworld .module-header");
                                expect(elem).not.toBe(null);
                                expect(elem.textContent).toBe("test_header");
                                //result ist leider lowercase wegen fehlendem css, siehe https://stackoverflow.com/questions/10318330/how-do-you-add-stylesheets-to-jsdom
                                elem = doc.querySelector("#module_1_helloworld .module-header");
                                expect(elem).not.toBe(null);
                                expect(elem.textContent).toBe("undefined");

                                //dom.window.close();
                                done();
                        };
                });
        });
});
