// the spine for the book

module.exports = {

	bookname: 'purgatorio',
	booktitle: "Purgatorio",
	bookauthor: "Dante Alighieri",
	description: `<p>The adventure-packed sequel to <em>Inferno</em>.`,

	cantotitles: [	// this is canto sequence
		"Title page","Canto 1","Canto 2","Canto 3","Canto 4","Canto 5","Canto 6","Canto 7","Canto 8","Canto 9",
		"Canto 10","Canto 11","Canto 12","Canto 13","Canto 14","Canto 15","Canto 16","Canto 17","Canto 18","Canto 19",
		"Canto 20","Canto 21","Canto 22","Canto 23","Canto 24","Canto 25","Canto 26","Canto 27","Canto 28","Canto 29",
		"Canto 30","Canto 31","Canto 32","Canto 33"
	],

	translationdata: [	// this is translation sequence
		{"translationid":"dante",
			"order":0},
			{"translationid":"longfellow",
				"order":1},
			{"translationid":"cary",
				"order":2}/*,
			/*,
		{"translationid":"wright",
			"order":3},
		{"translationid":"carlyle",
			"order":4}*/
	],

	textdata: [	// set up translations
		require("./translations/dante"),
		require("./translations/longfellow"),
		require("./translations/cary")/*,
		require("./translations/norton"),
		require("./translations/wright"),
		require("./translations/carlyle")*/
	]
};
