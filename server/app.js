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
		return Cubes.find({}, {fields:{name: 1}, sort: {name: 1}});
	}
	else {
		return Cubes.find({_id:id});
	}
});
