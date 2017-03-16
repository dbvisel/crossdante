// the spine for the book

module.exports = {

	bookname: 'catulluscarmina',
	booktitle: "The Carmina",
	bookauthor: "Caius Valerius Catullus",
	description: `<p>A version of Catullus.</p>`,
	versionhistory: [ // this is the version history for a particular book, a list
		"0.0.1: first release"
	],
	comingsoon:  // this is what goes in the coming soon section, a single chunk of HTML
		"<p>More translations!</p>",


	cantotitles: [	// this is canto sequence
		"Title page","I","II","III","IIII","V","VI","VII","VIII","VIIII","X","XI","XII","XIII","XIIII","XV","XVI","XVII","XVIII","XVIIII","XX","XXI","XXII","XXIII","XXIIII","XXV","XXVI","XXVII","XXVIII","XXVIIII","XXX","XXXI","XXXII","XXXIII","XXXIIII","XXXV","XXXVI","XXXVII","XXXVIII","XXXVIIII","XXXX","XXXXI","XXXXII","XXXXIII","XXXXIIII","XXXXV","XXXXVI","XXXXVII","XXXXVIII","XXXXVIIII","L","LI","LII","LIII","LIIII","LV","LVI","LVII","LVIII","LVIIII","LX","LXI","LXII","LXIII","LXIIII","LXV","LXVI","LXVII","LXVIII","LXVIIII","LXX","LXXI","LXXII","LXXIII","LXXIIII","LXXV","LXXVI","LXXVII","LXXVIII","LXXVIIII","LXXX","LXXXI","LXXXII","LXXXIII","LXXXIIII","LXXXV","LXXXVI","LXXXVII","LXXXVIII","LXXXVIIII","LXXXX","LXXXXI","LXXXXII","LXXXXIII","LXXXXIIII","LXXXXV","LXXXXVI","LXXXXVII","LXXXXVIII","LXXXXVIIII","C","CI","CII","CIII","CIIII","CV","CVI","CVII","CVIII","CVIIII","CX","CXI","CXII","CXIII","CXIIII","CXV","CXVI"
	],

	translationdata: [	// this is translation sequence
		{"translationid":"catullus",
			"order":0},
		{"translationid":"burtonsmitherspoetry",
			"order":1},
		{"translationid":"burtonsmithersprose",
			"order":2}
	],

	textdata: [	// set up translations
		require("./translations/catullus"),
		require("./translations/burtonsmitherspoetry"),
		require("./translations/burtonsmithersprose")
	]
};
