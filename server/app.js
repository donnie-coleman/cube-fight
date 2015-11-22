Meteor.startup(function () {
	Cubes.remove({});

	Cubes.insert({
	  name: "Cube A",
	  createdAt: new Date(),
	  moves: []
	});

	Cubes.insert({
	  name: "Cube B",
	  createdAt: new Date(),
	  moves: []
	});

	Cubes.insert({
	  name: "Cube C",
	  createdAt: new Date(),
	  moves: []
	});
});

Meteor.publish('cubes', function(id) {
	if(!id){
		return Cubes.find(); //TODO: sort by something, filter out everything but names
	}
	else {
		return Cubes.find({_id:id});
	}
});
