// fixpadding.js
//
// this fixes the padding. Could probably be worked into setlens?
// setlens.regular has not been looked at in a long time.

"use strict";

const dom = require("./dom");
var data = require("./appdata");

let fixpadding = {
	preprocess: function() {
		// this should calc line lengths before anything else

		let dummynode = document.createElement("div");
		dummynode.className = "textinsideframe textpage";
		dummynode.id = "dummynode";
		dummynode.style.visibility = "hidden";
		document.body.appendChild(dummynode);

		for(let currenttrans = 0; currenttrans < data.textdata.length; currenttrans++) {
			let transmaxline = "";
			let transmaxcanto, transmaxwidth = 0;
			if(data.textdata[currenttrans].translationclass == "poetry") {

				console.log(`\nRunning preprocess for ${data.textdata[currenttrans].translationid}:`);

				for(let currentcanto = 0; currentcanto < data.textdata[currenttrans].text.length; currentcanto++) {
					let workingcanto = data.textdata[currenttrans].text[currentcanto];
					dummynode.innerHTML = workingcanto;
					let paragraphs = dummynode.querySelectorAll("p");
					let maxwidth = 0;
					let maxline = "";
					for(let i=0; i<paragraphs.length; i++) {
						let paragraph = paragraphs[i];
						paragraph.style.display = "inline-block";

						// this is not picking up indents, I think – maybe div.clientWidth + (div.style.marginLeft + div.style.textIndent)
						// also notes are throwing this off: {{[0-9]*}}

						if(paragraph.clientWidth > maxwidth) {
							maxwidth = paragraph.clientWidth;
							maxline = paragraph.innerHTML;
							if(maxwidth > transmaxwidth) {
								transmaxwidth = maxwidth;
								transmaxcanto = currentcanto;
								transmaxline = maxline;
							}
						}
					}
					// console.log(`${currenttrans}, ${currentcanto}: ${maxwidth}: ${maxline}`);
				}
				console.log(`Max width: ${transmaxwidth} in canto ${transmaxcanto}: "${transmaxline}"`);
			} else {
				console.log(`\nNot poetry: ${data.textdata[currenttrans].translationid}`);
			}
		}
		dummynode.parentNode.removeChild(dummynode); // get rid of our dummy
	},
	responsive: function(thisside) {

		if(dom.hasclass(thisside.text,"poetry")) {

			const ppadding = 33; // this needs to be greater than the margin-left on p.poetry
			var divs, div;
			let maxwidth = 0;

			// this is poetry, figure out longest line

			thisside.text.style.paddingLeft = "0";
			thisside.text.style.paddingRight = "0";
			thisside.textinside.style.marginLeft = "0";
			thisside.textinside.style.marginRight = "0";
			thisside.textinside.style.paddingLeft = "0";
			thisside.textinside.style.paddingRight = "0";

			if(thisside.textinside.clientWidth > 0) {

				divs = document.querySelectorAll(`.textframe#${thisside.translation + "-" + thisside.slider.id.substring(6)} p`);

				for(let i=0; i<divs.length; i++) {

					// Bug: this is sometimes getting the old lens as well as the new lens

					div = divs[i];

					// get the amount of left margin that's being added to a line so we can factor that in

					let myindent = parseInt(dom.getStyle(div, "text-indent")) +  parseInt(dom.getStyle(div, "margin-left"));

					// change to inline-block so we can get the width

					div.style.display = "inline-block";
					let mywidth = div.clientWidth + myindent;
					// console.log(div.innerHTML + ": "+ mywidth);

					if(mywidth > maxwidth) {
						maxwidth = mywidth + 90; // where is this 90 coming from?
						maxwidth = mywidth;
					}
					div.style.display = "block";
				}

				if((thisside.width - ppadding ) > maxwidth) {
					console.log(`Text width: ${thisside.width}; max line width: ${maxwidth}; calculated padding: ${(thisside.width - maxwidth - ppadding)/2}px`);
					thisside.text.style.paddingLeft = "0";
					thisside.text.style.paddingRight = "0";
					thisside.textinside.style.paddingLeft = "0";
					thisside.textinside.style.paddingRight = "0";
					thisside.textinside.style.marginLeft = (thisside.width - maxwidth - ppadding)/2+"px";
					thisside.textinside.style.marginRight = (thisside.width - maxwidth - ppadding)/2+"px";
				} else {
					console.log(`Too wide! Text width: ${thisside.width}; max line width: ${maxwidth}.`);
					thisside.text.style.paddingLeft = 8+"px";
					thisside.text.style.paddingRight = 8+"px";
					thisside.textinside.style.marginLeft, thisside.textinside.style.marginRight = "0";
				}
			} else {

				// this is bad! should fix this.

				console.log("Error! No width! Waiting 100ms . . .");
				setTimeout(function() {
					fixpadding.responsive(thisside);
				}, 100);
			}
		} else {
			console.log("Prose, not doing anything.");
		}
	},
	regular: function(thisside) {
		const divs = document.querySelectorAll(`#${thisside.slider.id} .textframe p`);
		if(dom.hasclass(thisside.text,"poetry")) {

			let maxwidth = 0;

			// this is poetry, figure out longest line

			thisside.text.style.paddingLeft = "0";
			for(let i=0; i < divs.length; i++) {
				let div = divs[i];
				div.style.display = "inline-block";
				if(div.clientWidth > maxwidth) {
					maxwidth = div.clientWidth + 90;
				}
				div.style.display = "block";
			}

			console.log("—>text width: " + thisside.width);
			console.log("—>max width: " + maxwidth);

			thisside.text.style.paddingLeft = (thisside.width - maxwidth)/2+"px";
			thisside.text.style.paddingRight = (thisside.width - maxwidth)/2+"px";
		} else {

			// this is prose, standardized padding

			let desiredwidth = 75; // this is in vw

			console.log("—>text width: " + thisside.width);
			console.log("—>desired width: " + desiredwidth);
			console.log("—>lineheight: " + thisside.lineheight);

			//		console.log(lens.width + " "+desiredwidth);
			//		var padding = (lens.width - desiredwidth)/2;

			let padding = (100 - desiredwidth)/2;
			/*
			if((desiredwidth + 2) > lens.width) {
				thisside.text.style.paddingLeft = "1vw";
				thisside.text.style.paddingRight = "1vw";
			} else {
				*/
			thisside.text.style.paddingLeft = padding+"vw";
			thisside.text.style.paddingRight = padding+"vw";
			//		}
		}
	}
};

module.exports = fixpadding;
