Meteor.startup(function () {
	Cubes.remove({});

	Cubes.insert({
	  name: "Cube A",
	  createdAt: new Date(),
	  moves: ['LMR']
	});

	Cubes.insert({
	  name: "Cube B",
	  createdAt: new Date(),
	  moves: ['CML']
	});

	Cubes.insert({
	  name: "Cube C",
	  createdAt: new Date(),
	  moves: ['RMR']
	});
});

Meteor.publish('cubes', function(id) {
	if(!id){
		Meteor._sleepForMs(2000);
		return Cubes.find(); //TODO: sort by something
	}
	else {
		return Cubes.find({_id:id});
	}
});