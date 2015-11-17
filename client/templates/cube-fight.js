Cubes = new Mongo.Collection("cubes");

function getMovesList(){
  return ["LM",
          "CM",
          "RM",
          "FS",
          "CS",
          "BS",
          "UE",
          "CE",
          "DE"];
}
function getDirectionsList(){
  return ['L','R'];
}
function getMoves(){
  return Cubes.findOne({_id:Session.get("cubeId")}, {sort:{createdAt: -1}}).moves || [];
}
function parseMove(move, undo){
  move = move.split('');
  var rot = (move[2] == "R" ? true : false);
  return {face: move[0], slice: move[1], rotate: (XOR(rot, undo) ? 'right' : 'left')};
}
function XOR(a, b){
  return (a || b) && !(a && b);
}

if (Meteor.isClient) {
  Template.moves.helpers({
    movesList: function () {
      return getMovesList();
    },
    directionsList: function () {
      return getDirectionsList();
    }
  });

  Template.moves.events({
    'click [idx]': _.debounce(function (event) {
      event.preventDefault();
      Cubes.update({_id:Session.get("cubeId")}, {$push: { moves: event.target.attributes['idx'].value }}, {upsert:true});      
    }, 500)
  });

  Template.controls.events({
    'click .reset': function (event){
      event.preventDefault();
      getMoves().map(function(move){
        Cubes.update( {_id:Session.get("cubeId")}, {$set: { moves: [] }}, {upsert:true});
      });
    }
  })
 
  Cubes.find().observeChanges({
    added: function() {
      var cubeId = Cubes.findOne()._id;
      
      Session.set("cubeId", cubeId); 
      initCube();

      YUI().use('node', 'rubik', 'rubik-queue', function(Y){
          var queue = null;
          if(Cubes.find().count() > 0) {
              queue = new Y.Queue();
              for(move of getMoves()){
                queue.add(parseMove(move, true));
              }
              queue.current = -1;
          }

          var cube = window.cube = (queue ? new Y.Rubik({queue:queue}) : new Y.Rubik());
          // cube._disabledFLick = true;
          cube.run();

          invokeSequence(cube, queue);
      });
    },
    changed: function(){
      if(!window.cube || !window.cube._cube) return;
      var moves = getMoves();
      if(!moves.length) {
        window.cube._solveFake();
      }
      else {
        var move = moves[moves.length-1];
        console.log("Move: "+move);
        if(move && move!== 'on') {
            window.cube._expectingTransition = true;
            window.cube._doMovement(parseMove(move));
        }
      }
    }
  });

  var invokeSequence = function(cube, queue) {
    var intervalId = setInterval(function(){
      cube._expectingTransition = true;
      if(!cube._redoMove())
        clearInterval(intervalId);
      }, 500);
  }
}

if(Meteor.isServer) {
  Meteor.startup(function () {
    Cubes.remove({});
    Cubes.insert({
      createdAt: new Date()
    });
  });
}