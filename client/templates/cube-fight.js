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
  return Cubes.findOne().moves || [];
}
function parseMove(move, undo){
  move = move.split('');
  var rot = (move[2] == "R" ? true : false);
  return {face: move[0], slice: move[1], rotate: (XOR(rot, undo) ? 'right' : 'left')};
}
function XOR(a, b){
  return (a || b) && !(a && b);
}

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
    Cubes.update({_id:Session.get("cubeId")}, {$push: { moves: event.target.attributes['idx'].value }});      
  }, 500)
});

Template.controls.events({
  'click .reset': function (event){
    event.preventDefault();
    getMoves().map(function(move){
      Cubes.update( {_id:Session.get("cubeId")}, {$set: { moves: [] }});
    });
  }
});

var handle = Cubes.find().observeChanges({
  added: function(){
    if(!Session.get('cubeId')) return;
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
    if(!Session.get('cubeId') || !window.cube || !window.cube._cube) return;
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

Template.room.onCreated(function(){
    var self = this;
    initCube();
    var cubeId = FlowRouter.getParam('cubeId');
    Session.set('cubeId', null);

    self.autorun(function() {
      var subscription = self.subscribe('cubes', cubeId);
      Session.set('cubeId',cubeId);
    });
});

Template.room.helpers({
  cubex: function(){
    return Cubes.findOne();
  }
});

Template.room.onDestroyed(function(){
  console.log("destroying old cube session");
  Session.set('cubeId', null);
});

var invokeSequence = function(cube, queue) {
  var intervalId = setInterval(function(){
    cube._expectingTransition = true;
    if(!cube._redoMove())
      clearInterval(intervalId);
    }, 500);
}

Template.cubeList.helpers({
  cubes: function (){
    return Cubes.find();
  }
});

Template.cubeList.events({
    'click button': function (event, instance){
      event.preventDefault();
      var name = instance.$('input').val() || "(no name)"
      Cubes.insert( {name:name, moves:[], createdAt: new Date()});
    }
});

Template.cubeList.onCreated(function(){
  var self = this;
  self.autorun(function () {
    self.subscribe('cubes');
  });
});
