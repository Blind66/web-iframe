var expDays = 30;
var exp = new Date(); 
exp.setTime(exp.getTime() + (expDays*24*60*60*1000));

/* INICIO URI PARSER */
var UriParser =  {

	parseRootDomain : function(url) {
	  var matches = url.match(/^((\w+):\/\/)?((\w+):?(\w+)?@)?([^\/\?:]+):?(\d+)?(\/?[^\?#]+)?\??([^#]+)?#?(\w*)/);	
	  var theDomain = matches[6];
	  
	  if(UriParser.isIp(theDomain)){
	   return theDomain;
	  }
	  var dots = theDomain.split('.');
	  var n = dots.length;
	  
	  if(n < 3){
	   return dots.join(".");
	  }
	  else{
	   var last = dots[n-1];
	   var second2l = dots[n-2];
	   var third2l = dots[n-3];
	  
	   var ext;
	   var root;
	   if(second2l.length <= 3){
		ext = second2l +"."+ last;
		root = third2l;
	   }else{
		ext = last;
		root = second2l;
	   }
	   var domain = ""+ root + "." + ext;
	   return domain;
	  }
	 },
	 
	 //private
	 isNumber : function (o) {
		return !isNaN (o-0);
	 },
	 //private
	 /**
	  */
	 isIp: function(domain){
	  var exploded = domain.split('.');
	  for(var i = 0; i < exploded.length; i++){
	   if(!UriParser.isNumber(exploded[i])){
		return false;
	   }
	  }
	  return true;
 }
}
/* FIN URI PARSER */

//Set Domain dinamically
var currentDomain = UriParser.parseRootDomain(location.href);

function Get_Cookie( check_name ) {
	// first we'll split this cookie up into name/value pairs
	// note: document.cookie only returns name=value, not the other components
	var a_all_cookies = document.cookie.split( ';' );
	var a_temp_cookie = '';
	var cookie_name = '';
	var cookie_value = '';
	var b_cookie_found = false; // set boolean t/f default f

	for ( i = 0; i < a_all_cookies.length; i++ )
	{
		// now we'll split apart each name=value pair
		a_temp_cookie = a_all_cookies[i].split( '=' );


		// and trim left/right whitespace while we're at it
		cookie_name = a_temp_cookie[0].replace(/^\s+|\s+$/g, '');

		// if the extracted name matches passed check_name
		if ( cookie_name == check_name )
		{
			b_cookie_found = true;
			// we need to handle case where cookie has no value but exists (no = sign, that is):
			if ( a_temp_cookie.length > 1 )
			{
				cookie_value = unescape( a_temp_cookie[1].replace(/^\s+|\s+$/g, '') );
			}
			// note that in cases where cookie is initialized but no value, null is returned
			return cookie_value;
			break;
		}
		a_temp_cookie = null;
		cookie_name = '';
	}
	if ( !b_cookie_found )
	{
		return null;
	}
}


function Set_Cookie( name, value, expires, path, domain, secure )
{

document.cookie = name + "=" +escape( value ) +
( ( expires ) ? ";expires=" + expires.toGMTString() : "" ) +
( ( path ) ? ";path=" + path : "" ) +
( ( domain ) ? ";domain=" + domain : "" ) +
( ( secure ) ? ";secure" : "" );


}


function Delete_Cookie( name, path, domain ) {
if ( Get_Cookie( name ) ) document.cookie = name + "=" +
( ( path ) ? ";path=" + path : "") +
( ( domain ) ? ";domain=" + domain : "" ) +
";expires=Thu, 01-Jan-1970 00:00:01 GMT";
}

function uniquevisits(){
    var sess = Get_Cookie('session');
	if (sess == null)
	{
		var count = Get_Cookie('_utz');
		if(count == null) {
			Set_Cookie('_utz',exp.getTime()+';1;1',exp, '/', currentDomain, '' );
			return 1;
		}
		else {
		
			var split=count.split(";");
			var _u=split[1];
			var _v=split[2];
			var newcount = parseInt(_u) + 1;
			_u= newcount;
			newcount = parseInt(_v) + 1;
			_v= newcount;
			Delete_Cookie('_utz');
			Set_Cookie('_utz',exp.getTime()+';'+_u+';'+_v,exp, '/', currentDomain, '' );
			return count;
		}
	}
	else
	{
		var count = Get_Cookie('_utz');
		if(count == null) {
			Set_Cookie('_utz',exp.getTime()+';1;1',exp, '/', currentDomain, '' );
			return 1;
		}
		else {
		
			var split=count.split(";");
			var _u=split[1];
			var _v=split[2];
			var newcount = parseInt(_v) + 1;
			_v=newcount;
			Delete_Cookie('_utz');
			Set_Cookie('_utz',exp.getTime()+';'+_u+';'+_v,exp, '/', currentDomain, '' );
			return count;
		}			
	
	}
	
}


function setlogin(){

	var count = Get_Cookie('csessions');
	if(count == null) {
		Set_Cookie('csessions','1',exp, '/', currentDomain, '' );
		return 1;
	}
	else {
		var newcount = parseInt(count) + 1;
		Delete_Cookie('csessions');
		Set_Cookie('csessions',newcount,exp,'/',currentDomain, '' );
		return count;
	}	
}

function isSub(){
	var count = Get_Cookie('csessions');
	if(count == null) {
		return 0;
	}
	else {
		return 1;
	}	
}

function session(){

	uniquevisits();
	var count = Get_Cookie('session');
	if(count == null) {
		Set_Cookie('session',exp.getTime(),'', '/', currentDomain, '' );
		return 1;
	}
}


function getCookieVal(offset) {
	var endstr = document.cookie.indexOf (";", offset);
	if (endstr == -1)
	endstr = document.cookie.length;
	return unescape(document.cookie.substring(offset, endstr));
}

