// fixpadding.js

const dom = require("./dom");
var data = require("./appdata");

let fixpadding = {
	preprocess: function() {
		// this should calc line lengths before anything else

		console.log("in preprocess");

		let dummynode = document.createElement("div");
		dummynode.className = "textinsideframe textpage";
		dummynode.id = "dummynode";
		dummynode.style.visibility = "hidden";
		document.body.appendChild(dummynode);

		for(let currenttrans = 0; currenttrans < data.textdata.length; currenttrans++) {
			if(data.textdata[currenttrans].translationclass == "poetry") {

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
						}
					}
					console.log(`${currenttrans}, ${currentcanto}: ${maxwidth}: ${maxline}`);
				}
			} else {
				console.log("Not poetry:" + data.textdata[currenttrans].translationid);
			}
		}
		dummynode.parentNode.removeChild(dummynode); // get rid of our dummy
	},
	responsive: function(thisside) {
		const divs = document.querySelectorAll(`#${thisside.slider.id} .textframe p`);
		var div;
		let maxwidth = 0;

		if(dom.hasclass(thisside.text,"poetry")) {

			// this is poetry, figure out longest line

			thisside.text.style.paddingLeft = "0";
			thisside.text.style.paddingRight = "0";
			thisside.textinside.style.marginLeft = "0";
			thisside.textinside.style.marginRight = "0";
			thisside.textinside.style.paddingLeft = "0";
			thisside.textinside.style.paddingRight = "0";
			for(let i=0; i<divs.length; i++) {
				div = divs[i];
				div.style.display = "inline-block";

				// this is not picking up indents, I think – maybe div.clientWidth + (div.style.marginLeft + div.style.textIndent)

				if(div.clientWidth > maxwidth) {
					maxwidth = div.clientWidth + 90;
				}
				div.style.display = "block";
			}


			if((thisside.width -16 ) > maxwidth) {
				console.log(`Text width: ${thisside.width}; max line width: ${maxwidth}; calculated padding: ${(thisside.width - maxwidth-16-16)/2}px`);
				thisside.text.style.paddingLeft = "0";
				thisside.text.style.paddingRight = "0";
				thisside.textinside.style.paddingLeft = "0";
				thisside.textinside.style.paddingRight = "0";
				thisside.textinside.style.marginLeft = (thisside.width - maxwidth - 16 - 16)/2+"px";
				thisside.textinside.style.marginRight = (thisside.width - maxwidth-16 - 16)/2+"px";
			} else {
				console.log(`Too wide! Text width: ${thisside.width}; max line width: ${maxwidth}.`);
				thisside.text.style.paddingLeft = 8+"px";
				thisside.text.style.paddingRight = 8+"px";
				thisside.textinside.style.marginLeft = "0";
				thisside.textinside.style.marginRight = "0";
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
