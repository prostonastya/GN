module.exports = (location) => {
	const height = 200;
	const width = location.absoluteMercatorWidthToHeight * height;
	const locationNameFontSize = location.locationName.length > 11 ?
		Math.ceil(20 * (11 / location.locationName.length)) :
		20;
	const masterNameFontSize = Math.ceil(locationNameFontSize * 0.8);

	return `
		<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
		<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
			width="${width}" height="${height}" xml:space="preserve">
			<rect width="${width - 20}" height="${height - 20}" x="10" y="10"
					fill="none" stroke="${location.isMaster && !location.dailyCheckin ? 'gold' : '#777'}"
					stroke-width="3"/>
			<rect width="100%" height="100%" x="0" y="0"
					fill="none" stroke="${location.isMaster ? 'yellowgreen' : '#999'}"
					stroke-width="10"/>
				<text x="15" y="30" font-family="Verdana" width="${width - 30}" font-size="${locationNameFontSize}">
					${location.locationName}
				</text>
				<text x="15" y="50" font-family="Verdana" font-size="${masterNameFontSize}">
					(${location.masterName})
				</text>
				<text x="${width - 15}" y="${height - 20}" width="${width - 30}" font-family="Verdana" font-size="${masterNameFontSize}" text-anchor="end">
					${location.loyalPopulation} / ${location.population}
				</text>
		</svg> 
	`;
}
;
