
var api_key = "API_KEY_HERE";
var api_secret = "API_SECRET_HERE";
var access_token = "ACCESS_TOKEN_HERE";
var access_secret = "ACCESS_TOKEN_SECRET_HERE";

module.exports = {
	getAPIKey: function(){
		return api_key;
	},
	getAPISecret: function(){
		return api_secret;
	},
	getAccessToken: function(){
		return access_token;
	},
	getAccessTokenSecret: function(){
		return access_secret;
	}
}