

//This application takes the user input via search and parses the JSON object for the necessary data.

function parse_obj(query, user_search){
	for(var i = 0; i < query.length; i++){
		if(query[i].title === user_search){
			var id = query[i].id;
			return id;
		}
	}
	return null;
}