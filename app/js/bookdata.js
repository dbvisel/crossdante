// maybe turn this into a master data file for the book proper? a single object

// this is canto sequence

const cantotitles = ["Title page","Canto 1","Canto 2","Canto 3","Canto 4","Canto 5","Canto 6","Canto 7","Canto 8","Canto 9",
	"Canto 10","Canto 11","Canto 12","Canto 13","Canto 14","Canto 15","Canto 16","Canto 17","Canto 18","Canto 19",
	"Canto 20","Canto 21","Canto 22","Canto 23","Canto 24","Canto 25","Canto 26","Canto 27","Canto 28","Canto 29",
	"Canto 30","Canto 31","Canto 32","Canto 33","Canto 34"
];

// this is translation sequence

const translationdata = [
	{"translationid":"dante",
		"order":0},
	{"translationid":"longfellow",
		"order":1},
	{"translationid":"norton",
		"order":2}/*,
	{"translationid":"wright",
		"order":3},
	{"translationid":"carlyle",
		"order":4}*/
];

module.exports.cantotitles = cantotitles;
module.exports.translationdata = translationdata;
