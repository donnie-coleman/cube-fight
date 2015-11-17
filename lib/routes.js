FlowRouter.route('/', {
  action: function() {
    BlazeLayout.render("main", {content: "cubeList"});
  }
});

FlowRouter.route('/cube/:cubeId', {
  action: function(params) {
    BlazeLayout.render("main", {content: "room"});
  }
});