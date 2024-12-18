export function fixTop(e) {
	var offset = e.offsetTop
	if (e.offsetParent != null) {
		offset += fixTop(e.offsetParent)
	}
	console.log("top" + offset);
	return offset
}

export function fixLeft(e) {
	var offset = e.offsetLeft
	if (e.offsetParent != null) {
		offset += fixLeft(e.offsetParent)
	}
	console.log("left" + offset);

	return offset
}

export function setTitleTip(tip) {
	let title = __CONFIG__.VUE_APP_NAME;
	if (tip) {
		title = `(${tip})${title}`;
	}
	document.title = title;

}

