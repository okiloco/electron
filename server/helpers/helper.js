/**
* @Helpers: Funciones para reutilizar
*/
var pluralizeES= require('pluralize-es');
var pluralizeEN = require('pluralize');

module.exports = {
	isEmpty:function(obj){
	  var empty=true;
	  for(var key in obj){
	    if(obj[key]!=undefined){ empty=false; break;}
		}
	  return empty;
	},
	pluralize:function (lang,val){
		var _val = val;
		switch(lang){
			case "es":
				_val=pluralizeES(_val);
			break;
			case "en":
				_val=pluralizeEN(_val);
			break;
		}
		return _val;
	} 
}