const _ = require("lodash");

function generateAdvice(extendedData = {}) {
  return JSON.stringify(_.merge({},
    {
      "total_results": "20",
      "query": "a",
      "slips": [
        {
          "id": 1,
          "advice": "Remember that spiders are more afraid of you, than you are of them.",
          "date": "2015-05-26"
        },
        {
          "id": 2,
          "advice": "Smile and the world smiles with you. Frown and you're on your own.",
          "date": "2015-11-18"
        },
        {
          "id": 3,
          "advice": "Don't eat non-snow-coloured snow.",
          "date": "2013-11-25"
        },
        {
          "id": 4,
          "advice": "Cars are bad investments.",
          "date": "2017-02-12"
        },
        {
          "id": 5,
          "advice": "If you have the chance, take it!",
          "date": "2016-12-25"
        },
        {
          "id": 7,
          "advice": "Make choices and dont look back.",
          "date": "2016-06-22"
        },
        {
          "id": 8,
          "advice": "Happiness is a journey, not a destination.",
          "date": "2017-02-09"
        },
        {
          "id": 9,
          "advice": "True happiness always resides in the quest.",
          "date": "2015-10-24"
        },
        {
          "id": 10,
          "advice": "Never pay full price for a sofa at DFS.",
          "date": "2017-01-29"
        },
        {
          "id": 11,
          "advice": "Avoid mixing Ginger Nuts with other biscuits, they contaminate. Keep separated.",
          "date": "2015-10-22"
        },
        {
          "id": 12,
          "advice": "Always block trolls.",
          "date": "2016-11-30"
        },
        {
          "id": 13,
          "advice": "If you're feeling tired or anxious, a pint of water will almost always make you feel better.",
          "date": "2016-10-23"
        },
        {
          "id": 14,
          "advice": "Life is better when you sing about bananas.",
          "date": "2015-12-13"
        },
        {
          "id": 15,
          "advice": "If it ain't broke don't fix it.",
          "date": "2015-09-03"
        },
        {
          "id": 17,
          "advice": "Sometimes it's best to ignore other people's advice.",
          "date": "2017-01-24"
        },
        {
          "id": 18,
          "advice": "Don't judge a book by its cover, unless it has a synopsis on the back.",
          "date": "2016-04-03"
        },
        {
          "id": 19,
          "advice": "If you cannot unscrew the lid of a jar, try placing a rubber band around its circumference for extra grip.",
          "date": "2016-12-22"
        }
      ]
    }, extendedData));
}

module.exports = generateAdvice;
