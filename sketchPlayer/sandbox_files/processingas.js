// this is a template object for processing.swf calls
// replace any of these handlers in order to interact with the swf
// once start() is called, the drawing API is directly accessible from the DOM object

var ProcessingAS = {
	onLoad: function () {
		// SWF loaded; constructor called
	},
	
	onStart: function (stage) {
		// start() call; drawing APIs available
	},
	
	onStop: function (stage) {
		// stop() call; drawing APIs no longer available
	},

	onResize: function (w, h) {
		// processing canvas resized
	}
};
