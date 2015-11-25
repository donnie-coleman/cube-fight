function getMovesList(){
  return ["LM","CM","RM","FS","CS","BS","UE","CE","DE",
          "YZ","XY","ZX"];
}
function getDirectionsList() {

  return ['L','R'];
}
function getMoves() {

  return Cubes.findOne().moves || [];
}
function parseMove(move, undo){
  move = move.split('');
  var rot = (move[2] == "R" ? true : false);
  return {face: move[0], slice: move[1], rotate: (XOR(rot, undo) ? 'right' : 'left')};
}
function XOR(a, b) {

  return (a || b) && !(a && b);
}
function invokeSequence(cube, queue) {
  var intervalId = setInterval(function(){
    cube._expectingTransition = true;
    if(!cube._redoMove())
      clearInterval(intervalId);
    }, 500);
}
function randomizeCube(number){
  number = (number && !isNaN(number) && number > 0) ? number : 20;
  var MAX_MOVES = 9;
  var MAX_DIRECTIONS = 2;
  var randomMoves = [];

  for(var i = 0; i < number; i++) {
    randomMoves.push(getMovesList()[Math.floor(Math.random()*MAX_MOVES)]+''+getDirectionsList()[Math.floor(Math.random()*MAX_DIRECTIONS)]);
  }
  return randomMoves;
}

/** MOVES **/
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

/** CONTROLS **/
Template.controls.events({
  'click .reset': function (event){
    event.preventDefault();
    getMoves().map(function(move){
      Cubes.update( {_id:Session.get("cubeId")}, {$set: { moves: [] }});
    });
  }
});

/** CUBE **/
Template.cube.onCreated(function (){
    var self = this;
    self.autorun(function(){
      self.subscribe('cubes');
    });
});
Template.cube.helpers({
  cubies: function(){
     //don't trigger a re-render the entire set of cubies on a cube change; js will do that for us
     return Tracker.nonreactive(function() {
      var c = [];

      var initialState = Cubes.findOne().initialState || CubeFight.cubies;

      c = initialState.map(function(face){
        return {faceName: face[0], className: face[1], color: face[2]};
      });

      Session.set("cubies_initialized", true);

      return c;
    });
  }
});

/** CUBE REACTORS **/
Tracker.autorun(function (c) {
    var _cubeId = FlowRouter.getParam('cubeId');

    if (!Session.get('cubeId') || //must be in A cube room
        !Session.equals('cubeId', _cubeId) || //mini-mongo updated to contain this room's cube
        !Session.equals('cubies_initialized', true) || //detect when cubie initalization is complete so we can run the cube
        Session.equals('cube_initialized', true)) //cube not already run
          return;

    initCube();

    YUI().use('node', 'rubik', 'rubik-queue', function(Y){
      var queue = null,
          _cube = Cubes.findOne();

      //don't rotate the cube if we've set its initial state already
      if(_cube && !_cube.initialState) {
          queue = new Y.Queue();
          for(move of getMoves()){
            queue.add(parseMove(move, true));
          }
          queue.current = -1;
      }

      var cube = window.cube = (queue ? new Y.Rubik({queue:queue}) : new Y.Rubik());
      // cube._disabledFLick = true;
      cube.run(); //run the cube

      invokeSequence(cube, queue); // move the cube

      Session.set('cube_initialized', true);
    });
});
Cubes.find().observeChanges({
  changed: function(id, fields) {
    if(!fields.hasOwnProperty('moves') || //updating initialState triggers a change that we don't want to re-render for
       !Session.get('cubeId') || //only look for changes when we have A cube, not all cubes
       !window.cube || // cube must have been properly initialized
       !window.cube._cube)
          return;

    var moves = getMoves();
    if(!moves.length) {
      window.cube._solveFake();
    }
    else {
      var move = moves[moves.length-1];
      console.log("Move: "+move);
      if(move && move !== 'on') {
        window.cube._expectingTransition = true;
        window.cube._doMovement(parseMove(move));
      }
    }
    //export current cube configuration to mongo
    jQuery('#cube').one('transitionend', function(){
      var list = [];
      jQuery("#cube > div.cubie").each(function(idx, cube){
          list.push([ jQuery(cube).find('span').text(), cube.className, jQuery(cube).find('div')[0].className]);
      });
      Cubes.update({_id:Session.get("cubeId")}, {$set: { initialState: list }});
    });
  }
});

/** ROOM **/
Template.room.onCreated(function(){
    var self = this;
    initCube();
    var cubeId = FlowRouter.getParam('cubeId');
    Session.set('cubeId', null);

    self.autorun(function() {
      var subscription = self.subscribe('cubes', cubeId);
      Session.set('cubeId', cubeId);
    });
});
Template.room.helpers({
  cubex: function(){
    return Cubes.findOne();
  }
});
Template.room.onDestroyed(function(){
  Session.set('cubeId', null);
  Session.set('cube_initialized', false);
  Session.set('cubies_initialized', false);
});

/** CUBE LIST **/
Template.cubeList.helpers({
  cubes: function (){
    return Cubes.find();
  }
});
Template.cubeList.events({
    'click button': function (event, instance){
      event.preventDefault();
      var name = instance.$('input').val() || "(no name)";
      Cubes.insert( {name:name, moves:randomizeCube(), createdAt: new Date()});
    }
});
Template.cubeList.onCreated(function(){
  var self = this;
  self.autorun(function () {
    self.subscribe('cubes');
  });
});