/**
* @str2json
*/
module.exports = {
	isEmpty:function(obj){
	  var empty=true;
	  for(var key in obj){
	    if(obj[key]!=undefined){ empty=false; break;}
		}
	  return empty;
	} 
}