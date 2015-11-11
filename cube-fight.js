Moves = new Mongo.Collection("moves");

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
function getMove(index){
  return getMovesList()[index];
}
function getMoves(){
  return Moves.find({}, {sort:{createdAt: -1}}).fetch();
}
function parseMove(move, left){
  move = move.split('');
  return {face: move[0], slice: move[1], rotate: (left ? 'left' : 'right')};

}
if (Meteor.isClient) {
  Template.moves.helpers({
    move: function () {
      var moves = getMoves();
      return moves.length ? getMove(moves[0].move) : " - ";
    },
    movesList: function () {
      return getMovesList();
    }
  });

  Template.moves.events({
    'click [idx]': function (event) {
      event.preventDefault();
      Moves.insert({
        move: event.target.attributes['idx'].value,
        createdAt: new Date() // current time 
      });      
    },
    'click .reset': function (event){
      event.preventDefault();
      getMoves().map(function(move){
        Moves.remove({_id:move._id}); 
      });
    }
  });
 
  Moves.find().observeChanges({
    added: function(){
      if(!window.cube || !window.cube._cube) return;
      var moves = getMoves();
      var move = getMove(moves[0].move);
      //console.log("Moves: "+moves.map(function(move){ return "["+getMove(move.move)+":"+move.createdAt.toLocaleTimeString()+"]";}));
      //console.log("Move: "+move);
      if(move && move!== 'on'){
          window.cube._expectingTransition = true;
          window.cube._doMovement(parseMove(move));
      }
    },
    removed: function(){
      if(!window.cube || !window.cube._cube) return;
      if(Moves.find().count() === 0) {
        window.cube._solveFake();
      }
    }
  });

  Meteor.startup(function () {
    $.getScript('http://yui.yahooapis.com/3.5.1/build/yui/yui-min.js', function(){
      initCube();

      YUI().use('node','rubik', 'rubik-queue', function(Y){
          var queue = null;
          if(Moves.find().count() > 0) {
              queue = new Y.Queue();
              for(move of getMoves()){
                queue.add(parseMove(getMove(move.move), true));
              }
              queue.current = -1;
              queue._queue.reverse();
          }

          var cube = window.cube = (queue ? new Y.Rubik({queue:queue}) : new Y.Rubik());
          // cube._disabledFLick = true;
          cube.run();

          var intervalId = setInterval(function(){
            cube._expectingTransition = true;
            if(!cube._redoMove())
              clearInterval(intervalId);
          }, 500);
      });
    });
  });
}

if(Meteor.isServer) {
  Meteor.startup(function () {
    Moves.remove({}); 
  });
}